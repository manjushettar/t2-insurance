import { AppState, BusinessProfile, EvidenceDocument, PropertyProfile, ScoreTrendPoint } from "@/lib/types";

const today = new Date();
const iso = (d: Date) => d.toISOString();

export const oaklandSunriseProfile: BusinessProfile = {
  id: "biz-oakland-sunrise",
  businessName: "Oakland Sunrise Cafe",
  businessType: "restaurant",
  legalEntityName: "Oakland Sunrise Cafe LLC",
  description:
    "Neighborhood cafe with breakfast and lunch service, dine-in and takeout. No alcohol service. Limited catering for local offices.",
  operationsDescription:
    "Single-location cafe with dine-in, takeout, and limited local catering. No alcohol sales. Prep and cooking are performed on-site with standard kitchen suppression controls.",
  address: "1421 Broadway",
  city: "Oakland",
  state: "CA",
  zipCode: "94612",
  naicsCode: "722513",
  industryRiskTier: "moderate",
  yearsInBusiness: 6,
  annualRevenue: 750000,
  annualPremiumEstimate: 18000,
  payroll: 260000,
  employeeCount: 8,
  multipleInsureds: false,
  installServiceMix: "Dine-in / takeout / catering",
  customerFootTraffic: true,
  offsiteWork: false,
  vehiclesUsed: false,
  subcontractorsUsed: false,
  storesCustomerData: true,
  lastUpdatedAt: iso(today)
};

export const oaklandProperty: PropertyProfile = {
  effectiveBuildingAge: 28,
  renovationYear: 2019,
  constructionType: "Masonry non-combustible",
  alarmCentralStation: true,
  sprinklered: true,
  propertyProtectionScore: 74,
  locationHazardIndex: 48,
  fireProtectionRating: 78,
  distanceToFireStationMiles: 1.2,
  distanceToHydrantFeet: 220,
  premisesOwnershipStatus: "leased",
  buildingQualityScore: 72,
  zipCode: "94612",
  naturalHazardLevel: "medium",
  floodRisk: "low",
  wildfireRisk: "medium",
  severeWeatherRisk: "medium",
  crimeOrTheftRisk: "medium",
  explanation:
    "Urban infill cafe with manageable flood exposure, moderate regional wildfire influence, and generally acceptable fire protection access."
};

export const oaklandEvidence: EvidenceDocument[] = [
  {
    id: "doc-lease",
    businessId: oaklandSunriseProfile.id,
    documentType: "lease",
    name: "Current Lease Agreement",
    uploadedAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30)),
    status: "current",
    extractedFields: ["Address", "Lease term", "Landlord details"],
    underwritingRelevance: "Confirms occupancy and control of premises.",
    confidenceImpact: 6
  },
  {
    id: "doc-loss-runs",
    businessId: oaklandSunriseProfile.id,
    documentType: "loss-runs",
    name: "Loss Runs",
    uploadedAt: "",
    status: "missing",
    extractedFields: [],
    underwritingRelevance: "Critical for evaluating prior loss history.",
    confidenceImpact: -8
  },
  {
    id: "doc-payroll",
    businessId: oaklandSunriseProfile.id,
    documentType: "payroll-report",
    name: "Current Payroll Report",
    uploadedAt: "",
    status: "missing",
    extractedFields: [],
    underwritingRelevance: "Supports payroll allocation and workers comp estimates.",
    confidenceImpact: -6
  },
  {
    id: "doc-fire",
    businessId: oaklandSunriseProfile.id,
    documentType: "fire-suppression-inspection",
    name: "Fire Suppression Inspection",
    uploadedAt: "",
    status: "missing",
    extractedFields: [],
    underwritingRelevance: "Important restaurant property control evidence.",
    confidenceImpact: -10
  }
];

export const oaklandScoreTrend: ScoreTrendPoint[] = [
  { date: "2026-01-15", readiness: 57, confidence: 41 },
  { date: "2026-02-20", readiness: 60, confidence: 46 },
  { date: "2026-03-18", readiness: 62, confidence: 50 },
  { date: "2026-04-20", readiness: 63, confidence: 52 }
];

export const oaklandInitialState: AppState = {
  profile: oaklandSunriseProfile,
  claimsFinancial: {
    priorClaims: ["Slip-and-fall claim reported two years ago."],
    totalClaimsCount: 1,
    claimsOpenCount: 0,
    claimFrequencyRate: 0.17,
    averageClaimSeverity: 12500,
    lossRatioEstimate: 0.46,
    financialStabilityFlag: "stable",
    priorInsuranceStability: "stable",
    priorInsuranceDeclined: false,
    coverageGapMonths: 0,
    carrierChangesLast5Years: 1,
    yearsSinceLastClaim: 2
  },
  property: oaklandProperty,
  cyberSafety: {
    cyberReadinessScore: 68,
    safetyCultureIndicator: 72,
    cyberRiskPosture: 64,
    mfaEnabled: true,
    regularBackups: true,
    incidentResponsePlan: false,
    vendorRiskManagement: false,
    oshaCompliant: true,
    formalSafetyProgram: true,
    employeeTrainingCadence: "quarterly"
  },
  documentation: {
    expectedFeatureCount: 33,
    completedFeatureCount: 29,
    expectedDocuments: [
      "Current Lease Agreement",
      "Loss Runs",
      "Current Payroll Report",
      "Fire Suppression Inspection"
    ],
    providedDocuments: ["Current Lease Agreement"],
    missingDocuments: ["Loss Runs", "Current Payroll Report", "Fire Suppression Inspection"]
  },
  evidence: oaklandEvidence,
  timeline: [
    {
      id: "ev-1",
      businessId: oaklandSunriseProfile.id,
      date: "2026-01-15",
      title: "Initial onboarding completed",
      description: "Created profile with baseline operations and financial data.",
      scoreImpact: 0,
      confidenceImpact: 0,
      category: "business-change"
    },
    {
      id: "ev-2",
      businessId: oaklandSunriseProfile.id,
      date: "2026-02-04",
      title: "Uploaded lease",
      description: "Lease document added to evidence locker.",
      scoreImpact: 0,
      confidenceImpact: 5,
      category: "document"
    }
  ],
  scoreTrend: oaklandScoreTrend,
  renewalDate: "2026-10-01"
};

