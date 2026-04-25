# Insurance Readiness Score — Categories & Weights

The score is built from **5 pillars** aligned with the high-signal sections of ACORD 125 (the standard commercial insurance application). Each pillar is a 0–100 sub-score. The final readiness score is a weighted sum.

Pillars 1–4 measure actual risk. Pillar 5 measures whether the business has the paperwork to *prove* it's low-risk — the brief explicitly flags that many SMBs get denied for missing documentation, not real risk.

ACORD-style **underwriting questions** (bankruptcy, prior cancellation, hazardous exposures, etc.) are not pillar features — they're handled as **knockouts** that cap the composite score, because they're deal-breakers, not gradable factors.

---

## Pillar Weights

| # | Pillar | Weight | What it measures |
|---|---|---|---|
| 1 | Operations & Scale | **25%** | Industry, size, maturity, complexity, work-type mix |
| 2 | Claims Experience | **22%** | Frequency, severity, loss ratio, open claims |
| 3 | Financial & Carrier Standing | **10%** | Credit, prior decline, gaps in coverage history |
| 4 | Premises & Location | **33%** | How likely is the physical site to suffer a loss? |
| 5 | Documentation Completeness | **10%** | Can the business produce what underwriters ask for? |
| | **Total** | **100%** | |

Premises and Claims Experience are weighted highest because they map most directly to insurer loss experience — past claims and the building itself are the two things underwriters look at first. Claims Experience and Financial & Carrier Standing are split because they have different remediation paths: claims need operational fixes, credit/decline issues need documentation.

---

## What Feeds Each Pillar

### 1. Operations & Scale (25%)
*Industry, size, and complexity of the business itself.*

- `industry_risk_tier` — derived from NAICS code (Construction = high, Consulting = low)
- `business_maturity_score` — years in business
- `revenue_per_employee` — operational efficiency / scale
- `total_employee_count`
- `operational_complexity_score` — multiple members, additional insureds, ops description
- `work_type_mix` — % installation/service work (higher = more hazard)

### 2. Claims Experience (22%)
*What's actually happened on prior policies.*

- `claim_frequency_rate` — claims per year
- `average_claim_severity` — avg cost per claim
- `loss_ratio_estimate` — claims paid vs. premium
- `claims_open_ratio` — open vs. total claims

### 3. Financial & Carrier Standing (10%)
*Creditworthiness and history with the insurance market.*

- `financial_stability_flag` — credit score + prior decline
- `prior_insurance_stability` — gaps or frequent carrier changes

### 4. Premises & Location (33%)
*The physical site and its surroundings.*

- `property_protection_score` — construction type, alarms, sprinklers
- `fire_protection_rating` — fire systems + distance to station/hydrant
- `effective_building_age` — accounting for renovations
- `area_vacancy_safety` — Census: 1 - vacancy rate for the ZIP
- `area_income_level` — Census: log-scaled median income
- `area_stability` — Census: low-vacancy + education composite
- `self_reported_condition` — owner checklist (roof, water damage, electrical, exterior, HVAC)
- `premises_ownership_status` — owned vs. leased
- `location_hazard_index` — placeholder for FEMA / crime data

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

Pillar weights also sum to 1.0 (`0.25 + 0.22 + 0.10 + 0.33 + 0.10`), so:

> **composite = sum of (pillar score × pillar weight)**

No further normalization needed — the math just works.

### Layer 4 — Apply knockouts (caps, not weights)

Knockouts don't enter the math above. After the composite is computed, certain underwriter deal-breakers can cap it:

> **final = min(composite, knockout cap)**

For example: an unremediated prior decline caps the score at 60, even if everything else is perfect. The dashboard then surfaces *why* it was capped and what to do about it.

Current knockout rules (in `weights.yaml`):

| Trigger | Cap | Notes |
|---|---|---|
| Bankruptcy in last 5 years | 50 | Lift with discharge docs + 5+ yrs clean |
| Prior cancellation, unremediated | 65 | Lift by documenting what changed |
| Hazardous exposures disclosed | 60 | Specialty markets only |
| Foreign operations | 75 | Soft cap — needs additional review |
| Criminal activity disclosed | 40 | Most carriers won't quote |
| Prior coverage declined, unremediated | 60 | Lift with remediation evidence |
| Prior decline remediated, no evidence | 75 | Lift by uploading evidence |
| 3+ open claims | 60 | Lift by closing claims |

### Where the dashboard "points" come from

For the contribution table, each feature's points are:

> **points = (feature weight in pillar) × (normalized value) × (pillar weight) × 100**

Add up every row and you get the composite. That's why the table reads as a clean breakdown of where the score came from.

---

All weights, normalization curves, and knockout rules live in **`weights.yaml`** so we can tune them without touching code.
