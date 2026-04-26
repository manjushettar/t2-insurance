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
      priorClaims: input.claimsFinancial.priorClaims,
      renewalDate: new Date(input.renewalDate),
      profileData: {
        operationsDescription: input.profile.operationsDescription,
        city: input.profile.city,
        naicsCode: input.profile.naicsCode,
        industryRiskTier: input.profile.industryRiskTier,
        annualPremiumEstimate: input.profile.annualPremiumEstimate,
        multipleInsureds: input.profile.multipleInsureds,
        installServiceMix: input.profile.installServiceMix
      },
      claimsFinancialData: input.claimsFinancial,
      propertyData: input.property,
      cyberSafetyData: input.cyberSafety,
      documentationData: input.documentation,
      locationRisk: {
        create: {
          zipCode: input.property.zipCode,
          naturalHazardLevel: input.property.naturalHazardLevel,
          floodRisk: input.property.floodRisk,
          wildfireRisk: input.property.wildfireRisk,
          severeWeatherRisk: input.property.severeWeatherRisk,
          crimeOrTheftRisk: input.property.crimeOrTheftRisk,
          explanation: input.property.explanation
        }
      },
      evidence: {
        create: input.evidence.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          name: doc.name,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : null,
          status: doc.status,
          extractedFields: doc.extractedFields || [],
          underwritingRelevance: doc.underwritingRelevance,
          confidenceImpact: doc.confidenceImpact
        }))
      },
      sourceDocuments: {
        create: input.sourceDocuments || []
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
          operationalScore: s.operationalScore,
          claimsFinancialScore: s.claimsFinancialScore,
          propertyLocationScore: s.propertyLocationScore,
          cyberSafetyScore: s.cyberSafetyScore,
          documentationScore: s.documentationScore,
          explanation: s.explanation,
          strengths: s.strengths,
          concerns: s.concerns,
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
      description: "Neighborhood cafe with breakfast and lunch service, dine-in and takeout.",
      operationsDescription: "Cafe with dine-in, takeout, and small office catering.",
      address: "1421 Broadway",
      city: "Oakland",
      zipCode: "94612",
      state: "CA",
      naicsCode: "722513",
      industryRiskTier: "moderate",
      annualPremiumEstimate: 18000,
      annualRevenue: 750000,
      payroll: 260000,
      employeeCount: 8,
      multipleInsureds: false,
      installServiceMix: "Dine-in / takeout / catering",
      customerFootTraffic: true,
      offsiteWork: false,
      vehiclesUsed: false,
      subcontractorsUsed: false,
      storesCustomerData: true
    },
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
    property: {
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
      explanation: "Urban cafe location with manageable baseline hazard exposure."
    },
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
      expectedDocuments: ["Lease", "Loss Runs", "Payroll Report", "Fire Suppression Inspection"],
      providedDocuments: ["Lease"],
      missingDocuments: ["Loss Runs", "Payroll Report", "Fire Suppression Inspection"]
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
        id: "doc-loss-runs",
        documentType: "loss-runs",
        name: "Loss Runs",
        uploadedAt: null,
        status: "missing",
        extractedFields: [],
        underwritingRelevance: "Critical for evaluating prior loss history.",
        confidenceImpact: -8
      }
    ],
    sourceDocuments: [
      {
        documentType: "lease",
        originalFileName: "Current Lease Agreement",
        mimeType: "application/pdf",
        storageProvider: "seed",
        parseStatus: "parsed",
        semanticStatus: "indexed",
        summary: "Lease confirms cafe tenancy and insured location."
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
        operationalScore: 68,
        claimsFinancialScore: 64,
        propertyLocationScore: 58,
        cyberSafetyScore: 67,
        documentationScore: 52,
        explanation: "Your business may be insurable, but important underwriting evidence is missing.",
        strengths: ["Financial baseline is documented with revenue, payroll, and staffing."],
        concerns: ["Confidence score is low because critical evidence is missing or stale."]
      }
    ],
    renewalDate: "2026-10-01"
  });

  await replaceBusinessGraph({
    userId,
    profile: {
      id: "biz-baybuild",
      businessName: "BayBuild Contractors",
      businessType: "contractor",
      legalEntityName: "BayBuild Contractors Inc.",
      yearsInBusiness: 9,
      description: "General contractor for residential and small commercial remodels.",
      operationsDescription: "Mixed self-perform and subcontracted remodel work across the Bay Area.",
      address: "370 Townsend St",
      city: "San Francisco",
      zipCode: "94107",
      state: "CA",
      naicsCode: "236220",
      industryRiskTier: "high",
      annualPremiumEstimate: 42000,
      annualRevenue: 1200000,
      payroll: 420000,
      employeeCount: 14,
      multipleInsureds: true,
      installServiceMix: "Framing / finish / MEP coordination",
      customerFootTraffic: false,
      offsiteWork: true,
      vehiclesUsed: true,
      subcontractorsUsed: true,
      storesCustomerData: true
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
      explanation: "Contractor office and yard location with manageable regional hazard exposure."
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
        documentType: "payroll-report",
        name: "Payroll by Job Role",
        uploadedAt: "2026-03-01",
        status: "stale",
        extractedFields: ["Carpenter payroll", "Foreman payroll"],
        underwritingRelevance: "Useful for class-based payroll allocation.",
        confidenceImpact: 5
      }
    ],
    sourceDocuments: [
      {
        documentType: "payroll-report",
        originalFileName: "Payroll by Job Role",
        mimeType: "application/pdf",
        storageProvider: "seed",
        parseStatus: "parsed",
        semanticStatus: "indexed",
        summary: "Payroll breakout by trade and role for contractor operations."
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
        createdAt: "2026-03-01",
        overallScore: 60,
        confidenceScore: 48,
        dataCompleteness: 72,
        classificationClarity: 74,
        financialStability: 69,
        lossHistory: 82,
        propertyControls: 61,
        operationalControls: 56,
        locationContext: 60,
        operationalScore: 58,
        claimsFinancialScore: 70,
        propertyLocationScore: 61,
        cyberSafetyScore: 57,
        documentationScore: 44,
        explanation: "Contractor profile is viable, but evidence and controls are still incomplete.",
        strengths: ["No reported prior claims."],
        concerns: ["Operational and documentation gaps still need follow-up."]
      }
    ],
    renewalDate: "2026-12-15"
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
