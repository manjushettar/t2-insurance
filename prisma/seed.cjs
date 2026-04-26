const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEMO_USER_EMAIL = "demo@insuro.local";

function normalizeTimelineCategory(category) {
  return category
    .replace("business-change", "business_change")
    .replace("risk-improvement", "risk_improvement")
    .replace("risk-increase", "risk_increase");
}

async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (existing) return existing.id;
  const created = await prisma.user.create({ data: { email: DEMO_USER_EMAIL, name: "Demo User" } });
  return created.id;
}

function makeBusiness(options) {
  return {
    profile: {
      id: options.id,
      businessName: options.businessName,
      businessType: options.businessType,
      legalEntityName: options.legalEntityName,
      description: options.description,
      address: options.address,
      zipCode: options.zipCode,
      state: options.state
    },
    rawFeatures: options.rawFeatures,
    scoreResult: options.scoreResult,
    evidence: options.evidence,
    timeline: options.timeline,
    sourceDocuments: options.sourceDocuments
  };
}

const businesses = [
  makeBusiness({
    id: "biz-oakland-sunrise",
    businessName: "Oakland Sunrise Cafe",
    businessType: "restaurant",
    legalEntityName: "Oakland Sunrise Cafe LLC",
    description: "Neighborhood cafe with breakfast and lunch service, dine-in and takeout.",
    address: "1421 Broadway",
    zipCode: "94612",
    state: "CA",
    rawFeatures: {
      business_name: "Oakland Sunrise Cafe",
      entity_type: "restaurant",
      physical_address: "1421 Broadway, Oakland, CA 94612",
      primary_zip_code: "94612",
      years_in_business: 6,
      naics_code: "722513",
      description_of_operations: "Single-location cafe with dine-in, takeout, and limited local catering.",
      number_of_members: 8,
      additional_named_insureds: [],
      annual_revenue: 750000,
      employee_count_ft: 8,
      employee_count_pt: 0,
      credit_score: null,
      sales_percentage_installation_service: null,
      total_claims_count: 1,
      total_claims_paid: 12500,
      open_claims_count: 0,
      loss_run_years: 2,
      prior_carrier_name: "",
      prior_policy_premium: 18000,
      prior_policy_dates: "",
      prior_coverage_declined: false,
      decline_remediated: true,
      decline_evidence_provided: false,
      building_construction_type: "Masonry non-combustible",
      building_year_built: 1996,
      building_year_updated: 2019,
      square_footage: 2600,
      leased_area: 2600,
      fire_alarm_present: true,
      sprinkler_system_present: true,
      fire_extinguishers_present: true,
      distance_to_fire_station: 1.2,
      distance_to_fire_hydrant: 220,
      roof_replaced_recently: true,
      no_visible_water_damage: true,
      electrical_updated: true,
      exterior_well_maintained: true,
      hvac_serviced_recently: true,
      bankruptcy_recent: false,
      prior_cancellation: false,
      cancellation_remediated: true,
      hazardous_exposures_disclosed: false,
      foreign_operations: false,
      criminal_activity_disclosed: false
    },
    scoreResult: {
      composite_score: 63,
      raw_weighted_score: 63,
      pillars: [
        { pillar_key: "operational", pillar_label: "Operational", score: 68, confidence: 62, weighted_points: 13.6 },
        { pillar_key: "claims_financial", pillar_label: "Claims & Financial", score: 64, confidence: 62, weighted_points: 16 },
        { pillar_key: "property_location", pillar_label: "Property & Location", score: 58, confidence: 62, weighted_points: 14.5 },
        { pillar_key: "cyber_safety", pillar_label: "Cyber & Safety", score: 67, confidence: 62, weighted_points: 13.4 },
        { pillar_key: "documentation_completeness", pillar_label: "Documentation Completeness", score: 52, confidence: 52, weighted_points: 5.2 }
      ],
      contribution_table: [
        { feature_key: "years_in_business", feature_label: "Years in business", pillar_key: "operational", raw_value: 6, normalized_value: 0.6, weight: 0.2, points_contributed: 13.6, confidence: 0.8 },
        { feature_key: "claim_frequency", feature_label: "Claim frequency", pillar_key: "claims_financial", raw_value: 0.17, normalized_value: 0.89, weight: 0.2, points_contributed: 12.8, confidence: 0.75 }
      ],
      knockouts: [
        { rule_key: "prior_coverage_declined", label: "Prior coverage declined", triggered: false, explanation: "No prior coverage decline disclosed." },
        { rule_key: "multiple_open_claims", label: "Multiple open claims", triggered: false, explanation: "Open-claim burden is below the synthetic knockout threshold." }
      ],
      recommendations: [
        { id: "loss-runs", title: "Upload current loss runs", description: "Loss runs directly support the claims pillar and reduce underwriting uncertainty.", category: "claims-financial", estimated_gain: 9, priority: "high" },
        { id: "property-controls", title: "Document property protections", description: "Add inspection and suppression documentation to strengthen the property pillar.", category: "property-location", estimated_gain: 8, priority: "high" }
      ],
      completeness: {
        percentage: 52,
        provided_feature_count: 21,
        expected_feature_count: 40,
        missing_features: ["loss_run_years", "supporting_documents"]
      }
    },
    evidence: [
      {
        id: "doc-lease",
        documentType: "lease",
        name: "Current Lease Agreement",
        uploadedAt: new Date("2026-03-20"),
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
    timeline: [
      {
        id: "oak-ev-1",
        date: new Date("2026-01-15"),
        title: "Initial onboarding completed",
        description: "Created profile with baseline operations and financial data.",
        scoreImpact: 0,
        confidenceImpact: 0,
        category: "business-change"
      }
    ],
    sourceDocuments: [
      {
        documentType: "lease",
        originalFileName: "Current Lease Agreement",
        mimeType: "application/pdf",
        storageProvider: "seed",
        storageKey: "doc-lease",
        parseStatus: "parsed",
        semanticStatus: "indexed",
        summary: "Lease confirms cafe tenancy and insured location.",
        extractionMetadata: { extractedFields: ["Address", "Lease term"] }
      }
    ]
  }),
  makeBusiness({
    id: "biz-baybuild",
    businessName: "BayBuild Contractors",
    businessType: "contractor",
    legalEntityName: "BayBuild Contractors Inc.",
    description: "General contractor for mixed residential and small commercial remodel projects.",
    address: "370 Townsend St",
    zipCode: "94107",
    state: "CA",
    rawFeatures: {
      business_name: "BayBuild Contractors",
      entity_type: "contractor",
      physical_address: "370 Townsend St, San Francisco, CA 94107",
      primary_zip_code: "94107",
      years_in_business: 9,
      naics_code: "236220",
      description_of_operations: "General contractor handling remodels with mixed self-perform and subcontracted scopes.",
      number_of_members: 14,
      additional_named_insureds: ["BayBuild Contractors Inc."],
      annual_revenue: 1200000,
      employee_count_ft: 14,
      employee_count_pt: 0,
      credit_score: null,
      sales_percentage_installation_service: 50,
      total_claims_count: 0,
      total_claims_paid: 0,
      open_claims_count: 0,
      loss_run_years: null,
      prior_carrier_name: "",
      prior_policy_premium: 42000,
      prior_policy_dates: "",
      prior_coverage_declined: false,
      decline_remediated: true,
      decline_evidence_provided: false,
      building_construction_type: "Tilt-up concrete",
      building_year_built: 2010,
      building_year_updated: 2021,
      square_footage: 4200,
      leased_area: 4200,
      fire_alarm_present: true,
      sprinkler_system_present: false,
      fire_extinguishers_present: true,
      distance_to_fire_station: 1.8,
      distance_to_fire_hydrant: 300,
      roof_replaced_recently: true,
      no_visible_water_damage: true,
      electrical_updated: true,
      exterior_well_maintained: true,
      hvac_serviced_recently: true,
      bankruptcy_recent: false,
      prior_cancellation: true,
      cancellation_remediated: false,
      hazardous_exposures_disclosed: true,
      foreign_operations: false,
      criminal_activity_disclosed: false
    },
    scoreResult: {
      composite_score: 60,
      raw_weighted_score: 60,
      pillars: [
        { pillar_key: "operational", pillar_label: "Operational", score: 61, confidence: 48, weighted_points: 12.2 },
        { pillar_key: "claims_financial", pillar_label: "Claims & Financial", score: 66, confidence: 48, weighted_points: 16.5 },
        { pillar_key: "property_location", pillar_label: "Property & Location", score: 60, confidence: 48, weighted_points: 15 },
        { pillar_key: "cyber_safety", pillar_label: "Cyber & Safety", score: 58, confidence: 48, weighted_points: 11.6 },
        { pillar_key: "documentation_completeness", pillar_label: "Documentation Completeness", score: 44, confidence: 44, weighted_points: 4.4 }
      ],
      contribution_table: [
        { feature_key: "sales_percentage_installation_service", feature_label: "Installation/service mix", pillar_key: "operational", raw_value: 50, normalized_value: 0.5, weight: 0.2, points_contributed: 12.2, confidence: 0.75 },
        { feature_key: "prior_cancellation", feature_label: "Prior cancellation", pillar_key: "claims_financial", raw_value: true, normalized_value: 0.3, weight: 0.15, points_contributed: 9.9, confidence: 0.7 }
      ],
      knockouts: [
        { rule_key: "prior_coverage_declined", label: "Prior coverage declined", triggered: false, explanation: "No prior coverage decline disclosed." },
        { rule_key: "multiple_open_claims", label: "Multiple open claims", triggered: false, explanation: "Open-claim burden is below the synthetic knockout threshold." }
      ],
      recommendations: [
        { id: "subcontractor-cois", title: "Collect subcontractor COIs", description: "Transfer-of-risk documentation is missing for subcontracted operations.", category: "documentation", estimated_gain: 8, priority: "high" },
        { id: "driver-list", title: "Provide driver list", description: "Vehicle exposure should be supported by current driver information.", category: "documentation", estimated_gain: 6, priority: "medium" }
      ],
      completeness: {
        percentage: 44,
        provided_feature_count: 18,
        expected_feature_count: 41,
        missing_features: ["supporting_documents", "prior_policy_dates"]
      }
    },
    evidence: [
      {
        id: "bdoc-1",
        documentType: "payroll-report",
        name: "Payroll by Job Role",
        uploadedAt: new Date("2026-02-10"),
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
        id: "bay-ev-1",
        date: new Date("2026-02-01"),
        title: "Initial onboarding completed",
        description: "Created contractor profile.",
        scoreImpact: 0,
        confidenceImpact: 0,
        category: "business-change"
      }
    ],
    sourceDocuments: [
      {
        documentType: "payroll-report",
        originalFileName: "Payroll by Job Role",
        mimeType: "application/pdf",
        storageProvider: "seed",
        storageKey: "bdoc-1",
        parseStatus: "parsed",
        semanticStatus: "indexed",
        summary: "Payroll report includes role-level exposure detail.",
        extractionMetadata: { extractedFields: ["Carpenter payroll", "Foreman payroll"] }
      }
    ]
  })
];

async function replaceBusinessGraph(userId, business) {
  await prisma.businessProfile.deleteMany({ where: { id: business.profile.id } });

  await prisma.businessProfile.create({
    data: {
      id: business.profile.id,
      userId,
      businessName: business.profile.businessName,
      businessType: business.profile.businessType,
      legalEntityName: business.profile.legalEntityName,
      description: business.profile.description,
      address: business.profile.address,
      zipCode: business.profile.zipCode,
      state: business.profile.state,
      evidence: {
        create: business.evidence.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          name: doc.name,
          uploadedAt: doc.uploadedAt,
          status: doc.status,
          extractedFields: doc.extractedFields,
          underwritingRelevance: doc.underwritingRelevance,
          confidenceImpact: doc.confidenceImpact
        }))
      },
      timeline: {
        create: business.timeline.map((event) => ({
          id: event.id,
          date: event.date,
          title: event.title,
          description: event.description,
          scoreImpact: event.scoreImpact,
          confidenceImpact: event.confidenceImpact,
          category: normalizeTimelineCategory(event.category)
        }))
      },
      sourceDocuments: {
        create: business.sourceDocuments
      },
      underwritingProfiles: {
        create: {
          version: 1,
          rawFeatures: business.rawFeatures,
          zipAreaFeatures: null,
          acordFlags: {
            bankruptcy_recent: business.rawFeatures.bankruptcy_recent,
            prior_cancellation: business.rawFeatures.prior_cancellation,
            hazardous_exposures_disclosed: business.rawFeatures.hazardous_exposures_disclosed,
            foreign_operations: business.rawFeatures.foreign_operations,
            criminal_activity_disclosed: business.rawFeatures.criminal_activity_disclosed
          },
          synthetic: true,
          completenessHint: business.scoreResult.completeness,
          scoreRuns: {
            create: {
              business: {
                connect: {
                  id: business.profile.id
                }
              },
              engineVersion: "synthetic-v1",
              compositeScore: business.scoreResult.composite_score,
              rawWeightedScore: business.scoreResult.raw_weighted_score,
              pillars: business.scoreResult.pillars,
              contributionTable: business.scoreResult.contribution_table,
              knockouts: business.scoreResult.knockouts,
              recommendations: business.scoreResult.recommendations,
              completeness: business.scoreResult.completeness,
              synthetic: true
            }
          }
        }
      }
    }
  });
}

async function main() {
  const userId = await ensureDemoUser();
  for (const business of businesses) {
    await replaceBusinessGraph(userId, business);
  }
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
