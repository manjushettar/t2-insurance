import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { Prisma } from "@prisma/client";
import { bayBuildContractorState, oaklandInitialState } from "@/lib/mockData";
import {
  AppState,
  BusinessUpdateInput,
  EngineCompleteness,
  EngineContributionRow,
  EngineKnockout,
  EnginePillarResult,
  EngineRawFeatures,
  EngineRecommendation,
  EngineScoreResult,
  RiskLevel,
  UnderwritingProfile
} from "@/lib/types";
import { applyUpdate } from "@/lib/scoring";
import { prisma } from "@/lib/server/prisma";

const DEMO_USER_EMAIL = "demo@insuro.local";

function normalizeTimelineCategory(category: string): string {
  const map: Record<string, string> = {
    document: "document",
    "business-change": "business_change",
    "risk-improvement": "risk_improvement",
    "risk-increase": "risk_increase",
    reminder: "reminder"
  };
  return map[category] ?? "business_change";
}

function denormalizeTimelineCategory(
  category: string
): "document" | "business-change" | "risk-improvement" | "risk-increase" | "reminder" {
  const map: Record<string, "document" | "business-change" | "risk-improvement" | "risk-increase" | "reminder"> = {
    document: "document",
    business_change: "business-change",
    risk_improvement: "risk-improvement",
    risk_increase: "risk-increase",
    reminder: "reminder"
  };
  return map[category] ?? "business-change";
}

function asObject<T>(value: unknown): Partial<T> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<T>) : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function parseRiskLevel(value: number | undefined | null): RiskLevel {
  if (value === null || value === undefined) return "medium";
  if (value >= 67) return "high";
  if (value >= 34) return "medium";
  return "low";
}

function parseEvidenceStatus(value: string): AppState["evidence"][number]["status"] {
  if (value === "current" || value === "stale" || value === "expired" || value === "missing" || value === "uploaded") {
    return value;
  }
  return "missing";
}

function mapPriority(projectedGain: number): "high" | "medium" | "low" {
  if (projectedGain >= 8) return "high";
  if (projectedGain >= 4) return "medium";
  return "low";
}

function computeEngineCompleteness(rawFeatures: EngineRawFeatures): EngineCompleteness {
  const requiredFeatures = [
    "business_name",
    "entity_type",
    "years_in_business",
    "naics_code",
    "physical_address",
    "annual_revenue",
    "employee_count_ft",
    "total_claims_count",
    "prior_carrier_name",
    "building_construction_type",
    "building_year_built",
    "primary_zip_code",
    "fire_alarm_present",
    "sprinkler_system_present",
    "mfa_implemented",
    "osha_compliance"
  ] as const;

  const missingFeatures = requiredFeatures.filter((key) => {
    const value = rawFeatures[key];
    return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  });

  return {
    percentage: Math.round(((requiredFeatures.length - missingFeatures.length) / requiredFeatures.length) * 100),
    provided_feature_count: requiredFeatures.length - missingFeatures.length,
    expected_feature_count: requiredFeatures.length,
    missing_features: [...missingFeatures]
  };
}

