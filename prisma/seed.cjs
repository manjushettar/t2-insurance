const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function ensureDemoUser() {
  const email = "demo@insureready.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing.id;
  const created = await prisma.user.create({ data: { email, name: "Demo User" } });
  return created.id;
}

async function replaceBusinessGraph(input) {
  await prisma.businessProfile.deleteMany({ where: { id: input.profile.id } });

  await prisma.businessProfile.create({
    data: {
      id: input.profile.id,
      userId: input.userId,
      businessName: input.profile.businessName,
      businessType: input.profile.businessType,
      legalEntityName: input.profile.legalEntityName,
      yearsInBusiness: input.profile.yearsInBusiness,
      description: input.profile.description,
      address: input.profile.address,
      zipCode: input.profile.zipCode,
      state: input.profile.state,
      annualRevenue: input.profile.annualRevenue,
      payroll: input.profile.payroll,
      employeeCount: input.profile.employeeCount,
      customerFootTraffic: input.profile.customerFootTraffic,
      offsiteWork: input.profile.offsiteWork,
      vehiclesUsed: input.profile.vehiclesUsed,
      subcontractorsUsed: input.profile.subcontractorsUsed,
      storesCustomerData: input.profile.storesCustomerData,
      priorClaims: JSON.stringify(input.profile.priorClaims),
      renewalDate: new Date(input.renewalDate),
      locationRisk: {
        create: {
          zipCode: input.locationRisk.zipCode,
          naturalHazardLevel: input.locationRisk.naturalHazardLevel,
          floodRisk: input.locationRisk.floodRisk,
          wildfireRisk: input.locationRisk.wildfireRisk,
          severeWeatherRisk: input.locationRisk.severeWeatherRisk,
          crimeOrTheftRisk: input.locationRisk.crimeOrTheftRisk,
          explanation: input.locationRisk.explanation
        }
      },
      evidence: {
        create: input.evidence.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          name: doc.name,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : null,
          status: doc.status,
          extractedFields: JSON.stringify(doc.extractedFields || []),
          underwritingRelevance: doc.underwritingRelevance,
          confidenceImpact: doc.confidenceImpact
        }))
      },
      timeline: {
        create: input.timeline.map((event) => ({
          id: event.id,
          date: new Date(event.date),
          title: event.title,
          description: event.description,
          scoreImpact: event.scoreImpact,
          confidenceImpact: event.confidenceImpact,
          category: event.category
            .replace("business-change", "business_change")
            .replace("risk-improvement", "risk_improvement")
            .replace("risk-increase", "risk_increase")
        }))
      },
      snapshots: {
        create: input.snapshots.map((s) => ({
          overallScore: s.overallScore,
          confidenceScore: s.confidenceScore,
          dataCompleteness: s.dataCompleteness,
          classificationClarity: s.classificationClarity,
          financialStability: s.financialStability,
          lossHistory: s.lossHistory,
          propertyControls: s.propertyControls,
          operationalControls: s.operationalControls,
          locationContext: s.locationContext,
          explanation: s.explanation,
          strengths: JSON.stringify(s.strengths),
          concerns: JSON.stringify(s.concerns),
          createdAt: new Date(s.createdAt)
        }))
      }
    }
  });
}

