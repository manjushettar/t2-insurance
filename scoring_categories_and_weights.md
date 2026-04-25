# Insurance Readiness Score — Categories & Weights

The score is built from **5 categories (pillars)**. Each pillar is a 0–100 sub-score. The final readiness score is a weighted sum of these pillars.

Pillars 1–4 measure actual risk. Pillar 5 measures whether the business has the paperwork to *prove* it's low-risk — the brief explicitly flags that many SMBs get denied for missing documentation, not real risk.

---

## Pillar Weights

| # | Pillar | Weight | What it measures |
|---|---|---|---|
| 1 | Operational | **20%** | Is the business stable and the operation manageable? |
| 2 | Claims & Financial | **25%** | Has it cost insurers money before? Is it financially solvent? |
| 3 | Property & Location | **25%** | How likely is the physical site to suffer a loss? |
| 4 | Cyber & Safety | **20%** | Are there controls in place to prevent losses? |
| 5 | Documentation Completeness | **10%** | Can the business produce what underwriters ask for? |
| | **Total** | **100%** | |

Claims and Property are weighted highest because they map most directly to insurer loss experience — past claims and the building itself are the two things underwriters look at first.

---

## What Feeds Each Pillar

### 1. Operational (20%)
*Stability and complexity of the business itself.*

- `industry_risk_tier` — derived from NAICS code (Construction = high, Consulting = low)
- `business_maturity_score` — years in business
- `revenue_per_employee` — operational efficiency / scale
- `total_employee_count`
- `operational_complexity_score` — multiple insureds, install/service mix, ops description

### 2. Claims & Financial (25%)
*Loss history and financial health.*

- `claim_frequency_rate` — claims per year
- `average_claim_severity` — avg cost per claim
- `loss_ratio_estimate` — claims paid vs. premium
- `financial_stability_flag` — credit score + prior decline
- `claims_open_ratio` — open vs. total claims
- `prior_insurance_stability` — gaps or frequent carrier changes

### 3. Property & Location (25%)
*The physical site and its surroundings.*

- `effective_building_age` — accounting for renovations
- `property_protection_score` — construction type, alarms, sprinklers
- `location_hazard_index` — ZIP-code-based external risk (FEMA, crime)
- `fire_protection_rating` — fire systems + distance to station/hydrant
- `premises_ownership_status` — owned vs. leased
- *(later)* `building_quality_score` — derived from owner-uploaded photos via Claude vision

### 4. Cyber & Safety (20%)
*Active controls preventing future losses.*

- `cyber_readiness_score` — MFA, regular backups
- `safety_culture_indicator` — formal safety program, OSHA compliance, training
- `cyber_risk_posture` — incident response plan, third-party vendor risk

### 5. Documentation Completeness (10%)
*Not in the original spec — added by us.* Percentage of expected raw features supplied, weighted by how much underwriters care. Doubles as the system's **confidence** number on the dashboard.

---

## How Pillars Combine into the Final Score

1. Each feature is normalized to 0–1 (good → bad axis).
2. Within a pillar, features are weighted and summed → pillar score (0–100).
3. Pillar scores are weighted by the table above → composite score.
4. **Knockouts** (e.g. unremediated prior decline, multiple open claims) can cap the composite below the weighted-sum result. These reflect underwriter "deal-breakers" that don't get averaged away.

All weights live in a YAML config so we can tune them without touching code.
