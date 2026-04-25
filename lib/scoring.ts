import {
  AppState,
  BusinessUpdateInput,
  CyberSafetyProfile,
  DocumentationProfile,
  EvidenceDocument,
  IndustryRiskTier,
  PremisesOwnershipStatus,
  PropertyProfile,
  ReadinessPillar,
  ReadinessScore,
  RecommendedAction,
  RiskLevel,
  TimelineEvent,
  TrainingCadence
} from "@/lib/types";

const riskToScore: Record<RiskLevel, number> = {
  low: 85,
  medium: 65,
  high: 40
};

const industryRiskScores: Record<IndustryRiskTier, number> = {
  low: 85,
  moderate: 65,
  high: 45
};

const financialFlagScores = {
  strong: 88,
  stable: 72,
  watch: 52,
  distressed: 28
} as const;

const priorInsuranceScores = {
  stable: 84,
  minor_gaps: 66,
  volatile: 42,
  unknown: 55
} as const;

const ownershipScores: Record<PremisesOwnershipStatus, number> = {
  owned: 80,
  leased: 68,
  shared: 58
};

const trainingScores: Record<TrainingCadence, number> = {
  weekly: 92,
  monthly: 82,
  quarterly: 70,
  annually: 58,
  ad_hoc: 45,
  none: 30
};

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function inverseScore(value: number, goodAtOrBelow: number, badAtOrAbove: number): number {
  if (value <= goodAtOrBelow) return 100;
  if (value >= badAtOrAbove) return 0;
  return ((badAtOrAbove - value) / (badAtOrAbove - goodAtOrBelow)) * 100;
}

function boundedScore(value: number, badAtOrBelow: number, goodAtOrAbove: number): number {
  if (value <= badAtOrBelow) return 0;
  if (value >= goodAtOrAbove) return 100;
  return ((value - badAtOrBelow) / (goodAtOrAbove - badAtOrBelow)) * 100;
}

function revenuePerEmployee(state: AppState): number {
  return state.profile.employeeCount > 0 ? state.profile.annualRevenue / state.profile.employeeCount : 0;
}

function operationalComplexityScore(state: AppState): number {
  let score = 82;
  if (state.profile.multipleInsureds) score -= 12;
  if (state.profile.offsiteWork) score -= 8;
  if (state.profile.vehiclesUsed) score -= 8;
  if (state.profile.subcontractorsUsed) score -= 10;
  if (state.profile.customerFootTraffic) score -= 4;
  if (state.profile.installServiceMix.trim().length > 24) score -= 8;
  if (state.profile.operationsDescription.trim().length > 120) score += 5;
  return clamp(score);
}

function hasCurrentEvidence(evidence: EvidenceDocument[], type: string): boolean {
  return evidence.some((doc) => doc.documentType === type && ["current", "uploaded"].includes(doc.status));
}

function documentationCoverage(documentation: DocumentationProfile, evidence: EvidenceDocument[]): number {
  const featureCoverage =
    documentation.expectedFeatureCount > 0
      ? (documentation.completedFeatureCount / documentation.expectedFeatureCount) * 100
      : 0;
  const documentCoverage =
    documentation.expectedDocuments.length > 0
      ? (documentation.providedDocuments.length / documentation.expectedDocuments.length) * 100
      : 100;
  const freshnessPenalty = evidence.filter((doc) => doc.status === "stale" || doc.status === "expired").length * 4;
  return clamp(featureCoverage * 0.55 + documentCoverage * 0.45 - freshnessPenalty);
}

function scoreOperational(state: AppState): number {
  const maturity = boundedScore(state.profile.yearsInBusiness, 0, 10);
  const scale = boundedScore(revenuePerEmployee(state), 40000, 180000);
  const staffing = inverseScore(state.profile.employeeCount, 5, 150);
  const complexity = operationalComplexityScore(state);
  return clamp(
    industryRiskScores[state.profile.industryRiskTier] * 0.3 +
      maturity * 0.2 +
      scale * 0.2 +
      staffing * 0.1 +
      complexity * 0.2
  );
}

