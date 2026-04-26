import {
  AppState,
  BusinessProfile,
  BusinessType,
  CyberSafetyProfile,
  DocumentationProfile,
  EngineRawFeatures,
  EvidenceDocument,
  FinancialStabilityFlag,
  IndustryRiskTier,
  PremisesOwnershipStatus,
  PriorInsuranceStability,
  PropertyProfile
} from "@/lib/types";

export interface OnboardingInput {
  businessName: string;
  businessType: BusinessType;
  legalEntityName: string;
  description: string;
  operationsDescription: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  naicsCode: string;
  industryRiskTier: IndustryRiskTier;
  annualRevenue: number;
  annualPremiumEstimate: number;
  payroll: number;
  employeeCount: number;
  yearsInBusiness: number;
  multipleInsureds: boolean;
  installServiceMix: string;
  customerFootTraffic: boolean;
  offsiteWork: boolean;
  vehiclesUsed: boolean;
  subcontractorsUsed: boolean;
  storesCustomerData: boolean;
  priorClaims?: string;
  claimsOpenCount: number;
  averageClaimSeverity: number;
  lossRatioEstimate: number;
  financialStabilityFlag: FinancialStabilityFlag;
  priorInsuranceStability: PriorInsuranceStability;
  priorInsuranceDeclined: boolean;
  coverageGapMonths: number;
  carrierChangesLast5Years: number;
  yearsSinceLastClaim?: number;
  effectiveBuildingAge: number;
  renovationYear?: number;
  constructionType: string;
  alarmCentralStation: boolean;
  sprinklered: boolean;
  propertyProtectionScore: number;
  locationHazardIndex: number;
  fireProtectionRating: number;
  distanceToFireStationMiles: number;
  distanceToHydrantFeet: number;
  premisesOwnershipStatus: PremisesOwnershipStatus;
  buildingQualityScore?: number;
  cyberReadinessScore: number;
  safetyCultureIndicator: number;
  cyberRiskPosture: number;
  mfaEnabled: boolean;
  regularBackups: boolean;
  incidentResponsePlan: boolean;
  vendorRiskManagement: boolean;
  oshaCompliant: boolean;
  formalSafetyProgram: boolean;
  employeeTrainingCadence: CyberSafetyProfile["employeeTrainingCadence"];
  documents?: string;
}

