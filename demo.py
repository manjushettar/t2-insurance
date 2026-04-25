"""Run a sample SMB through the readiness engine and print the result."""
from engine import compute_score, render_contribution_table


SAMPLE = {
    # identity / operations
    "business_name": "Mission Coffee Roasters",
    "entity_type": "LLC",
    "years_in_business": 4,
    "naics_code": "722515",                 # snack & nonalcoholic beverage bar -> Medium tier
    "description_of_operations": "Specialty coffee shop with retail roasting on premises.",
    "physical_address": "2000 Mission St, San Francisco, CA",
    "primary_zip_code": "94110",
    "number_of_members": 2,
    "additional_named_insureds": [],

    # financial / employees
    "annual_revenue": 850_000,
    "employee_count_ft": 5,
    "employee_count_pt": 4,
    "credit_score": 690,
    "sales_percentage_installation_service": 0,

    # claims & loss history
    "total_claims_count": 1,
    "total_claims_paid": 4_500,
    "open_claims_count": 0,
    "prior_coverage_declined": False,
    "loss_run_years": 5,

    # prior carrier
    "prior_carrier_name": "Hartford",
    "prior_policy_premium": 8_500,
    "prior_policy_dates": "2023-2024",

    # property & location
    "building_construction_type": "Masonry",
    "building_year_built": 1972,
    "building_year_updated": 2018,
    "fire_alarm_present": True,
    "sprinkler_system_present": True,
    "fire_extinguishers_present": True,
    "distance_to_fire_station": 0.6,
    "distance_to_fire_hydrant": 80,
    "leased_area": True,
    "square_footage": 1800,

    # cyber & safety
    "mfa_implemented": True,
    "data_backups_regular": True,
    "incident_response_plan": False,
    "third_party_vendor_risk_management": False,
    "formal_safety_program": True,
    "employee_safety_training": True,
    "osha_compliance": True,
}


def main():
    r = compute_score(SAMPLE)

    print(f"\nComposite score: {r.composite_score:.1f} / 100")
    print(f"  raw weighted (pre-knockouts): {r.raw_weighted_score:.1f}")
    print(f"  documentation completeness:   {r.completeness:.0%}")
    print()

    print("Pillar breakdown:")
    for p in r.pillars:
        print(f"  {p.name:<30} score={p.score:5.1f}  weight={p.weight:.0%}  confidence={p.confidence:.0%}")
    print()

    if r.knockouts:
        print("Knockouts triggered:")
        for k in r.knockouts:
            print(f"  - [{k.trigger}] cap={k.cap}  {k.explanation}")
            print(f"    -> {k.remediation}")
        print()

    print("Top recommendations:")
    for rec in r.recommendations[:5]:
        print(f"  +{rec.projected_gain:5.2f} pts   ({rec.feature}) {rec.action}")
    print()

    print("Contribution table:")
    print(render_contribution_table(r))


if __name__ == "__main__":
    main()
