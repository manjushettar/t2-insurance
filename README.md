# t2-insurance

Insurance Readiness Score engine for SMBs. Plug and Play SMB Innovation Sprint, Track 2.

Takes raw business data (financials, claims, property, ZIP, safety/cyber) and outputs a 0–100 readiness score with a per-feature contribution table and ranked recommendations.

## Run

```bash
pip install pyyaml
python demo.py
```

## Files

- `engine.py` — scoring pipeline
- `weights.yaml` — tunable weights, normalization curves, knockouts, action templates
- `demo.py` — example run
- `scoring_categories_and_weights.md` — pillars, weights, and how the math works

## Usage

```python
from engine import compute_score
result = compute_score(raw_features_dict)
```

`result` exposes `composite_score`, `pillars`, `contribution_table`, `knockouts`, `recommendations`, `completeness`.