export const bayBuildContractorState: AppState = {
  profile: {
    id: "biz-baybuild",
    businessName: "BayBuild Contractors",
    businessType: "contractor",
    legalEntityName: "BayBuild Contractors Inc.",
    description: "General contractor for mixed residential and small commercial remodel projects across the Bay Area.",
    operationsDescription:
      "General contractor handling remodels with mixed self-perform and subcontracted scopes across residential and light commercial jobs.",
    address: "370 Townsend St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    naicsCode: "236220",
    industryRiskTier: "high",
    yearsInBusiness: 9,
    annualRevenue: 1200000,
    annualPremiumEstimate: 42000,
    payroll: 420000,
    employeeCount: 14,
    multipleInsureds: true,
    installServiceMix: "Framing / finish / MEP coordination",
    customerFootTraffic: false,
    offsiteWork: true,
    vehiclesUsed: true,
    subcontractorsUsed: true,
    storesCustomerData: true,
    lastUpdatedAt: iso(today)
  },
  claimsFinancial: {
    priorClaims: [],
    totalClaimsCount: 0,
    claimsOpenCount: 0,
    claimFrequencyRate: 0,
    averageClaimSeverity: 0,
    lossRatioEstimate: 0.22,
    financialStabilityFlag: "stable",
    priorInsuranceStability: "minor_gaps",
    priorInsuranceDeclined: false,
    coverageGapMonths: 1,
    carrierChangesLast5Years: 2,
    yearsSinceLastClaim: null
  },
  property: {
    effectiveBuildingAge: 14,
    renovationYear: 2021,
    constructionType: "Tilt-up concrete",
    alarmCentralStation: true,
    sprinklered: false,
    propertyProtectionScore: 66,
    locationHazardIndex: 40,
    fireProtectionRating: 70,
    distanceToFireStationMiles: 1.8,
    distanceToHydrantFeet: 300,
    premisesOwnershipStatus: "leased",
    buildingQualityScore: 68,
    zipCode: "94107",
    naturalHazardLevel: "medium",
    floodRisk: "medium",
    wildfireRisk: "low",
    severeWeatherRisk: "medium",
    crimeOrTheftRisk: "medium",
    explanation: "Contractor office and yard location with acceptable baseline hazards but meaningful equipment and off-site operational exposures."
  },
  cyberSafety: {
    cyberReadinessScore: 62,
    safetyCultureIndicator: 58,
    cyberRiskPosture: 54,
    mfaEnabled: true,
    regularBackups: false,
    incidentResponsePlan: false,
    vendorRiskManagement: false,
    oshaCompliant: true,
    formalSafetyProgram: true,
    employeeTrainingCadence: "monthly"
  },
  documentation: {
    expectedFeatureCount: 33,
    completedFeatureCount: 28,
    expectedDocuments: ["Payroll by Job Role", "Subcontractor COIs", "Driver List"],
    providedDocuments: ["Payroll by Job Role"],
    missingDocuments: ["Subcontractor COIs", "Driver List"]
  },
  evidence: [
    {
      id: "bdoc-1",
      businessId: "biz-baybuild",
      documentType: "payroll-report",
      name: "Payroll by Job Role",
      uploadedAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 50)),
      status: "stale",
      extractedFields: ["Carpenter payroll", "Foreman payroll"],
      underwritingRelevance: "Useful for class-based payroll allocation.",
      confidenceImpact: 5
    },
    {
      id: "bdoc-2",
      businessId: "biz-baybuild",
      documentType: "subcontractor-coi",
      name: "Subcontractor COIs",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Important transfer-of-risk evidence.",
      confidenceImpact: -9
    },
    {
      id: "bdoc-3",
      businessId: "biz-baybuild",
      documentType: "driver-list",
      name: "Driver List",
      uploadedAt: "",
      status: "missing",
      extractedFields: [],
      underwritingRelevance: "Supports commercial auto risk review.",
      confidenceImpact: -8
    }
  ],
  timeline: [
    {
      id: "bev-1",
      businessId: "biz-baybuild",
      date: "2026-02-01",
      title: "Initial onboarding completed",
      description: "Created contractor profile.",
      scoreImpact: 0,
      confidenceImpact: 0,
      category: "business-change"
    }
  ],
  scoreTrend: [
    { date: "2026-02-01", readiness: 58, confidence: 44 },
    { date: "2026-03-01", readiness: 60, confidence: 48 }
  ],
  renewalDate: "2026-12-15"
};
