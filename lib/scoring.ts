import {
  AppState,
  BusinessUpdateInput,
  EvidenceDocument,
  LocationRisk,
  ReadinessScore,
  RecommendedAction,
  RiskLevel,
  TimelineEvent
} from "@/lib/types";

const riskToScore: Record<RiskLevel, number> = {
  low: 85,
  medium: 65,
  high: 45
};

const requiredFields: Array<keyof AppState["profile"]> = [
  "businessName",
  "businessType",
  "description",
  "zipCode",
  "annualRevenue",
  "payroll",
  "employeeCount",
  "yearsInBusiness"
];

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function hasCurrentEvidence(evidence: EvidenceDocument[], type: string): boolean {
  return evidence.some((doc) => doc.documentType === type && ["current", "uploaded"].includes(doc.status));
}

function isMissingEvidence(evidence: EvidenceDocument[], type: string): boolean {
  return evidence.some((doc) => doc.documentType === type && doc.status === "missing");
}

function getLocationScore(location: LocationRisk): number {
  const scores = [
    riskToScore[location.naturalHazardLevel],
    riskToScore[location.floodRisk],
    riskToScore[location.wildfireRisk],
    riskToScore[location.severeWeatherRisk],
    riskToScore[location.crimeOrTheftRisk]
  ];
  return clamp(scores.reduce((acc, score) => acc + score, 0) / scores.length);
}

export function buildRecommendedActions(state: AppState): RecommendedAction[] {
  const { profile, evidence } = state;
  const actions: RecommendedAction[] = [];

  if (isMissingEvidence(evidence, "loss-runs")) {
    actions.push({
      id: "act-loss-runs",
      title: "Upload loss runs from prior carrier",
      description: "This evidence can help support loss history review and improve confidence.",
      priority: "high",
      effort: "medium",
      expectedScoreImpact: 8,
      status: "open",
      category: "loss-history"
    });
  }

  if (isMissingEvidence(evidence, "payroll-report")) {
    actions.push({
      id: "act-payroll",
      title: "Upload current payroll report",
      description: "An underwriter may ask for current payroll by role to validate exposures.",
      priority: "high",
      effort: "low",
      expectedScoreImpact: 7,
      status: "open",
      category: "financials"
    });
  }

  if (profile.businessType === "restaurant") {
    if (isMissingEvidence(evidence, "fire-suppression-inspection")) {
      actions.push({
        id: "act-fire",
        title: "Add fire suppression inspection or hood cleaning proof",
        description: "This may improve readiness because fire controls are key for food operations.",
        priority: "high",
        effort: "medium",
        expectedScoreImpact: 10,
        status: "open",
        category: "property-controls"
      });
    }
    actions.push(
      {
        id: "act-photos",
        title: "Upload property safety photos",
        description: "Add photos of exits, extinguishers, electrical panels, and storage areas.",
        priority: "medium",
        effort: "low",
        expectedScoreImpact: 4,
        status: "open",
        category: "property-controls"
      },
      {
        id: "act-slip-corrective",
        title: "Document corrective action for prior slip-and-fall",
        description: "This may improve readiness because it shows risk mitigation after a claim.",
        priority: "medium",
        effort: "medium",
        expectedScoreImpact: 6,
        status: "open",
        category: "loss-history"
      }
    );
  }

  if (profile.businessType === "contractor") {
    if (isMissingEvidence(evidence, "subcontractor-coi")) {
      actions.push({
        id: "act-coi",
        title: "Upload subcontractor certificates of insurance",
        description: "An underwriter may ask for transfer-of-risk evidence on subcontractors.",
        priority: "high",
        effort: "medium",
        expectedScoreImpact: 9,
        status: "open",
        category: "operational-controls"
      });
    }
    if (isMissingEvidence(evidence, "driver-list")) {
      actions.push({
        id: "act-driver",
        title: "Add driver list and vehicle schedule",
        description: "This evidence can help support commercial auto risk review.",
        priority: "high",
        effort: "medium",
        expectedScoreImpact: 8,
        status: "open",
        category: "operational-controls"
      });
    }
  }

  return actions;
}

