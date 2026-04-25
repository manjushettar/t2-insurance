import { AppState, BusinessProfile, EvidenceDocument, LocationRisk, ScoreTrendPoint } from "@/lib/types";

const today = new Date();
const iso = (d: Date) => d.toISOString();

export const oaklandSunriseProfile: BusinessProfile = {
  id: "biz-oakland-sunrise",
  businessName: "Oakland Sunrise Cafe",
  businessType: "restaurant",
  legalEntityName: "Oakland Sunrise Cafe LLC",
  yearsInBusiness: 6,
  description:
    "Neighborhood cafe with breakfast and lunch service, dine-in and takeout. No alcohol service. Limited catering for local offices.",
  address: "1421 Broadway",
  zipCode: "94612",
  state: "CA",
  annualRevenue: 750000,
  payroll: 260000,
  employeeCount: 8,
  customerFootTraffic: true,
  offsiteWork: false,
  vehiclesUsed: false,
  subcontractorsUsed: false,
  storesCustomerData: true,
  priorClaims: ["Slip-and-fall claim reported two years ago."],
  lastUpdatedAt: iso(today)
};

export const oaklandLocationRisk: LocationRisk = {
  zipCode: "94612",
  naturalHazardLevel: "medium",
  floodRisk: "low",
  wildfireRisk: "medium",
  severeWeatherRisk: "high",
  crimeOrTheftRisk: "medium",
  explanation:
    "Placeholder location profile: moderate property and wildfire exposure with elevated severe weather considerations in regional modeling."
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
    id: "doc-description",
    businessId: oaklandSunriseProfile.id,
    documentType: "business-description",
    name: "Basic Business Description",
    uploadedAt: iso(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 20)),
    status: "uploaded",
    extractedFields: ["Operations summary"],
    underwritingRelevance: "Supports class code alignment and exposure understanding.",
    confidenceImpact: 4
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
  locationRisk: oaklandLocationRisk,
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
    },
    {
      id: "ev-3",
      businessId: oaklandSunriseProfile.id,
      date: "2026-02-20",
      title: "Added payroll estimate",
      description: "Entered payroll and employee count details.",
      scoreImpact: 6,
      confidenceImpact: 3,
      category: "business-change"
    },
    {
      id: "ev-4",
      businessId: oaklandSunriseProfile.id,
      date: "2026-03-12",
      title: "Reported prior slip-and-fall claim",
      description: "Recorded one claim from two years ago.",
      scoreImpact: -5,
      confidenceImpact: 0,
      category: "risk-increase"
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
    yearsInBusiness: 9,
    description:
      "General contractor for mixed residential and small commercial remodel projects across the Bay Area.",
    address: "370 Townsend St",
    zipCode: "94107",
    state: "CA",
    annualRevenue: 1200000,
    payroll: 420000,
    employeeCount: 14,
    customerFootTraffic: false,
    offsiteWork: true,
    vehiclesUsed: true,
    subcontractorsUsed: true,
    storesCustomerData: true,
    priorClaims: [],
    lastUpdatedAt: iso(today)
  },
  locationRisk: {
    zipCode: "94107",
    naturalHazardLevel: "medium",
    floodRisk: "medium",
    wildfireRisk: "low",
    severeWeatherRisk: "medium",
    crimeOrTheftRisk: "medium",
    explanation: "Placeholder location profile for contractor operations and equipment risk context."
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
