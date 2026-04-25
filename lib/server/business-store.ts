import { randomUUID } from "crypto";
import { bayBuildContractorState, oaklandInitialState } from "@/lib/mockData";
import { applyUpdate, buildRecommendedActions, calculateReadiness } from "@/lib/scoring";
import { AppState, BusinessUpdateInput, RecommendedAction } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";

const DEMO_USER_EMAIL = "demo@insureready.local";

function toIsoDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

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

function denormalizeTimelineCategory(category: string): "document" | "business-change" | "risk-improvement" | "risk-increase" | "reminder" {
  const map: Record<string, "document" | "business-change" | "risk-improvement" | "risk-increase" | "reminder"> = {
    document: "document",
    business_change: "business-change",
    risk_improvement: "risk-improvement",
    risk_increase: "risk-increase",
    reminder: "reminder"
  };
  return map[category] ?? "business-change";
}

function normalizeAction(action: RecommendedAction): { priority: string; effort: string; status: string } {
  return {
    priority: action.priority,
    effort: action.effort,
    status: action.status === "in-progress" ? "in_progress" : action.status
  };
}

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseJsonObject<T>(value: string | null | undefined): Partial<T> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? (parsed as Partial<T>) : {};
  } catch {
    return {};
  }
}

function parseBusinessType(value: string): AppState["profile"]["businessType"] {
  if (value === "restaurant" || value === "contractor" || value === "retail" || value === "other") {
    return value;
  }
  return "other";
}

function parseEvidenceStatus(value: string): AppState["evidence"][number]["status"] {
  if (value === "current" || value === "stale" || value === "expired" || value === "missing" || value === "uploaded") {
    return value;
  }
  return "missing";
}