function buildRawFeatures(state: AppState): EngineRawFeatures {
  return {
    business_name: state.profile.businessName,
    entity_type: state.profile.businessType,
    physical_address: `${state.profile.address}, ${state.profile.city}, ${state.profile.state} ${state.profile.zipCode}`.trim(),
    primary_zip_code: state.profile.zipCode,
    years_in_business: state.profile.yearsInBusiness,
    naics_code: state.profile.naicsCode,
    description_of_operations: state.profile.operationsDescription || state.profile.description,
    number_of_members: Math.max(state.profile.employeeCount, 1),
    additional_named_insureds: state.profile.multipleInsureds ? [state.profile.legalEntityName] : [],
    annual_revenue: state.profile.annualRevenue,
    employee_count_ft: state.profile.employeeCount,
    employee_count_pt: 0,
    credit_score: null,
    sales_percentage_installation_service: state.profile.installServiceMix ? 50 : null,
    total_claims_count: state.claimsFinancial.totalClaimsCount,
    total_claims_paid: state.claimsFinancial.totalClaimsCount * state.claimsFinancial.averageClaimSeverity,
    open_claims_count: state.claimsFinancial.claimsOpenCount,
    loss_run_years: state.claimsFinancial.yearsSinceLastClaim,
    prior_carrier_name: "",
    prior_policy_premium: state.profile.annualPremiumEstimate || null,
    prior_policy_dates: "",
    prior_coverage_declined: state.claimsFinancial.priorInsuranceDeclined,
    decline_remediated: !state.claimsFinancial.priorInsuranceDeclined,
    decline_evidence_provided: state.evidence.some((doc) => doc.documentType === "loss-runs" && doc.status !== "missing"),
    building_construction_type: state.property.constructionType,
    building_year_built:
      state.property.effectiveBuildingAge > 0 ? new Date().getFullYear() - state.property.effectiveBuildingAge : null,
    building_year_updated: state.property.renovationYear,
    square_footage: null,
    leased_area: state.property.premisesOwnershipStatus === "leased" ? 1 : null,
    fire_alarm_present: state.property.alarmCentralStation,
    sprinkler_system_present: state.property.sprinklered,
    fire_extinguishers_present: true,
    distance_to_fire_station: state.property.distanceToFireStationMiles,
    distance_to_fire_hydrant: state.property.distanceToHydrantFeet,
    mfa_implemented: state.cyberSafety.mfaEnabled,
    data_backups_regular: state.cyberSafety.regularBackups,
    incident_response_plan: state.cyberSafety.incidentResponsePlan,
    third_party_vendor_risk_management: state.cyberSafety.vendorRiskManagement,
    formal_safety_program: state.cyberSafety.formalSafetyProgram,
    employee_safety_training: state.cyberSafety.employeeTrainingCadence !== "none" && state.cyberSafety.employeeTrainingCadence !== "ad_hoc",
    osha_compliance: state.cyberSafety.oshaCompliant,
    roof_replaced_recently: Boolean(state.property.renovationYear && state.property.renovationYear >= new Date().getFullYear() - 10),
    no_visible_water_damage: true,
    electrical_updated: Boolean(state.property.renovationYear && state.property.renovationYear >= new Date().getFullYear() - 15),
    exterior_well_maintained: (state.property.buildingQualityScore ?? 60) >= 65,
    hvac_serviced_recently: Boolean(state.property.renovationYear && state.property.renovationYear >= new Date().getFullYear() - 5),
    bankruptcy_recent: state.claimsFinancial.financialStabilityFlag === "distressed",
    prior_cancellation: state.claimsFinancial.coverageGapMonths > 0,
    cancellation_remediated: state.claimsFinancial.coverageGapMonths === 0,
    hazardous_exposures_disclosed: state.profile.subcontractorsUsed || state.profile.offsiteWork,
    foreign_operations: false,
    criminal_activity_disclosed: false
  };
}

async function runEngine(rawFeatures: EngineRawFeatures): Promise<{ scoreResult: EngineScoreResult; reportText: string }> {
  const completeness = computeEngineCompleteness(rawFeatures);
  const inputPath = path.join(os.tmpdir(), `insuro-engine-input-${randomUUID()}.json`);
  const outputPath = path.join(os.tmpdir(), `insuro-engine-output-${randomUUID()}.txt`);
  await fs.writeFile(inputPath, JSON.stringify(rawFeatures), "utf8");

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn("python3", ["scripts/run_engine.py", inputPath, outputPath], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"]
      });

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        errorOutput += chunk.toString();
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve(output.trim());
          return;
        }
        reject(new Error(errorOutput.trim() || `engine.py exited with code ${code}`));
      });
    });

    const parsed = JSON.parse(stdout) as {
      composite_score: number;
      raw_weighted_score: number;
      completeness_ratio: number;
      pillars: Array<{ name: string; weight: number; score: number; confidence: number }>;
      knockouts: Array<{ trigger: string; cap: number; explanation: string; remediation: string }>;
      recommendations: Array<{ feature: string; action: string; projected_gain: number }>;
      contribution_table: Array<{
        name: string;
        pillar: string;
        raw_value: string | number | boolean | null;
        normalized: number | null;
        weight_in_pillar: number;
        points_contributed: number;
        provided: boolean;
      }>;
    };
    const reportText = await fs.readFile(outputPath, "utf8");

    return {
      scoreResult: {
        composite_score: Math.round(parsed.composite_score),
        raw_weighted_score: parsed.raw_weighted_score,
        pillars: parsed.pillars.map((pillar) => ({
          pillar_key: pillar.name as EnginePillarResult["pillar_key"],
          pillar_label: pillar.name
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
          score: Math.round(pillar.score),
          confidence: Math.round(pillar.confidence * 100),
          weighted_points: Number((pillar.score * pillar.weight).toFixed(2))
        })),
        contribution_table: parsed.contribution_table.map((contribution) => ({
          feature_key: contribution.name,
          feature_label: contribution.name.split("_").join(" "),
          pillar_key: contribution.pillar,
          raw_value: contribution.raw_value ?? null,
          normalized_value: contribution.normalized,
          weight: contribution.weight_in_pillar,
          points_contributed: Number(contribution.points_contributed.toFixed(2)),
          confidence: contribution.provided ? 1 : 0
        })),
        knockouts: parsed.knockouts.map((knockout) => ({
          rule_key: knockout.trigger,
          label: knockout.trigger.split("_").join(" "),
          triggered: true,
          explanation: knockout.explanation,
          remediation: knockout.remediation,
          capped_score: knockout.cap
        })),
        recommendations: parsed.recommendations.map((recommendation) => ({
          id: recommendation.feature,
          title: recommendation.action,
          description: recommendation.action,
          category: recommendation.feature,
          estimated_gain: Number(recommendation.projected_gain.toFixed(2)),
          priority: mapPriority(recommendation.projected_gain)
        })),
        completeness: {
          ...completeness,
          percentage: Math.round(parsed.completeness_ratio * 100)
        }
      },
      reportText
    };
  } finally {
    await Promise.allSettled([fs.unlink(inputPath), fs.unlink(outputPath)]);
  }
}