function scoreClaimsFinancial(state: AppState): number {
  const openRatio =
    state.claimsFinancial.totalClaimsCount > 0
      ? state.claimsFinancial.claimsOpenCount / state.claimsFinancial.totalClaimsCount
      : 0;

  return clamp(
    inverseScore(state.claimsFinancial.claimFrequencyRate, 0.1, 1.5) * 0.2 +
      inverseScore(state.claimsFinancial.averageClaimSeverity, 5000, 100000) * 0.18 +
      inverseScore(state.claimsFinancial.lossRatioEstimate, 0.3, 1.4) * 0.18 +
      financialFlagScores[state.claimsFinancial.financialStabilityFlag] * 0.18 +
      inverseScore(openRatio, 0.05, 1) * 0.12 +
      priorInsuranceScores[state.claimsFinancial.priorInsuranceStability] * 0.14
  );
}

function scorePropertyLocation(property: PropertyProfile): number {
  const ageScore = inverseScore(property.effectiveBuildingAge, 10, 100);
  const protectionScore = clamp(property.propertyProtectionScore);
  const locationScore = inverseScore(property.locationHazardIndex, 20, 100);
  const fireScore = clamp(property.fireProtectionRating);
  const ownershipScore = ownershipScores[property.premisesOwnershipStatus];
  const qualityScore = property.buildingQualityScore ?? 60;
  const externalHazardScore = average([
    riskToScore[property.naturalHazardLevel],
    riskToScore[property.floodRisk],
    riskToScore[property.wildfireRisk],
    riskToScore[property.severeWeatherRisk],
    riskToScore[property.crimeOrTheftRisk]
  ]);

  return clamp(
    ageScore * 0.15 +
      protectionScore * 0.25 +
      locationScore * 0.2 +
      fireScore * 0.15 +
      ownershipScore * 0.05 +
      qualityScore * 0.1 +
      externalHazardScore * 0.1
  );
}

function scoreCyberSafety(cyberSafety: CyberSafetyProfile): number {
  const controlsBonus = average([
    cyberSafety.mfaEnabled ? 100 : 35,
    cyberSafety.regularBackups ? 100 : 40,
    cyberSafety.incidentResponsePlan ? 100 : 45,
    cyberSafety.vendorRiskManagement ? 100 : 50,
    cyberSafety.oshaCompliant ? 100 : 45,
    cyberSafety.formalSafetyProgram ? 100 : 35,
    trainingScores[cyberSafety.employeeTrainingCadence]
  ]);

  return clamp(
    cyberSafety.cyberReadinessScore * 0.3 +
      cyberSafety.safetyCultureIndicator * 0.35 +
      cyberSafety.cyberRiskPosture * 0.2 +
      controlsBonus * 0.15
  );
}

function buildPillars(score: ReadinessScore): ReadinessPillar[] {
  return [
    {
      id: "operational",
      label: "Operational",
      weight: 20,
      score: score.operational,
      summary: "Operational stability, industry complexity, and business maturity."
    },
    {
      id: "claims-financial",
      label: "Claims & Financial",
      weight: 25,
      score: score.claimsFinancial,
      summary: "Loss experience, open-claim burden, insurance continuity, and solvency."
    },
    {
      id: "property-location",
      label: "Property & Location",
      weight: 25,
      score: score.propertyLocation,
      summary: "Building condition, protections, and external hazard exposure."
    },
    {
      id: "cyber-safety",
      label: "Cyber & Safety",
      weight: 20,
      score: score.cyberSafety,
      summary: "Preventive controls for cyber, safety, and operational loss prevention."
    },
    {
      id: "documentation-completeness",
      label: "Documentation",
      weight: 10,
      score: score.documentationCompleteness,
      summary: "Whether the business can evidence what underwriters usually request."
    }
  ];
}