function toAppState(record: any): AppState {
  const profileData = parseJsonObject<AppState["profile"]>(record.profileData);
  const claimsFinancialData = parseJsonObject<AppState["claimsFinancial"]>(record.claimsFinancialData);
  const propertyData = parseJsonObject<AppState["property"]>(record.propertyData);
  const cyberSafetyData = parseJsonObject<AppState["cyberSafety"]>(record.cyberSafetyData);
  const documentationData = parseJsonObject<AppState["documentation"]>(record.documentationData);

  const scoreTrend = record.snapshots.map((snapshot: any) => ({
    date: snapshot.createdAt.toISOString().slice(0, 10),
    readiness: snapshot.overallScore,
    confidence: snapshot.confidenceScore
  }));

  return {
    profile: {
      id: record.id,
      businessName: record.businessName,
      businessType: parseBusinessType(record.businessType),
      legalEntityName: record.legalEntityName,
      description: record.description,
      operationsDescription: profileData.operationsDescription ?? record.description,
      address: record.address,
      city: profileData.city ?? "",
      state: record.state,
      zipCode: record.zipCode,
      naicsCode: profileData.naicsCode ?? "",
      industryRiskTier: profileData.industryRiskTier ?? "moderate",
      yearsInBusiness: record.yearsInBusiness,
      annualRevenue: record.annualRevenue,
      annualPremiumEstimate: profileData.annualPremiumEstimate ?? 0,
      payroll: record.payroll,
      employeeCount: record.employeeCount,
      multipleInsureds: profileData.multipleInsureds ?? false,
      installServiceMix: profileData.installServiceMix ?? "",
      customerFootTraffic: record.customerFootTraffic,
      offsiteWork: record.offsiteWork,
      vehiclesUsed: record.vehiclesUsed,
      subcontractorsUsed: record.subcontractorsUsed,
      storesCustomerData: record.storesCustomerData,
      lastUpdatedAt: record.updatedAt.toISOString()
    },
    claimsFinancial: {
      priorClaims: claimsFinancialData.priorClaims ?? parseStringArray(record.priorClaims),
      totalClaimsCount: claimsFinancialData.totalClaimsCount ?? parseStringArray(record.priorClaims).length,
      claimsOpenCount: claimsFinancialData.claimsOpenCount ?? 0,
      claimFrequencyRate: claimsFinancialData.claimFrequencyRate ?? 0,
      averageClaimSeverity: claimsFinancialData.averageClaimSeverity ?? 0,
      lossRatioEstimate: claimsFinancialData.lossRatioEstimate ?? 0.4,
      financialStabilityFlag: claimsFinancialData.financialStabilityFlag ?? "stable",
      priorInsuranceStability: claimsFinancialData.priorInsuranceStability ?? "unknown",
      priorInsuranceDeclined: claimsFinancialData.priorInsuranceDeclined ?? false,
      coverageGapMonths: claimsFinancialData.coverageGapMonths ?? 0,
      carrierChangesLast5Years: claimsFinancialData.carrierChangesLast5Years ?? 0,
      yearsSinceLastClaim:
        claimsFinancialData.yearsSinceLastClaim === undefined ? (parseStringArray(record.priorClaims).length > 0 ? 1 : null) : claimsFinancialData.yearsSinceLastClaim
    },
    property: {
      effectiveBuildingAge: propertyData.effectiveBuildingAge ?? 20,
      renovationYear: propertyData.renovationYear ?? null,
      constructionType: propertyData.constructionType ?? "Unknown",
      alarmCentralStation: propertyData.alarmCentralStation ?? false,
      sprinklered: propertyData.sprinklered ?? false,
      propertyProtectionScore: propertyData.propertyProtectionScore ?? 60,
      locationHazardIndex: propertyData.locationHazardIndex ?? 50,
      fireProtectionRating: propertyData.fireProtectionRating ?? 65,
      distanceToFireStationMiles: propertyData.distanceToFireStationMiles ?? 2,
      distanceToHydrantFeet: propertyData.distanceToHydrantFeet ?? 300,
      premisesOwnershipStatus: propertyData.premisesOwnershipStatus ?? "leased",
      buildingQualityScore: propertyData.buildingQualityScore ?? null,
      zipCode: record.locationRisk?.zipCode ?? record.zipCode,
      naturalHazardLevel: record.locationRisk?.naturalHazardLevel ?? propertyData.naturalHazardLevel ?? "medium",
      floodRisk: record.locationRisk?.floodRisk ?? propertyData.floodRisk ?? "medium",
      wildfireRisk: record.locationRisk?.wildfireRisk ?? propertyData.wildfireRisk ?? "medium",
      severeWeatherRisk: record.locationRisk?.severeWeatherRisk ?? propertyData.severeWeatherRisk ?? "medium",
      crimeOrTheftRisk: record.locationRisk?.crimeOrTheftRisk ?? propertyData.crimeOrTheftRisk ?? "medium",
      explanation: record.locationRisk?.explanation ?? propertyData.explanation ?? "Placeholder location profile."
    },
    cyberSafety: {
      cyberReadinessScore: cyberSafetyData.cyberReadinessScore ?? 55,
      safetyCultureIndicator: cyberSafetyData.safetyCultureIndicator ?? 55,
      cyberRiskPosture: cyberSafetyData.cyberRiskPosture ?? 55,
      mfaEnabled: cyberSafetyData.mfaEnabled ?? false,
      regularBackups: cyberSafetyData.regularBackups ?? false,
      incidentResponsePlan: cyberSafetyData.incidentResponsePlan ?? false,
      vendorRiskManagement: cyberSafetyData.vendorRiskManagement ?? false,
      oshaCompliant: cyberSafetyData.oshaCompliant ?? false,
      formalSafetyProgram: cyberSafetyData.formalSafetyProgram ?? false,
      employeeTrainingCadence: cyberSafetyData.employeeTrainingCadence ?? "ad_hoc"
    },
    documentation: {
      expectedFeatureCount: documentationData.expectedFeatureCount ?? 33,
      completedFeatureCount: documentationData.completedFeatureCount ?? 20,
      expectedDocuments: documentationData.expectedDocuments ?? record.evidence.map((doc: any) => doc.name),
      providedDocuments: documentationData.providedDocuments ?? record.evidence.filter((doc: any) => doc.status !== "missing").map((doc: any) => doc.name),
      missingDocuments: documentationData.missingDocuments ?? record.evidence.filter((doc: any) => doc.status === "missing").map((doc: any) => doc.name)
    },
    evidence: record.evidence.map((doc: any) => ({
      id: doc.id,
      businessId: doc.businessId,
      documentType: doc.documentType,
      name: doc.name,
      uploadedAt: doc.uploadedAt ? doc.uploadedAt.toISOString() : "",
      status: parseEvidenceStatus(doc.status),
      extractedFields: parseStringArray(doc.extractedFields),
      underwritingRelevance: doc.underwritingRelevance,
      confidenceImpact: doc.confidenceImpact
    })),
    timeline: record.timeline.map((event: any) => ({
      id: event.id,
      businessId: event.businessId,
      date: event.date.toISOString().slice(0, 10),
      title: event.title,
      description: event.description,
      scoreImpact: event.scoreImpact,
      confidenceImpact: event.confidenceImpact,
      category: denormalizeTimelineCategory(event.category)
    })),
    scoreTrend,
    renewalDate: toIsoDate(record.renewalDate)
  };
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
      locationRisk: true,
      evidence: { orderBy: { createdAt: "asc" } },
      timeline: { orderBy: { date: "desc" } },
      snapshots: { orderBy: { createdAt: "asc" } }
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

export async function upsertBusinessState(state: AppState): Promise<AppState> {
  const userId = await ensureDemoUser();
  const score = calculateReadiness(state);
  const recommendedActions = buildRecommendedActions(state);

  await prisma.$transaction(async (tx) => {
    await tx.businessProfile.upsert({
      where: { id: state.profile.id },
      update: {
        userId,
        businessName: state.profile.businessName,
        businessType: state.profile.businessType,
        legalEntityName: state.profile.legalEntityName,
        yearsInBusiness: state.profile.yearsInBusiness,
        description: state.profile.description,
        address: state.profile.address,
        zipCode: state.profile.zipCode,
        state: state.profile.state,
        annualRevenue: state.profile.annualRevenue,
        payroll: state.profile.payroll,
        employeeCount: state.profile.employeeCount,
        customerFootTraffic: state.profile.customerFootTraffic,
        offsiteWork: state.profile.offsiteWork,
        vehiclesUsed: state.profile.vehiclesUsed,
        subcontractorsUsed: state.profile.subcontractorsUsed,
        storesCustomerData: state.profile.storesCustomerData,
        priorClaims: JSON.stringify(state.claimsFinancial.priorClaims),
        renewalDate: new Date(state.renewalDate),
        profileData: JSON.stringify({
          operationsDescription: state.profile.operationsDescription,
          city: state.profile.city,
          naicsCode: state.profile.naicsCode,
          industryRiskTier: state.profile.industryRiskTier,
          annualPremiumEstimate: state.profile.annualPremiumEstimate,
          multipleInsureds: state.profile.multipleInsureds,
          installServiceMix: state.profile.installServiceMix
        }),
        claimsFinancialData: JSON.stringify(state.claimsFinancial),
        propertyData: JSON.stringify(state.property),
        cyberSafetyData: JSON.stringify(state.cyberSafety),
        documentationData: JSON.stringify(state.documentation)
      },
      create: {
        id: state.profile.id,
        userId,
        businessName: state.profile.businessName,
        businessType: state.profile.businessType,
        legalEntityName: state.profile.legalEntityName,
        yearsInBusiness: state.profile.yearsInBusiness,
        description: state.profile.description,
        address: state.profile.address,
        zipCode: state.profile.zipCode,
        state: state.profile.state,
        annualRevenue: state.profile.annualRevenue,
        payroll: state.profile.payroll,
        employeeCount: state.profile.employeeCount,
        customerFootTraffic: state.profile.customerFootTraffic,
        offsiteWork: state.profile.offsiteWork,
        vehiclesUsed: state.profile.vehiclesUsed,
        subcontractorsUsed: state.profile.subcontractorsUsed,
        storesCustomerData: state.profile.storesCustomerData,
        priorClaims: JSON.stringify(state.claimsFinancial.priorClaims),
        renewalDate: new Date(state.renewalDate),
        profileData: JSON.stringify({
          operationsDescription: state.profile.operationsDescription,
          city: state.profile.city,
          naicsCode: state.profile.naicsCode,
          industryRiskTier: state.profile.industryRiskTier,
          annualPremiumEstimate: state.profile.annualPremiumEstimate,
          multipleInsureds: state.profile.multipleInsureds,
          installServiceMix: state.profile.installServiceMix
        }),
        claimsFinancialData: JSON.stringify(state.claimsFinancial),
        propertyData: JSON.stringify(state.property),
        cyberSafetyData: JSON.stringify(state.cyberSafety),
        documentationData: JSON.stringify(state.documentation)
      }
    });

    await tx.locationRisk.upsert({
      where: { businessId: state.profile.id },
      update: {
        zipCode: state.property.zipCode,
        naturalHazardLevel: state.property.naturalHazardLevel,
        floodRisk: state.property.floodRisk,
        wildfireRisk: state.property.wildfireRisk,
        severeWeatherRisk: state.property.severeWeatherRisk,
        crimeOrTheftRisk: state.property.crimeOrTheftRisk,
        explanation: state.property.explanation
      },
      create: {
        businessId: state.profile.id,
        zipCode: state.property.zipCode,
        naturalHazardLevel: state.property.naturalHazardLevel,
        floodRisk: state.property.floodRisk,
        wildfireRisk: state.property.wildfireRisk,
        severeWeatherRisk: state.property.severeWeatherRisk,
        crimeOrTheftRisk: state.property.crimeOrTheftRisk,
        explanation: state.property.explanation
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
          extractedFields: JSON.stringify(doc.extractedFields ?? []),
          underwritingRelevance: doc.underwritingRelevance,
          confidenceImpact: doc.confidenceImpact
        }))
      });
    }

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

    await tx.recommendedAction.deleteMany({ where: { businessId: state.profile.id } });
    if (recommendedActions.length > 0) {
      await tx.recommendedAction.createMany({
        data: recommendedActions.map((action) => {
          const normalized = normalizeAction(action);
          return {
            id: `${state.profile.id}-${action.id}`,
            businessId: state.profile.id,
            title: action.title,
            description: action.description,
            priority: normalized.priority,
            effort: normalized.effort,
            expectedScoreImpact: action.expectedScoreImpact,
            status: normalized.status,
            category: action.category
          };
        })
      });
    }

    await tx.readinessSnapshot.create({
      data: {
        businessId: state.profile.id,
        overallScore: score.overallScore,
        confidenceScore: score.confidenceScore,
        dataCompleteness: score.documentationCompleteness,
        classificationClarity: score.operational,
        financialStability: score.claimsFinancial,
        lossHistory: score.claimsFinancial,
        propertyControls: score.propertyLocation,
        operationalControls: score.cyberSafety,
        locationContext: score.propertyLocation,
        operationalScore: score.operational,
        claimsFinancialScore: score.claimsFinancial,
        propertyLocationScore: score.propertyLocation,
        cyberSafetyScore: score.cyberSafety,
        documentationScore: score.documentationCompleteness,
        explanation: score.explanation,
        strengths: JSON.stringify(score.strengths),
        concerns: JSON.stringify(score.concerns)
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