async function buildUnderwritingProfile(state: AppState): Promise<{ profile: UnderwritingProfile; reportText: string }> {
  const rawFeatures = buildRawFeatures(state);
  const { scoreResult, reportText } = await runEngine(rawFeatures);
  return {
    profile: {
      rawFeatures,
      zipAreaFeatures: state.underwritingProfile?.zipAreaFeatures ?? null,
      scoreResult
    },
    reportText
  };
}

function toAppState(record: {
  id: string;
  businessName: string;
  businessType: string;
  legalEntityName: string;
  description: string;
  address: string;
  zipCode: string;
  state: string;
  updatedAt: Date;
  evidence: Array<{
    id: string;
    businessId: string;
    documentType: string;
    name: string;
    uploadedAt: Date | null;
    status: string;
    extractedFields: unknown;
    underwritingRelevance: string;
    confidenceImpact: number;
  }>;
  timeline: Array<{
    id: string;
    businessId: string;
    date: Date;
    title: string;
    description: string;
    scoreImpact: number;
    confidenceImpact: number;
    category: string;
  }>;
  underwritingProfiles: Array<{
    rawFeatures: unknown;
    zipAreaFeatures: unknown;
    scoreRuns: Array<{
      compositeScore: number;
      rawWeightedScore: number;
      pillars: unknown;
      contributionTable: unknown;
      knockouts: unknown;
      recommendations: unknown;
      completeness: unknown;
      createdAt: Date;
    }>;
  }>;
}) {
  const latestProfile = record.underwritingProfiles[0];
  const rawFeatures = asObject<EngineRawFeatures>(latestProfile?.rawFeatures);
  const latestScore = latestProfile?.scoreRuns[0];
  const scoreResult: EngineScoreResult | null = latestScore
    ? {
        composite_score: latestScore.compositeScore,
        raw_weighted_score: latestScore.rawWeightedScore,
        pillars: asArray<EnginePillarResult>(latestScore.pillars),
        contribution_table: asArray<EngineContributionRow>(latestScore.contributionTable),
        knockouts: asArray<EngineKnockout>(latestScore.knockouts),
        recommendations: asArray<EngineRecommendation>(latestScore.recommendations),
        completeness: asObject<EngineCompleteness>(latestScore.completeness) as EngineCompleteness
      }
    : null;

  const businessType =
    record.businessType === "restaurant" ||
    record.businessType === "contractor" ||
    record.businessType === "retail" ||
    record.businessType === "other"
      ? record.businessType
      : "other";

  const profile: AppState["profile"] = {
    id: record.id,
    businessName: record.businessName,
    businessType,
    legalEntityName: record.legalEntityName,
    description: record.description,
    operationsDescription: rawFeatures.description_of_operations ?? record.description,
    address: record.address,
    city: "",
    state: record.state,
    zipCode: record.zipCode,
    naicsCode: rawFeatures.naics_code ?? "",
    industryRiskTier: "moderate",
    yearsInBusiness: rawFeatures.years_in_business ?? 0,
    annualRevenue: rawFeatures.annual_revenue ?? 0,
    annualPremiumEstimate: rawFeatures.prior_policy_premium ?? 0,
    payroll: 0,
    employeeCount: (rawFeatures.employee_count_ft ?? 0) + (rawFeatures.employee_count_pt ?? 0),
    multipleInsureds: (rawFeatures.additional_named_insureds?.length ?? 0) > 0,
    installServiceMix: rawFeatures.sales_percentage_installation_service?.toString() ?? "",
    customerFootTraffic: false,
    offsiteWork: Boolean(rawFeatures.hazardous_exposures_disclosed),
    vehiclesUsed: false,
    subcontractorsUsed: false,
    storesCustomerData: false,
    lastUpdatedAt: record.updatedAt.toISOString()
  };

  const evidence = record.evidence.map((doc) => ({
    id: doc.id,
    businessId: doc.businessId,
    documentType: doc.documentType,
    name: doc.name,
    uploadedAt: doc.uploadedAt ? doc.uploadedAt.toISOString() : "",
    status: parseEvidenceStatus(doc.status),
    extractedFields: asStringArray(doc.extractedFields),
    underwritingRelevance: doc.underwritingRelevance,
    confidenceImpact: doc.confidenceImpact
  }));

  const state: AppState = {
    profile,
    underwritingProfile: {
      rawFeatures: rawFeatures as EngineRawFeatures,
      zipAreaFeatures: (latestProfile?.zipAreaFeatures as UnderwritingProfile["zipAreaFeatures"]) ?? null,
      scoreResult
    },
    claimsFinancial: {
      priorClaims: [],
      totalClaimsCount: rawFeatures.total_claims_count ?? 0,
      claimsOpenCount: rawFeatures.open_claims_count ?? 0,
      claimFrequencyRate:
        rawFeatures.years_in_business && rawFeatures.years_in_business > 0
          ? Number(((rawFeatures.total_claims_count ?? 0) / rawFeatures.years_in_business).toFixed(2))
          : 0,
      averageClaimSeverity:
        (rawFeatures.total_claims_count ?? 0) > 0 && rawFeatures.total_claims_paid
          ? Number((rawFeatures.total_claims_paid / Math.max(rawFeatures.total_claims_count ?? 0, 1)).toFixed(2))
          : 0,
      lossRatioEstimate:
        rawFeatures.prior_policy_premium && rawFeatures.total_claims_paid !== undefined
          ? rawFeatures.total_claims_paid / rawFeatures.prior_policy_premium
          : 0,
      financialStabilityFlag: rawFeatures.bankruptcy_recent ? "distressed" : "stable",
      priorInsuranceStability: rawFeatures.prior_cancellation ? "minor_gaps" : "stable",
      priorInsuranceDeclined: Boolean(rawFeatures.prior_coverage_declined),
      coverageGapMonths: rawFeatures.prior_cancellation ? 1 : 0,
      carrierChangesLast5Years: 0,
      yearsSinceLastClaim: rawFeatures.loss_run_years ?? null
    },
    property: {
      effectiveBuildingAge:
        rawFeatures.building_year_built ? Math.max(new Date().getFullYear() - rawFeatures.building_year_built, 0) : 20,
      renovationYear: rawFeatures.building_year_updated ?? null,
      constructionType: rawFeatures.building_construction_type ?? "Unknown",
      alarmCentralStation: Boolean(rawFeatures.fire_alarm_present),
      sprinklered: Boolean(rawFeatures.sprinkler_system_present),
      propertyProtectionScore: 60,
      locationHazardIndex: 50,
      fireProtectionRating: 60,
      distanceToFireStationMiles: rawFeatures.distance_to_fire_station ?? 2,
      distanceToHydrantFeet: rawFeatures.distance_to_fire_hydrant ?? 300,
      premisesOwnershipStatus: rawFeatures.leased_area ? "leased" : "owned",
      buildingQualityScore: null,
      zipCode: rawFeatures.primary_zip_code ?? record.zipCode,
      naturalHazardLevel: parseRiskLevel((latestProfile?.zipAreaFeatures as { vacancy_rate?: number } | null)?.vacancy_rate),
      floodRisk: "medium",
      wildfireRisk: "medium",
      severeWeatherRisk: "medium",
      crimeOrTheftRisk: "medium",
      explanation: "Property and location profile reconstructed from stored engine inputs."
    },
    cyberSafety: {
      cyberReadinessScore: rawFeatures.mfa_implemented || rawFeatures.data_backups_regular ? 70 : 40,
      safetyCultureIndicator: rawFeatures.formal_safety_program || rawFeatures.employee_safety_training ? 70 : 45,
      cyberRiskPosture:
        rawFeatures.mfa_implemented || rawFeatures.data_backups_regular || rawFeatures.incident_response_plan ? 65 : 40,
      mfaEnabled: Boolean(rawFeatures.mfa_implemented),
      regularBackups: Boolean(rawFeatures.data_backups_regular),
      incidentResponsePlan: Boolean(rawFeatures.incident_response_plan),
      vendorRiskManagement: Boolean(rawFeatures.third_party_vendor_risk_management),
      oshaCompliant: Boolean(rawFeatures.osha_compliance),
      formalSafetyProgram: Boolean(rawFeatures.formal_safety_program),
      employeeTrainingCadence: rawFeatures.employee_safety_training ? "monthly" : "ad_hoc"
    },
    documentation: {
      expectedFeatureCount: scoreResult?.completeness.expected_feature_count ?? 16,
      completedFeatureCount: scoreResult?.completeness.provided_feature_count ?? 0,
      expectedDocuments: evidence.map((doc) => doc.name),
      providedDocuments: evidence.filter((doc) => doc.status !== "missing").map((doc) => doc.name),
      missingDocuments: evidence.filter((doc) => doc.status === "missing").map((doc) => doc.name)
    },
    evidence,
    timeline: record.timeline.map((event) => ({
      id: event.id,
      businessId: event.businessId,
      date: event.date.toISOString().slice(0, 10),
      title: event.title,
      description: event.description,
      scoreImpact: event.scoreImpact,
      confidenceImpact: event.confidenceImpact,
      category: denormalizeTimelineCategory(event.category)
    })),
    scoreTrend: latestScore
      ? [
          {
            date: latestScore.createdAt.toISOString().slice(0, 10),
            readiness: latestScore.compositeScore,
            confidence: scoreResult?.completeness.percentage ?? latestScore.compositeScore
          }
        ]
      : [],
    renewalDate: ""
  };

  return state;
}