function splitList(value?: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function baselineEvidence(id: string, input: OnboardingInput): EvidenceDocument[] {
  const docs: EvidenceDocument[] = [
    {
      id: `doc-license-${id}`,
      businessId: id,
      documentType: "business-license",
      name: "Business License",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Entity verification and operating authority.",
      confidenceImpact: -4
    },
    {
      id: `doc-loss-${id}`,
      businessId: id,
      documentType: "loss-runs",
      name: "Loss Runs",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Validates claims frequency, severity, and open claim status.",
      confidenceImpact: -8
    },
    {
      id: `doc-financial-${id}`,
      businessId: id,
      documentType: "financial-statements",
      name: "Financial Statements",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Supports solvency review and premium capacity assumptions.",
      confidenceImpact: -7
    },
    {
      id: `doc-payroll-${id}`,
      businessId: id,
      documentType: "payroll-report",
      name: "Payroll Report",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Supports exposure measurement and workers comp review.",
      confidenceImpact: -6
    },
    {
      id: `doc-property-${id}`,
      businessId: id,
      documentType: "property-inspection",
      name: "Property Inspection Report",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Supports property protection and building condition review.",
      confidenceImpact: -6
    }
  ];

  if (input.businessType === "restaurant") {
    docs.push({
      id: `doc-fire-${id}`,
      businessId: id,
      documentType: "fire-suppression-inspection",
      name: "Fire Suppression Inspection",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Important restaurant-specific property control evidence.",
      confidenceImpact: -8
    });
  }

  if (input.subcontractorsUsed) {
    docs.push({
      id: `doc-coi-${id}`,
      businessId: id,
      documentType: "subcontractor-coi",
      name: "Subcontractor COIs",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Documents transfer-of-risk for outsourced operations.",
      confidenceImpact: -8
    });
  }

  if (input.vehiclesUsed) {
    docs.push({
      id: `doc-driver-${id}`,
      businessId: id,
      documentType: "driver-list",
      name: "Driver List",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Supports vehicle exposure review and driver screening.",
      confidenceImpact: -7
    });
  }

  if (input.storesCustomerData) {
    docs.push({
      id: `doc-cyber-${id}`,
      businessId: id,
      documentType: "cyber-controls",
      name: "Cyber Controls Checklist",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Documents MFA, backups, and incident response controls.",
      confidenceImpact: -6
    });
  }

  return docs;
}

function locationProfile(input: OnboardingInput): PropertyProfile {
  return {
    effectiveBuildingAge: input.effectiveBuildingAge,
    renovationYear: input.renovationYear ?? null,
    constructionType: input.constructionType,
    alarmCentralStation: input.alarmCentralStation,
    sprinklered: input.sprinklered,
    propertyProtectionScore: input.propertyProtectionScore,
    locationHazardIndex: input.locationHazardIndex,
    fireProtectionRating: input.fireProtectionRating,
    distanceToFireStationMiles: input.distanceToFireStationMiles,
    distanceToHydrantFeet: input.distanceToHydrantFeet,
    premisesOwnershipStatus: input.premisesOwnershipStatus,
    buildingQualityScore: input.buildingQualityScore ?? null,
    zipCode: input.zipCode,
    naturalHazardLevel: input.locationHazardIndex >= 75 ? "high" : input.locationHazardIndex >= 45 ? "medium" : "low",
    floodRisk: input.locationHazardIndex >= 70 ? "high" : input.locationHazardIndex >= 40 ? "medium" : "low",
    wildfireRisk: input.locationHazardIndex >= 65 ? "high" : input.locationHazardIndex >= 35 ? "medium" : "low",
    severeWeatherRisk: input.locationHazardIndex >= 60 ? "high" : input.locationHazardIndex >= 30 ? "medium" : "low",
    crimeOrTheftRisk: input.locationHazardIndex >= 55 ? "high" : input.locationHazardIndex >= 25 ? "medium" : "low",
    explanation: "Initial location profile derived from onboarding values. Replace with external hazard data when available."
  };
}

function buildDocumentationProfile(input: OnboardingInput, evidence: EvidenceDocument[]): DocumentationProfile {
  const providedDocuments = splitList(input.documents);
  const expectedDocuments = evidence.map((doc) => doc.name);
  const missingDocuments = expectedDocuments.filter((doc) => !providedDocuments.includes(doc));

  return {
    expectedFeatureCount: 33,
    completedFeatureCount: 33 - (input.naicsCode ? 0 : 1) - (input.documents?.trim() ? 0 : 1),
    expectedDocuments,
    providedDocuments,
    missingDocuments
  };
}

function buildRawFeatures(input: OnboardingInput, priorClaims: string[]): EngineRawFeatures {
  return {
    business_name: input.businessName,
    entity_type: input.businessType,
    physical_address: `${input.address}, ${input.city}, ${input.state} ${input.zipCode}`.trim(),
    primary_zip_code: input.zipCode,
    years_in_business: input.yearsInBusiness,
    naics_code: input.naicsCode,
    description_of_operations: input.operationsDescription || input.description,
    number_of_members: Math.max(input.employeeCount, 1),
    additional_named_insureds: input.multipleInsureds ? [input.legalEntityName || input.businessName] : [],
    annual_revenue: input.annualRevenue,
    employee_count_ft: input.employeeCount,
    employee_count_pt: 0,
    credit_score: null,
    sales_percentage_installation_service: input.installServiceMix ? 50 : null,
    total_claims_count: Math.max(priorClaims.length, input.claimsOpenCount),
    total_claims_paid: Math.max(priorClaims.length, input.claimsOpenCount) * input.averageClaimSeverity,
    open_claims_count: input.claimsOpenCount,
    loss_run_years: input.yearsSinceLastClaim ?? null,
    prior_carrier_name: "",
    prior_policy_premium: input.annualPremiumEstimate || null,
    prior_policy_dates: "",
    prior_coverage_declined: input.priorInsuranceDeclined,
    decline_remediated: !input.priorInsuranceDeclined,
    decline_evidence_provided: false,
    building_construction_type: input.constructionType,
    building_year_built: input.effectiveBuildingAge > 0 ? new Date().getFullYear() - input.effectiveBuildingAge : null,
    building_year_updated: input.renovationYear ?? null,
    square_footage: null,
    leased_area: null,
    fire_alarm_present: input.alarmCentralStation,
    sprinkler_system_present: input.sprinklered,
    fire_extinguishers_present: true,
    distance_to_fire_station: input.distanceToFireStationMiles,
    distance_to_fire_hydrant: input.distanceToHydrantFeet,
    roof_replaced_recently: Boolean(input.renovationYear && input.renovationYear >= new Date().getFullYear() - 10),
    no_visible_water_damage: true,
    electrical_updated: Boolean(input.renovationYear && input.renovationYear >= new Date().getFullYear() - 15),
    exterior_well_maintained: (input.buildingQualityScore ?? 60) >= 65,
    hvac_serviced_recently: Boolean(input.renovationYear && input.renovationYear >= new Date().getFullYear() - 5),
    bankruptcy_recent: input.financialStabilityFlag === "distressed",
    prior_cancellation: input.coverageGapMonths > 0,
    cancellation_remediated: input.coverageGapMonths === 0,
    hazardous_exposures_disclosed: input.offsiteWork || input.subcontractorsUsed,
    foreign_operations: false,
    criminal_activity_disclosed: false
  };
}

export function buildInitialStateFromOnboarding(input: OnboardingInput): AppState {
  const id = `biz-${Date.now()}`;
  const priorClaims = splitList(input.priorClaims);
  const evidence = baselineEvidence(id, input);
  const providedDocuments = splitList(input.documents);
  if (providedDocuments.length > 0) {
    evidence.push(
      ...providedDocuments.map((name, index) => ({
        id: `doc-upload-${Date.now()}-${index}`,
        businessId: id,
        documentType: "owner-upload",
        name,
        uploadedAt: new Date().toISOString(),
        status: "uploaded" as const,
        extractedFields: [],
        underwritingRelevance: "Owner-uploaded onboarding document ready for parsing and semantic indexing.",
        confidenceImpact: 4
      }))
    );
  }
  const documentation = buildDocumentationProfile(input, evidence);

  const profile: BusinessProfile = {
    id,
    businessName: input.businessName,
    businessType: input.businessType,
    legalEntityName: input.legalEntityName || input.businessName,
    description: input.description,
    operationsDescription: input.operationsDescription || input.description,
    address: input.address,
    city: input.city,
    state: input.state,
    zipCode: input.zipCode,
    naicsCode: input.naicsCode,
    industryRiskTier: input.industryRiskTier,
    yearsInBusiness: input.yearsInBusiness,
    annualRevenue: input.annualRevenue,
    annualPremiumEstimate: input.annualPremiumEstimate,
    payroll: input.payroll,
    employeeCount: input.employeeCount,
    multipleInsureds: input.multipleInsureds,
    installServiceMix: input.installServiceMix,
    customerFootTraffic: input.customerFootTraffic,
    offsiteWork: input.offsiteWork,
    vehiclesUsed: input.vehiclesUsed,
    subcontractorsUsed: input.subcontractorsUsed,
    storesCustomerData: input.storesCustomerData,
    lastUpdatedAt: new Date().toISOString()
  };

  return {
    profile,
    underwritingProfile: {
      rawFeatures: buildRawFeatures(input, priorClaims),
      zipAreaFeatures: null,
      scoreResult: null
    },
    claimsFinancial: {
      priorClaims,
      totalClaimsCount: Math.max(priorClaims.length, input.claimsOpenCount),
      claimsOpenCount: input.claimsOpenCount,
      claimFrequencyRate: Number((Math.max(priorClaims.length, input.claimsOpenCount) / Math.max(input.yearsInBusiness, 1)).toFixed(2)),
      averageClaimSeverity: input.averageClaimSeverity,
      lossRatioEstimate: input.lossRatioEstimate,
      financialStabilityFlag: input.financialStabilityFlag,
      priorInsuranceStability: input.priorInsuranceStability,
      priorInsuranceDeclined: input.priorInsuranceDeclined,
      coverageGapMonths: input.coverageGapMonths,
      carrierChangesLast5Years: input.carrierChangesLast5Years,
      yearsSinceLastClaim: input.yearsSinceLastClaim ?? (priorClaims.length > 0 ? 1 : null)
    },
    property: locationProfile(input),
    cyberSafety: {
      cyberReadinessScore: input.cyberReadinessScore,
      safetyCultureIndicator: input.safetyCultureIndicator,
      cyberRiskPosture: input.cyberRiskPosture,
      mfaEnabled: input.mfaEnabled,
      regularBackups: input.regularBackups,
      incidentResponsePlan: input.incidentResponsePlan,
      vendorRiskManagement: input.vendorRiskManagement,
      oshaCompliant: input.oshaCompliant,
      formalSafetyProgram: input.formalSafetyProgram,
      employeeTrainingCadence: input.employeeTrainingCadence
    },
    documentation,
    evidence,
    timeline: [
      {
        id: `ev-${Date.now()}`,
        businessId: id,
        date: new Date().toISOString().slice(0, 10),
        title: "Initial onboarding completed",
        description: "Created business readiness profile with underwriting scoring inputs.",
        scoreImpact: 0,
        confidenceImpact: 0,
        category: "business-change"
      }
    ],
    scoreTrend: [{ date: new Date().toISOString().slice(0, 10), readiness: 50, confidence: 40 }],
    renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString().slice(0, 10)
  };
}