async function main() {
  const userId = await ensureDemoUser();

  await replaceBusinessGraph({
    userId,
    profile: {
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
      priorClaims: ["Slip-and-fall claim reported two years ago."]
    },
    renewalDate: "2026-10-01",
    locationRisk: {
      zipCode: "94612",
      naturalHazardLevel: "medium",
      floodRisk: "low",
      wildfireRisk: "medium",
      severeWeatherRisk: "high",
      crimeOrTheftRisk: "medium",
      explanation:
        "Placeholder location profile: moderate property and wildfire exposure with elevated severe weather considerations in regional modeling."
    },
    evidence: [
      {
        id: "doc-lease",
        documentType: "lease",
        name: "Current Lease Agreement",
        uploadedAt: "2026-03-20",
        status: "current",
        extractedFields: ["Address", "Lease term", "Landlord details"],
        underwritingRelevance: "Confirms occupancy and control of premises.",
        confidenceImpact: 6
      },
      {
        id: "doc-description",
        documentType: "business-description",
        name: "Basic Business Description",
        uploadedAt: "2026-03-30",
        status: "uploaded",
        extractedFields: ["Operations summary"],
        underwritingRelevance: "Supports class code alignment and exposure understanding.",
        confidenceImpact: 4
      },
      {
        id: "doc-loss-runs",
        documentType: "loss-runs",
        name: "Loss Runs",
        uploadedAt: null,
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Critical for evaluating prior loss history.",
        confidenceImpact: -8
      },
      {
        id: "doc-payroll",
        documentType: "payroll-report",
        name: "Current Payroll Report",
        uploadedAt: null,
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Supports payroll allocation and workers comp estimates.",
        confidenceImpact: -6
      },
      {
        id: "doc-fire",
        documentType: "fire-suppression-inspection",
        name: "Fire Suppression Inspection",
        uploadedAt: null,
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Important restaurant property control evidence.",
        confidenceImpact: -10
      }
    ],
    timeline: [
      {
        id: "ev-1",
        date: "2026-01-15",
        title: "Initial onboarding completed",
        description: "Created profile with baseline operations and financial data.",
        scoreImpact: 0,
        confidenceImpact: 0,
        category: "business-change"
      },
      {
        id: "ev-2",
        date: "2026-02-04",
        title: "Uploaded lease",
        description: "Lease document added to evidence locker.",
        scoreImpact: 0,
        confidenceImpact: 5,
        category: "document"
      }
    ],
    snapshots: [
      {
        createdAt: "2026-04-20",
        overallScore: 63,
        confidenceScore: 52,
        dataCompleteness: 80,
        classificationClarity: 92,
        financialStability: 96,
        lossHistory: 56,
        propertyControls: 45,
        operationalControls: 72,
        locationContext: 61,
        explanation: "Your business may be insurable, but important underwriting evidence is missing.",
        strengths: ["Financial baseline is documented with revenue, payroll, and staffing."],
        concerns: ["Confidence score is low because critical evidence is missing or stale."]
      }
    ]
  });

  await replaceBusinessGraph({
    userId,
    profile: {
      id: "biz-baybuild",
      businessName: "BayBuild Contractors",
      businessType: "contractor",
      legalEntityName: "BayBuild Contractors Inc.",
      yearsInBusiness: 9,
      description: "General contractor for mixed residential and small commercial remodel projects across the Bay Area.",
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
      priorClaims: []
    },
    renewalDate: "2026-12-15",
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
        documentType: "payroll-report",
        name: "Payroll by Job Role",
        uploadedAt: "2026-03-01",
        status: "stale",
        extractedFields: ["Carpenter payroll", "Foreman payroll"],
        underwritingRelevance: "Useful for class-based payroll allocation.",
        confidenceImpact: 5
      },
      {
        id: "bdoc-2",
        documentType: "subcontractor-coi",
        name: "Subcontractor COIs",
        uploadedAt: null,
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Important transfer-of-risk evidence.",
        confidenceImpact: -9
      }
    ],
    timeline: [
      {
        id: "bev-1",
        date: "2026-02-01",
        title: "Initial onboarding completed",
        description: "Created contractor profile.",
        scoreImpact: 0,
        confidenceImpact: 0,
        category: "business-change"
      }
    ],
    snapshots: [
      {
        createdAt: "2026-04-20",
        overallScore: 60,
        confidenceScore: 48,
        dataCompleteness: 76,
        classificationClarity: 85,
        financialStability: 94,
        lossHistory: 84,
        propertyControls: 65,
        operationalControls: 52,
        locationContext: 62,
        explanation: "Your business may be insurable, but important underwriting evidence is missing.",
        strengths: ["Business operations are described clearly enough for initial underwriting review."],
        concerns: ["Operational exposure details are missing for vehicles or subcontracted work."]
      }
    ]
  });

  console.log("Seeded demo businesses.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