async function ensureDemoUser(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (existing) return existing.id;
  const created = await prisma.user.create({
    data: {
      email: DEMO_USER_EMAIL,
      name: "Demo User"
    }
  });
  return created.id;
}

async function loadBusinessRecord(businessId: string) {
  return prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: {
      evidence: { orderBy: { createdAt: "asc" } },
      timeline: { orderBy: { date: "desc" } },
      underwritingProfiles: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          scoreRuns: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    }
  });
}

export async function listBusinesses() {
  return prisma.businessProfile.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      businessName: true,
      businessType: true,
      updatedAt: true
    }
  });
}

export async function getBusinessStateById(businessId: string): Promise<AppState | null> {
  const record = await loadBusinessRecord(businessId);
  if (!record) return null;
  return toAppState(record);
}

function buildSourceDocumentSeed(state: AppState) {
  return state.evidence
    .filter((doc) => doc.status === "uploaded" || doc.status === "current")
    .map((doc) => ({
      businessId: state.profile.id,
      evidenceDocumentId: doc.id,
      documentType: doc.documentType,
      originalFileName: doc.name,
      mimeType: doc.documentType.includes("photo") ? "image/*" : "application/octet-stream",
      storageProvider: "local",
      storageKey: doc.id,
      parseStatus: "pending",
      semanticStatus: "pending",
      summary: doc.underwritingRelevance,
      extractionMetadata: {
        extractedFields: doc.extractedFields,
        confidenceImpact: doc.confidenceImpact
      }
    }));
}

