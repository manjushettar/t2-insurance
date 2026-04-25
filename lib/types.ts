export type BusinessType = "restaurant" | "contractor" | "retail" | "other";
export type RiskLevel = "low" | "medium" | "high";

export interface BusinessProfile {
  id: string;
  businessName: string;
  businessType: BusinessType;
  legalEntityName: string;
  yearsInBusiness: number;
  description: string;
  address: string;
  zipCode: string;
  state: string;
  annualRevenue: number;
  payroll: number;
  employeeCount: number;
  customerFootTraffic: boolean;
  offsiteWork: boolean;
  vehiclesUsed: boolean;
  subcontractorsUsed: boolean;
  storesCustomerData: boolean;
  priorClaims: string[];
  lastUpdatedAt: string;
}

export interface LocationRisk {
  zipCode: string;
  naturalHazardLevel: RiskLevel;
  floodRisk: RiskLevel;
  wildfireRisk: RiskLevel;
  severeWeatherRisk: RiskLevel;
  crimeOrTheftRisk: RiskLevel;
  explanation: string;
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

export interface ReadinessScore {
  overallScore: number;
  confidenceScore: number;
  dataCompleteness: number;
  classificationClarity: number;
  financialStability: number;
  lossHistory: number;
  propertyControls: number;
  operationalControls: number;
  locationContext: number;
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
  locationRisk: LocationRisk;
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
