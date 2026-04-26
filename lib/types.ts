export type BusinessType = "restaurant" | "contractor" | "retail" | "other";
export type RiskLevel = "low" | "medium" | "high";
export type IndustryRiskTier = "low" | "moderate" | "high";
export type FinancialStabilityFlag = "strong" | "stable" | "watch" | "distressed";
export type PriorInsuranceStability = "stable" | "minor_gaps" | "volatile" | "unknown";
export type PremisesOwnershipStatus = "owned" | "leased" | "shared";
export type TrainingCadence = "weekly" | "monthly" | "quarterly" | "annually" | "ad_hoc" | "none";

export interface EngineRawFeatures {
  business_name: string;
  entity_type: string;
  physical_address: string;
  primary_zip_code: string;
  years_in_business: number;
  naics_code: string;
  description_of_operations: string;
  number_of_members: number;
  additional_named_insureds: string[];
  annual_revenue: number;
  employee_count_ft: number;
  employee_count_pt: number;
  credit_score: number | null;
  sales_percentage_installation_service: number | null;
  total_claims_count: number;
  total_claims_paid: number;
  open_claims_count: number;
  loss_run_years: number | null;
  prior_carrier_name: string;
  prior_policy_premium: number | null;
  prior_policy_dates: string;
  prior_coverage_declined: boolean;
  decline_remediated: boolean;
  decline_evidence_provided: boolean;
  building_construction_type: string;
  building_year_built: number | null;
  building_year_updated: number | null;
  square_footage: number | null;
  leased_area: number | null;
  fire_alarm_present: boolean;
  sprinkler_system_present: boolean;
  fire_extinguishers_present: boolean;
  distance_to_fire_station: number | null;
  distance_to_fire_hydrant: number | null;
  mfa_implemented?: boolean | null;
  data_backups_regular?: boolean | null;
  incident_response_plan?: boolean | null;
  third_party_vendor_risk_management?: boolean | null;
  formal_safety_program?: boolean | null;
  employee_safety_training?: boolean | null;
  osha_compliance?: boolean | null;
  roof_replaced_recently: boolean;
  no_visible_water_damage: boolean;
  electrical_updated: boolean;
  exterior_well_maintained: boolean;
  hvac_serviced_recently: boolean;
  bankruptcy_recent: boolean;
  prior_cancellation: boolean;
  cancellation_remediated: boolean;
  hazardous_exposures_disclosed: boolean;
  foreign_operations: boolean;
  criminal_activity_disclosed: boolean;
}

export interface EngineContributionRow {
  feature_key: string;
  feature_label: string;
  pillar_key: string;
  raw_value: string | number | boolean | null;
  normalized_value: number | null;
  weight: number;
  points_contributed: number;
  confidence: number;
  rationale?: string;
}

export interface EnginePillarResult {
  pillar_key: "operational" | "claims_financial" | "property_location" | "cyber_safety" | "documentation_completeness";
  pillar_label: string;
  score: number;
  confidence: number;
  weighted_points: number;
}

export interface EngineKnockout {
  rule_key: string;
  label: string;
  triggered: boolean;
  explanation: string;
  remediation?: string;
  capped_score?: number;
}

export interface EngineRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_gain: number;
  priority: "high" | "medium" | "low";
}

export interface EngineCompleteness {
  percentage: number;
  provided_feature_count: number;
  expected_feature_count: number;
  missing_features: string[];
}

export interface EngineScoreResult {
  composite_score: number;
  raw_weighted_score: number;
  pillars: EnginePillarResult[];
  contribution_table: EngineContributionRow[];
  knockouts: EngineKnockout[];
  recommendations: EngineRecommendation[];
  completeness: EngineCompleteness;
}

export interface ZipAreaFeatures {
  vacancy_rate?: number | null;
  residential_stability_index?: number | null;
  median_household_income?: number | null;
  source?: string;
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

export interface UnderwritingProfile {
  rawFeatures: EngineRawFeatures;
  zipAreaFeatures?: ZipAreaFeatures | null;
  scoreResult?: EngineScoreResult | null;
}

export interface AppState {
  profile: BusinessProfile;
  underwritingProfile: UnderwritingProfile;
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
