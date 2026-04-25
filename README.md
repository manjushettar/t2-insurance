# t2-insurance

Insurance Readiness Score engine for the **Plug and Play SMB Innovation Sprint — Track 2** (Urban Business Resilience & Insurance Innovation, sponsored by District Cover).

The system takes raw small-business data — financials, ZIP, claims history, property details, safety/cyber controls — and produces an **insurance readiness score (0–100)** with a per-feature contribution table and an actionable recommendation list. Designed for year-round tracking: a business sees its score improve as it remediates issues.

## What's here

| File | Purpose |
|---|---|
| `engine.py` | Scoring pipeline: derive features → normalize → pillar scores → composite → knockouts → recommendations |
| `weights.yaml` | All weights, normalization curves, knockout rules, and action templates. Tune without touching code. |
| `demo.py` | Runnable example with a sample SMB |
| `scoring_categories_and_weights.md` | Team-facing explanation of pillars, weights, and how the math works |
| `Track 2_ ... brief.pdf` | Original hackathon brief |
| `final_data_features.pdf` | Raw + derived feature spec the engine implements |

## Quick start

```bash
pip install pyyaml
python demo.py
```

Output: composite score, pillar breakdown, top recommendations, and the contribution table.

## Public API

```python
from engine import compute_score, render_contribution_table

result = compute_score(raw_features_dict)

result.composite_score          # 0-100, after knockouts
result.pillars                  # list of PillarScore (name, score, weight, confidence)
result.contribution_table       # per-feature: value, normalized, weight, points
result.knockouts                # triggered caps with explanations + remediation
result.recommendations          # sorted by projected_gain
result.completeness             # 0-1, % of underwriting-required fields supplied
```

## Scoring model (TL;DR)

5 pillars, each 0–100, weighted into the composite:

| Pillar | Weight |
|---|---|
| Operational | 20% |
| Claims & Financial | 25% |
| Property & Location | 25% |
| Cyber & Safety | 20% |
| Documentation Completeness | 10% |

- Each feature normalized to [0,1] (1 = best for insurability)
- Pillar score = weighted average over **provided** features (missing data shown as `confidence`, not penalized)
- **Knockouts** cap the composite for underwriter deal-breakers (e.g. unremediated prior decline → cap 60)

Full math + per-pillar feature lists in [`scoring_categories_and_weights.md`](./scoring_categories_and_weights.md).

## Roadmap

- [ ] Claude vision step → `building_quality_score` from owner-uploaded photos
- [ ] Wire FEMA + crime APIs into `_location_hazard` (currently a coarse ZIP lookup)
- [ ] Conversational ingestion (chatbot UI for raw-feature collection + photo upload)
- [ ] Dashboard rendering of contribution table + recommendation list
- [ ] Year-over-year snapshot diffing for tracking score progression