export function calculateReadiness(state: AppState): ReadinessScore {
  const { profile, evidence, locationRisk, timeline } = state;

  const completedCount = requiredFields.filter((field) => {
    const value = profile[field];
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return Boolean(value);
  }).length;
  let dataCompleteness = (completedCount / requiredFields.length) * 100;
  const missingDocs = evidence.filter((doc) => doc.status === "missing").length;
  dataCompleteness -= missingDocs * 4;
  dataCompleteness = clamp(dataCompleteness);

  let classificationClarity = 45;
  if (profile.description.length > 80) classificationClarity += 25;
  if (profile.businessType !== "other") classificationClarity += 20;
  if (profile.customerFootTraffic !== undefined) classificationClarity += 10;
  classificationClarity = clamp(classificationClarity);

  let financialStability = 50;
  if (profile.annualRevenue > 0) financialStability += 20;
  if (profile.payroll > 0) financialStability += 10;
  if (profile.employeeCount > 0) financialStability += 8;
  if (profile.payroll > profile.annualRevenue * 0.7) financialStability -= 15;
  if (profile.yearsInBusiness >= 5) financialStability += 8;
  financialStability = clamp(financialStability);

  let lossHistory = profile.priorClaims.length === 0 ? 84 : 62 - profile.priorClaims.length * 6;
  const hasCorrectiveAction = timeline.some((event) =>
    /corrective|training|inspection|mitigation/i.test(`${event.title} ${event.description}`)
  );
  if (hasCorrectiveAction) lossHistory += 8;
  lossHistory = clamp(lossHistory);

  let propertyControls = 65;
  if (profile.businessType === "restaurant") {
    if (!hasCurrentEvidence(evidence, "fire-suppression-inspection")) propertyControls -= 20;
    if (hasCurrentEvidence(evidence, "safety-manual")) propertyControls += 6;
  }
  if (timeline.some((event) => /fire suppression|hood cleaning|inspection/i.test(event.title))) {
    propertyControls += 8;
  }
  propertyControls = clamp(propertyControls);

  let operationalControls = 72;
  if (profile.businessType === "contractor" && profile.subcontractorsUsed && !hasCurrentEvidence(evidence, "subcontractor-coi")) {
    operationalControls -= 20;
  }
  if (profile.vehiclesUsed && !hasCurrentEvidence(evidence, "driver-list")) {
    operationalControls -= 15;
  }
  if (timeline.some((event) => /new vehicle/i.test(event.title))) {
    operationalControls -= 6;
  }
  operationalControls = clamp(operationalControls);

  const locationContext = getLocationScore(locationRisk);

  const overallScore = clamp(
    dataCompleteness * 0.2 +
      classificationClarity * 0.15 +
      financialStability * 0.15 +
      lossHistory * 0.15 +
      propertyControls * 0.15 +
      operationalControls * 0.1 +
      locationContext * 0.1
  );

  const evidenceConfidence = evidence.reduce((acc, doc) => {
    if (doc.status === "current") return acc + 8;
    if (doc.status === "uploaded") return acc + 5;
    if (doc.status === "stale") return acc - 4;
    if (doc.status === "expired") return acc - 8;
    return acc - 6;
  }, 40);

  const confidenceScore = clamp(evidenceConfidence + dataCompleteness * 0.25 + timeline.length * 0.8 - missingDocs * 2);

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (financialStability >= 70) strengths.push("Financial baseline is documented with revenue, payroll, and staffing.");
  if (classificationClarity >= 70) strengths.push("Business operations are described clearly enough for initial underwriting review.");
  if (locationContext >= 60) strengths.push("Location profile appears manageable with current placeholder risk factors.");

  if (lossHistory < 65) concerns.push("Prior claim history needs supporting corrective action evidence.");
  if (propertyControls < 60) concerns.push("Property control documentation is incomplete for the current business type.");
  if (operationalControls < 60) concerns.push("Operational exposure details are missing for vehicles or subcontracted work.");
  if (confidenceScore < 60) concerns.push("Confidence score is low because critical evidence is missing or stale.");

  const recommendedActions = buildRecommendedActions(state).slice(0, 7);

  const explanation =
    overallScore >= 70
      ? "Your profile is becoming underwriting-ready, but additional evidence can further improve confidence."
      : "Your business may be insurable, but important underwriting evidence is missing.";

  return {
    overallScore,
    confidenceScore,
    dataCompleteness,
    classificationClarity,
    financialStability,
    lossHistory,
    propertyControls,
    operationalControls,
    locationContext,
    explanation,
    strengths,
    concerns,
    recommendedActions
  };
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
    evidence: [...state.evidence],
    timeline: [...state.timeline],
    scoreTrend: [...state.scoreTrend]
  };

  let scoreImpact = 0;
  let confidenceImpact = 0;

  // These lightweight rules keep update behavior transparent for demo purposes.
  if (input.type === "safety-improvement" && /fire suppression|hood|inspection/i.test(input.title + input.description)) {
    const fireDocIndex = next.evidence.findIndex((doc) => doc.documentType === "fire-suppression-inspection");
    if (fireDocIndex >= 0) {
      next.evidence[fireDocIndex] = {
        ...next.evidence[fireDocIndex],
        status: "current",
        uploadedAt: new Date().toISOString()
      };
    }
    scoreImpact += 8;
    confidenceImpact += 10;
  }

  if (input.type === "new-risk" && /vehicle|van|truck/i.test(input.title + input.description)) {
    next.profile.vehiclesUsed = true;
    if (!next.evidence.some((doc) => doc.documentType === "driver-list")) {
      next.evidence.push({
        id: `doc-driver-${Date.now()}`,
        businessId: next.profile.id,
        documentType: "driver-list",
        name: "Driver List",
        uploadedAt: "",
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Needed for commercial auto exposure review.",
        confidenceImpact: -8
      });
    }
    scoreImpact -= 4;
  }

  if (input.type === "upload-document" && /payroll/i.test(input.title + input.description)) {
    const payrollIndex = next.evidence.findIndex((doc) => doc.documentType === "payroll-report");
    if (payrollIndex >= 0) {
      next.evidence[payrollIndex] = {
        ...next.evidence[payrollIndex],
        status: "current",
        uploadedAt: new Date().toISOString()
      };
    } else {
      next.evidence.push({
        id: `doc-payroll-${Date.now()}`,
        businessId: next.profile.id,
        documentType: "payroll-report",
        name: "Payroll Report",
        uploadedAt: new Date().toISOString(),
        status: "current",
        extractedFields: ["Payroll by role"],
        underwritingRelevance: "Supports financial and class exposure review.",
        confidenceImpact: 8
      });
    }
    scoreImpact += 4;
    confidenceImpact += 8;
  }

  if (input.type === "claim") {
    next.profile.priorClaims = [...next.profile.priorClaims, input.title];
    scoreImpact -= 6;
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
