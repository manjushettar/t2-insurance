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

There are **three layers of weights**, and each layer sums to 1.0. That's what keeps the final score on a clean 0–100 scale without any extra rescaling.

### Layer 1 — Normalize each feature to 0–1

Every feature gets converted to a 0–1 number where **1 = best for insurability**. Different features need different conversions:

| Feature looks like… | We convert it by… | Example |
|---|---|---|
| Already 0–1 (e.g. cyber readiness) | Pass through | `0.75 → 0.75` |
| A category (Low/Med/High) | Lookup table | `High → 0.25` |
| A continuous value with sweet spots | Piecewise curve | `4 yrs in business → 0.74` |
| A "more = worse" count | `1 - x/threshold` | `2 claims/yr → 0.0` |

These curves live in `weights.yaml` so we can tune them without code changes.

### Layer 2 — Combine features into a pillar score (0–100)

Within a pillar, every feature has a weight (the weights inside a pillar sum to 1.0). The pillar score is a weighted average:

> **pillar score = average of (weight × normalized value)** — but only over features the user actually provided.

That last part matters. If the user only filled in 60% of a pillar's features, we average over those 60%, **not** over all of them. Missing data isn't punished here — it's tracked separately as a **confidence** number ("score based on 60% of inputs"), shown on the dashboard.

### Layer 3 — Combine pillars into the composite (0–100)

Pillar weights also sum to 1.0 (`0.20 + 0.25 + 0.25 + 0.20 + 0.10`), so:

> **composite = sum of (pillar score × pillar weight)**

No further normalization needed — the math just works.

### Layer 4 — Apply knockouts (caps, not weights)

Knockouts don't enter the math above. After the composite is computed, certain underwriter deal-breakers can cap it:

> **final = min(composite, knockout cap)**

For example: an unremediated prior decline caps the score at 60, even if everything else is perfect. The dashboard then surfaces *why* it was capped and what to do about it.

### Where the dashboard "points" come from

For the contribution table, each feature's points are:

> **points = (feature weight in pillar) × (normalized value) × (pillar weight) × 100**

Add up every row and you get the composite. That's why the table reads as a clean breakdown of where the score came from.

---

All weights, normalization curves, and knockout rules live in **`weights.yaml`** so we can tune them without touching code.
