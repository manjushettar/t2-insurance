# t2-insurance

Insurance Readiness Score engine for SMBs. Plug and Play SMB Innovation Sprint, Track 2.

Takes raw business data (operations, claims, property, ZIP, ACORD underwriting flags) and outputs a 0–100 readiness score with a per-feature contribution table and ranked recommendations.

## Run

```bash
pip install pyyaml requests
python demo.py
```

ZIP-area features need a Census API key in `.env` as `CENSUS_API_KEY=...`. Without it, those features are skipped (engine still runs).

## Files

- `engine.py` — scoring pipeline
- `weights.yaml` — tunable weights, normalization curves, knockouts, action templates
- `zipcode.py` / `zip_lookup.py` — Census API + cached lookup
- `demo.py` — example run
- `scoring_categories_and_weights.md` — pillars, weights, and how the math works

## Usage

```python
from engine import compute_score
result = compute_score(raw_features_dict)
```

`result` exposes `composite_score`, `pillars`, `contribution_table`, `knockouts`, `recommendations`, `completeness`.

## Inputs we consume

Grouped by what you'd ask the business owner. Missing fields don't break the score — confidence drops instead.

**1. Identity & operations** *(top of their head)*
- `business_name`, `entity_type`, `physical_address`, `primary_zip_code`
- `years_in_business`, `naics_code`, `description_of_operations`
- `number_of_members`, `additional_named_insureds[]`

**2. Size & finance** *(declarations page / QuickBooks)*
- `annual_revenue`, `employee_count_ft`, `employee_count_pt`
- `credit_score`
- `sales_percentage_installation_service` (work-mix %)

**3. Claims & prior insurance** *(broker / carrier portal)*
- `total_claims_count`, `total_claims_paid`, `open_claims_count`
- `loss_run_years`
- `prior_carrier_name`, `prior_policy_premium`, `prior_policy_dates`
- `prior_coverage_declined`, `decline_remediated`, `decline_evidence_provided`

**4. Property** *(walk-through / building records)*
- `building_construction_type`, `building_year_built`, `building_year_updated`
- `square_footage`, `leased_area`
- `fire_alarm_present`, `sprinkler_system_present`, `fire_extinguishers_present`
- `distance_to_fire_station`, `distance_to_fire_hydrant`

**5. Self-reported condition** *(5 yes/no, attested at intake)*
- `roof_replaced_recently`, `no_visible_water_damage`, `electrical_updated`, `exterior_well_maintained`, `hvac_serviced_recently`

**6. ACORD underwriting questions** *(yes/no, trigger knockouts)*
- `bankruptcy_recent`, `prior_cancellation`, `cancellation_remediated`
- `hazardous_exposures_disclosed`, `foreign_operations`, `criminal_activity_disclosed`

**Auto-fetched, not asked:**
- Census ZIP data (vacancy, stability, income) — derived from `primary_zip_code`

~40 raw inputs total. Roughly half are quick yes/no, half are numeric/text.

## What the engine returns

- **Composite score** (0–100) + raw-weighted score (pre-knockouts)
- **Per-pillar scores and confidences** (5 pillars)
- **Contribution table** — every feature: raw value, normalized, points contributed
- **Triggered knockouts** with explanation + remediation
- **Top recommendations** ranked by projected gain
- **Documentation completeness** percentage