export async function upsertBusinessState(state: AppState): Promise<AppState> {
  const userId = await ensureDemoUser();
  const { profile: underwritingProfile, reportText } = await buildUnderwritingProfile(state);
  const scoreResult = underwritingProfile.scoreResult;
  if (!scoreResult) {
    throw new Error("Engine did not return a score result.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessProfile.upsert({
      where: { id: state.profile.id },
      update: {
        userId,
        businessName: state.profile.businessName,
        businessType: state.profile.businessType,
        legalEntityName: state.profile.legalEntityName,
        description: state.profile.description,
        address: state.profile.address,
        zipCode: state.profile.zipCode,
        state: state.profile.state
      },
      create: {
        id: state.profile.id,
        userId,
        businessName: state.profile.businessName,
        businessType: state.profile.businessType,
        legalEntityName: state.profile.legalEntityName,
        description: state.profile.description,
        address: state.profile.address,
        zipCode: state.profile.zipCode,
        state: state.profile.state
      }
    });

    const latestUnderwriting = await tx.underwritingProfile.findFirst({
      where: { businessId: state.profile.id },
      orderBy: { version: "desc" },
      select: { version: true }
    });

    const nextVersion = (latestUnderwriting?.version ?? 0) + 1;

    const profileRecord = await tx.underwritingProfile.create({
      data: {
        businessId: state.profile.id,
        version: nextVersion,
        rawFeatures: toJson(underwritingProfile.rawFeatures),
        zipAreaFeatures: toJson(underwritingProfile.zipAreaFeatures ?? null),
        acordFlags: toJson({
          bankruptcy_recent: underwritingProfile.rawFeatures.bankruptcy_recent,
          prior_cancellation: underwritingProfile.rawFeatures.prior_cancellation,
          hazardous_exposures_disclosed: underwritingProfile.rawFeatures.hazardous_exposures_disclosed,
          foreign_operations: underwritingProfile.rawFeatures.foreign_operations,
          criminal_activity_disclosed: underwritingProfile.rawFeatures.criminal_activity_disclosed
        }),
        synthetic: true,
        completenessHint: toJson(scoreResult.completeness)
      }
    });

    await tx.evidenceDocument.deleteMany({ where: { businessId: state.profile.id } });
    if (state.evidence.length > 0) {
      await tx.evidenceDocument.createMany({
        data: state.evidence.map((doc) => ({
          id: doc.id || randomUUID(),
          businessId: state.profile.id,
          documentType: doc.documentType,
          name: doc.name,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : null,
          status: doc.status,
          extractedFields: toJson(doc.extractedFields),
          underwritingRelevance: doc.underwritingRelevance,
          confidenceImpact: doc.confidenceImpact
        }))
      });
    }

    await tx.documentFact.deleteMany({ where: { businessId: state.profile.id } });
    await tx.documentChunk.deleteMany({ where: { businessId: state.profile.id } });
    await tx.sourceDocument.deleteMany({ where: { businessId: state.profile.id } });
    const sourceDocuments = buildSourceDocumentSeed(state);
    if (sourceDocuments.length > 0) {
      await tx.sourceDocument.createMany({ data: sourceDocuments });
    }
    await tx.sourceDocument.create({
      data: {
        businessId: state.profile.id,
        documentType: "engine-score-report",
        originalFileName: `insuroscore-${state.profile.id}.txt`,
        mimeType: "text/plain",
        storageProvider: "database",
        storageKey: `score-run-${state.profile.id}`,
        parseStatus: "parsed",
        semanticStatus: "indexed",
        rawText: reportText,
        summary: `Engine score report for ${state.profile.businessName}`,
        extractionMetadata: toJson({
          composite_score: scoreResult.composite_score,
          raw_weighted_score: scoreResult.raw_weighted_score
        })
      }
    });

    await tx.timelineEvent.deleteMany({ where: { businessId: state.profile.id } });
    if (state.timeline.length > 0) {
      await tx.timelineEvent.createMany({
        data: state.timeline.map((event) => ({
          id: event.id || randomUUID(),
          businessId: state.profile.id,
          date: new Date(event.date),
          title: event.title,
          description: event.description,
          scoreImpact: event.scoreImpact,
          confidenceImpact: event.confidenceImpact,
          category: normalizeTimelineCategory(event.category)
        }))
      });
    }

    await tx.scoreRun.create({
      data: {
        businessId: state.profile.id,
        underwritingProfileId: profileRecord.id,
        engineVersion: "python-engine-v1",
        compositeScore: scoreResult.composite_score,
        rawWeightedScore: scoreResult.raw_weighted_score,
        pillars: toJson(scoreResult.pillars),
        contributionTable: toJson(scoreResult.contribution_table),
        knockouts: toJson(scoreResult.knockouts),
        recommendations: toJson(scoreResult.recommendations),
        completeness: toJson(scoreResult.completeness),
        synthetic: true
      }
    });
  });

  const latest = await getBusinessStateById(state.profile.id);
  if (!latest) {
    throw new Error("Failed to persist business state.");
  }
  return latest;
}

export async function applyBusinessUpdate(businessId: string, input: BusinessUpdateInput): Promise<AppState> {
  const current = await getBusinessStateById(businessId);
  if (!current) {
    throw new Error("Business not found.");
  }
  const next = applyUpdate(current, input);
  return upsertBusinessState(next);
}

export async function seedDemoState(preset: "oakland" | "contractor"): Promise<AppState> {
  const state = preset === "contractor" ? bayBuildContractorState : oaklandInitialState;
  return upsertBusinessState(state);
}