export function buildRecommendedActions(state: AppState): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (!hasCurrentEvidence(state.evidence, "loss-runs")) {
    actions.push({
      id: "loss-runs",
      title: "Upload current loss runs",
      description: "Loss runs directly support the highest-weighted claims pillar and reduce underwriting uncertainty.",
      priority: "high",
      effort: "medium",
      expectedScoreImpact: 9,
      status: "open",
      category: "claims-financial"
    });
  }

  if (state.claimsFinancial.claimsOpenCount > 0) {
    actions.push({
      id: "open-claims",
      title: "Document remediation for open claims",
      description: "Open claims can act like a knockout. Add status notes, reserves, and corrective action evidence.",
      priority: "high",
      effort: "high",
      expectedScoreImpact: 10,
      status: "open",
      category: "claims-financial"
    });
  }

  if (state.property.propertyProtectionScore < 70) {
    actions.push({
      id: "property-controls",
      title: "Improve and document property protections",
      description: "Add alarm, sprinkler, inspection, or maintenance evidence to strengthen the property pillar.",
      priority: "high",
      effort: "medium",
      expectedScoreImpact: 8,
      status: "open",
      category: "property-location"
    });
  }

  if (!state.cyberSafety.mfaEnabled || !state.cyberSafety.regularBackups || !state.cyberSafety.formalSafetyProgram) {
    actions.push({
      id: "cyber-safety-controls",
      title: "Close core cyber and safety control gaps",
      description: "MFA, backups, and a formal safety program materially improve the cyber and safety pillar.",
      priority: "high",
      effort: "medium",
      expectedScoreImpact: 7,
      status: "open",
      category: "cyber-safety"
    });
  }

  if (state.documentation.missingDocuments.length > 0) {
    actions.push({
      id: "documentation-gap",
      title: "Collect missing underwriting documents",
      description: `Missing documents: ${state.documentation.missingDocuments.slice(0, 3).join(", ")}.`,
      priority: "medium",
      effort: "medium",
      expectedScoreImpact: 6,
      status: "open",
      category: "documentation"
    });
  }

  if (state.profile.naicsCode.trim().length === 0 || state.profile.operationsDescription.trim().length < 80) {
    actions.push({
      id: "class-clarity",
      title: "Clarify NAICS and operations description",
      description: "Classification clarity reduces ambiguity around operational complexity and insurer appetite.",
      priority: "medium",
      effort: "low",
      expectedScoreImpact: 4,
      status: "open",
      category: "operational"
    });
  }

  return actions.slice(0, 7);
}

export function calculateReadiness(state: AppState): ReadinessScore {
  const operational = scoreOperational(state);
  const claimsFinancial = scoreClaimsFinancial(state);
  const propertyLocation = scorePropertyLocation(state.property);
  const cyberSafety = scoreCyberSafety(state.cyberSafety);
  const documentationCompleteness = documentationCoverage(state.documentation, state.evidence);

  let overallScore = clamp(
    operational * 0.2 +
      claimsFinancial * 0.25 +
      propertyLocation * 0.25 +
      cyberSafety * 0.2 +
      documentationCompleteness * 0.1
  );

  if (state.claimsFinancial.priorInsuranceDeclined) {
    overallScore = Math.min(overallScore, 62);
  }
  if (state.claimsFinancial.claimsOpenCount >= 2) {
    overallScore = Math.min(overallScore, 58);
  }

  const evidenceConfidence = state.evidence.reduce((acc, doc) => {
    if (doc.status === "current") return acc + 8;
    if (doc.status === "uploaded") return acc + 5;
    if (doc.status === "stale") return acc - 3;
    if (doc.status === "expired") return acc - 6;
    return acc - 5;
  }, 35);

  const confidenceScore = clamp(
    documentationCompleteness * 0.65 + evidenceConfidence * 0.2 + state.timeline.length * 1.2 + overallScore * 0.15
  );

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (operational >= 70) strengths.push("Operational profile is stable enough to classify and price with less ambiguity.");
  if (claimsFinancial >= 70) strengths.push("Claims and financial posture appears manageable relative to expected insurer loss tolerance.");
  if (propertyLocation >= 70) strengths.push("Property protections and location profile support a cleaner physical risk narrative.");
  if (cyberSafety >= 70) strengths.push("Cyber and safety controls are meaningfully reducing preventable loss exposure.");
  if (documentationCompleteness >= 70) strengths.push("Supporting documentation coverage is strong enough for a better underwriting handoff.");

  if (state.claimsFinancial.priorInsuranceDeclined) concerns.push("Prior insurance decline may function as a knockout until remediated with context.");
  if (state.claimsFinancial.claimsOpenCount > 0) concerns.push("Open claims are still active and can cap readiness regardless of weighted averages.");
  if (propertyLocation < 60) concerns.push("Property and location risk remains weak relative to the target model.");
  if (cyberSafety < 60) concerns.push("Cyber and safety controls are not yet strong enough to support the intended risk posture.");
  if (documentationCompleteness < 60) concerns.push("Documentation completeness is low, which reduces both readiness and confidence.");

  const explanation =
    overallScore >= 75
      ? "The business looks comparatively well prepared across the five underwriting pillars."
      : overallScore >= 60
        ? "The business is insurable in profile, but the weighted pillars still show material underwriting friction."
        : "The weighted pillars point to meaningful underwriting concerns or missing evidence that should be addressed before submission.";

  const recommendedActions = buildRecommendedActions(state);

  const score: ReadinessScore = {
    overallScore,
    confidenceScore,
    operational,
    claimsFinancial,
    propertyLocation,
    cyberSafety,
    documentationCompleteness,
    pillars: [],
    explanation,
    strengths,
    concerns,
    recommendedActions
  };

  score.pillars = buildPillars(score);
  return score;
}

