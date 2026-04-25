export type BusinessType = "restaurant" | "contractor" | "retail" | "other";
export type RiskLevel = "low" | "medium" | "high";
export type IndustryRiskTier = "low" | "moderate" | "high";
export type FinancialStabilityFlag = "strong" | "stable" | "watch" | "distressed";
export type PriorInsuranceStability = "stable" | "minor_gaps" | "volatile" | "unknown";
export type PremisesOwnershipStatus = "owned" | "leased" | "shared";
export type TrainingCadence = "weekly" | "monthly" | "quarterly" | "annually" | "ad_hoc" | "none";

export interface BusinessProfile {
  id: string;
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
  yearsInBusiness: number;
  annualRevenue: number;
  annualPremiumEstimate: number;
  payroll: number;
  employeeCount: number;
  multipleInsureds: boolean;
  installServiceMix: string;
  customerFootTraffic: boolean;
  offsiteWork: boolean;
  vehiclesUsed: boolean;
  subcontractorsUsed: boolean;
  storesCustomerData: boolean;
  lastUpdatedAt: string;
}

export interface ClaimsFinancialProfile {
  priorClaims: string[];
  totalClaimsCount: number;
  claimsOpenCount: number;
  claimFrequencyRate: number;
  averageClaimSeverity: number;
  lossRatioEstimate: number;
  financialStabilityFlag: FinancialStabilityFlag;
  priorInsuranceStability: PriorInsuranceStability;
  priorInsuranceDeclined: boolean;
  coverageGapMonths: number;
  carrierChangesLast5Years: number;
  yearsSinceLastClaim: number | null;
}

export interface PropertyProfile {
  effectiveBuildingAge: number;
  renovationYear: number | null;
  constructionType: string;
  alarmCentralStation: boolean;
  sprinklered: boolean;
  propertyProtectionScore: number;
  locationHazardIndex: number;
  fireProtectionRating: number;
  distanceToFireStationMiles: number;
  distanceToHydrantFeet: number;
  premisesOwnershipStatus: PremisesOwnershipStatus;
  buildingQualityScore: number | null;
  zipCode: string;
  naturalHazardLevel: RiskLevel;
  floodRisk: RiskLevel;
  wildfireRisk: RiskLevel;
  severeWeatherRisk: RiskLevel;
  crimeOrTheftRisk: RiskLevel;
  explanation: string;
}

export interface CyberSafetyProfile {
  cyberReadinessScore: number;
  safetyCultureIndicator: number;
  cyberRiskPosture: number;
  mfaEnabled: boolean;
  regularBackups: boolean;
  incidentResponsePlan: boolean;
  vendorRiskManagement: boolean;
  oshaCompliant: boolean;
  formalSafetyProgram: boolean;
  employeeTrainingCadence: TrainingCadence;
}

export type EvidenceStatus = "current" | "stale" | "expired" | "missing" | "uploaded";

export interface EvidenceDocument {
  id: string;
  businessId: string;
  documentType: string;
  name: string;
  uploadedAt: string;
  status: EvidenceStatus;
  extractedFields: string[];
  underwritingRelevance: string;
  confidenceImpact: number;
}

export interface DocumentationProfile {
  expectedFeatureCount: number;
  completedFeatureCount: number;
  expectedDocuments: string[];
  providedDocuments: string[];
  missingDocuments: string[];
}

export interface ReadinessPillar {
  id: "operational" | "claims-financial" | "property-location" | "cyber-safety" | "documentation-completeness";
  label: string;
  weight: number;
  score: number;
  summary: string;
}

export interface ReadinessScore {
  overallScore: number;
  confidenceScore: number;
  operational: number;
  claimsFinancial: number;
  propertyLocation: number;
  cyberSafety: number;
  documentationCompleteness: number;
  pillars: ReadinessPillar[];
  explanation: string;
  strengths: string[];
  concerns: string[];
  recommendedActions: RecommendedAction[];
}

export type TimelineCategory =
  | "document"
  | "business-change"
  | "risk-improvement"
  | "risk-increase"
  | "reminder";

export interface TimelineEvent {
  id: string;
  businessId: string;
  date: string;
  title: string;
  description: string;
  scoreImpact: number;
  confidenceImpact: number;
  category: TimelineCategory;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  expectedScoreImpact: number;
  status: "open" | "in-progress" | "completed";
  category: string;
}

export interface ScoreTrendPoint {
  date: string;
  readiness: number;
  confidence: number;
}

export interface AppState {
  profile: BusinessProfile;
  claimsFinancial: ClaimsFinancialProfile;
  property: PropertyProfile;
  cyberSafety: CyberSafetyProfile;
  documentation: DocumentationProfile;
  evidence: EvidenceDocument[];
  timeline: TimelineEvent[];
  scoreTrend: ScoreTrendPoint[];
  renewalDate: string;
}

export type UpdateType =
  | "upload-document"
  | "business-change"
  | "safety-improvement"
  | "new-risk"
  | "update-financials"
  | "claim"
  | "renewal-reminder";

export interface BusinessUpdateInput {
  type: UpdateType;
  title: string;
  description: string;
}