function buildEvent(state: AppState, input: BusinessUpdateInput, scoreImpact: number, confidenceImpact: number): TimelineEvent {
  return {
    id: `ev-${Date.now()}`,
    businessId: state.profile.id,
    date: new Date().toISOString().slice(0, 10),
    title: input.title,
    description: input.description,
    scoreImpact,
    confidenceImpact,
    category:
      input.type === "upload-document"
        ? "document"
        : input.type === "safety-improvement"
          ? "risk-improvement"
          : input.type === "new-risk" || input.type === "claim"
            ? "risk-increase"
            : input.type === "renewal-reminder"
              ? "reminder"
              : "business-change"
  };
}

export function applyUpdate(state: AppState, input: BusinessUpdateInput): AppState {
  const next: AppState = {
    ...state,
    profile: { ...state.profile, lastUpdatedAt: new Date().toISOString() },
    claimsFinancial: { ...state.claimsFinancial },
    property: { ...state.property },
    cyberSafety: { ...state.cyberSafety },
    documentation: {
      ...state.documentation,
      expectedDocuments: [...state.documentation.expectedDocuments],
      providedDocuments: [...state.documentation.providedDocuments],
      missingDocuments: [...state.documentation.missingDocuments]
    },
    evidence: [...state.evidence],
    timeline: [...state.timeline],
    scoreTrend: [...state.scoreTrend]
  };

  let scoreImpact = 0;
  let confidenceImpact = 0;

  if (input.type === "safety-improvement") {
    next.cyberSafety.formalSafetyProgram = true;
    next.cyberSafety.safetyCultureIndicator = clamp(next.cyberSafety.safetyCultureIndicator + 8);
    next.cyberSafety.oshaCompliant = true;
    scoreImpact += 6;
    confidenceImpact += 6;
  }

  if (input.type === "new-risk" && /vehicle|van|truck/i.test(input.title + input.description)) {
    next.profile.vehiclesUsed = true;
    scoreImpact -= 4;
  }

  if (input.type === "upload-document") {
    const lower = `${input.title} ${input.description}`.toLowerCase();
    if (lower.includes("loss")) {
      const index = next.evidence.findIndex((doc) => doc.documentType === "loss-runs");
      if (index >= 0) {
        next.evidence[index] = { ...next.evidence[index], status: "current", uploadedAt: new Date().toISOString() };
      }
      if (!next.documentation.providedDocuments.includes("Loss Runs")) {
        next.documentation.providedDocuments.push("Loss Runs");
      }
      next.documentation.missingDocuments = next.documentation.missingDocuments.filter((doc) => doc !== "Loss Runs");
      confidenceImpact += 8;
      scoreImpact += 4;
    }
  }

  if (input.type === "claim") {
    next.claimsFinancial.priorClaims = [...next.claimsFinancial.priorClaims, input.title];
    next.claimsFinancial.totalClaimsCount += 1;
    next.claimsFinancial.claimsOpenCount += 1;
    next.claimsFinancial.claimFrequencyRate = Number((next.claimsFinancial.totalClaimsCount / Math.max(next.profile.yearsInBusiness, 1)).toFixed(2));
    next.claimsFinancial.yearsSinceLastClaim = 0;
    scoreImpact -= 8;
    confidenceImpact -= 2;
  }

  next.timeline.unshift(buildEvent(next, input, scoreImpact, confidenceImpact));

  const recalculated = calculateReadiness(next);
  next.scoreTrend.push({
    date: new Date().toISOString().slice(0, 10),
    readiness: recalculated.overallScore,
    confidence: recalculated.confidenceScore
  });

  return next;
}

export function confidenceLabel(score: number): "Low" | "Medium" | "High" {
  if (score < 50) return "Low";
  if (score < 75) return "Medium";
  return "High";
}
