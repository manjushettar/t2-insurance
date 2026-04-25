"""
Insurance Readiness Score engine.

Public entry point:  compute_score(raw_features: dict, config: dict | None = None) -> ScoreResult

Pipeline:
  1. derive_features      raw inputs -> derived features (per spec section 2)
  2. normalize            each derived feature -> [0, 1] (1 = best for insurability)
  3. pillar scoring       weighted average of normalized features per pillar
  4. composite            weighted sum of pillar scores
  5. knockouts            apply underwriter "deal-breaker" caps
  6. recommendations      surface highest-gain actions
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

@dataclass
class FeatureContribution:
    name: str
    pillar: str
    raw_value: Any
    normalized: float | None         # None if feature couldn't be computed
    weight_in_pillar: float          # share of pillar weight (sums to 1.0 per pillar)
    points_contributed: float        # contribution to composite score (0-100 scale)
    provided: bool


@dataclass
class PillarScore:
    name: str
    weight: float
    score: float                     # 0-100, computed over provided features only
    confidence: float                # 0-1, fraction of pillar weight that was provided
    contributions: list[FeatureContribution]


@dataclass
class Knockout:
    trigger: str
    cap: float
    explanation: str
    remediation: str


@dataclass
class Recommendation:
    feature: str
    action: str
    projected_gain: float            # additional composite points if feature reaches normalized=1.0


@dataclass
class ScoreResult:
    composite_score: float           # final score after knockouts
    raw_weighted_score: float        # before knockouts
    pillars: list[PillarScore]
    knockouts: list[Knockout]
    recommendations: list[Recommendation]
    completeness: float              # 0-1 of required underwriting fields supplied
    contribution_table: list[FeatureContribution]


# ---------------------------------------------------------------------------
# Derived feature computation
# ---------------------------------------------------------------------------

# Coarse NAICS prefix -> industry tier. Hackathon-grade; refine later.
_NAICS_HIGH = {"11", "21", "23", "31", "32", "33", "48", "49"}   # ag, mining, construction, manufacturing, transport
_NAICS_MED  = {"22", "44", "45", "56", "62", "72"}               # utilities, retail, admin, healthcare, food
# everything else defaults to Low

# Coarse ZIP hazard table for NorCal demo. TODO: wire FEMA / crime APIs.
_ZIP_HAZARD = {
    "94601": 7, "94603": 8, "94607": 6, "94612": 6,    # Oakland
    "94102": 6, "94110": 5, "94103": 6,                # SF
    "95110": 5, "95112": 5, "95116": 6,                # San Jose
}


def derive_features(raw: dict) -> dict:
    """Compute derived features from raw inputs. Missing inputs propagate as None."""
    d: dict[str, Any] = {}
    now_year = datetime.now().year

    # --- Operational ---
    d["industry_risk_tier"] = _industry_tier(raw.get("naics_code"))
    d["business_maturity_score"] = raw.get("years_in_business")        # normalized via piecewise

    rev = raw.get("annual_revenue")
    ft  = raw.get("employee_count_ft")
    pt  = raw.get("employee_count_pt")
    fte_equiv = (ft or 0) + 0.5 * (pt or 0)
    d["revenue_per_employee"] = (rev / fte_equiv) if rev is not None and fte_equiv > 0 else None

    if ft is not None or pt is not None:
        d["total_employee_count"] = (ft or 0) + (pt or 0)
    else:
        d["total_employee_count"] = None

    d["operational_complexity_score"] = _complexity(raw)

    # --- Claims & Financial ---
    tcc = raw.get("total_claims_count")
    yrs = raw.get("loss_run_years", 5)
    d["claim_frequency_rate"] = (tcc / yrs) if tcc is not None else None

    tcp = raw.get("total_claims_paid")
    if tcc is not None and tcc > 0 and tcp is not None:
        d["average_claim_severity"] = tcp / tcc
    elif tcc == 0:
        d["average_claim_severity"] = 0.0
    else:
        d["average_claim_severity"] = None

    pp = raw.get("prior_policy_premium")
    d["loss_ratio_estimate"] = (tcp / pp) if (tcp is not None and pp) else None

    cs  = raw.get("credit_score")
    pcd = raw.get("prior_coverage_declined")
    if cs is not None or pcd is not None:
        flagged = (cs is not None and cs < 600) or (pcd is True)
        d["financial_stability_flag"] = 0.0 if flagged else 1.0
    else:
        d["financial_stability_flag"] = None

    occ = raw.get("open_claims_count")
    if tcc and occ is not None:
        d["claims_open_ratio"] = occ / tcc
    elif tcc == 0:
        d["claims_open_ratio"] = 0.0
    else:
        d["claims_open_ratio"] = None

    d["prior_insurance_stability"] = _prior_stability(raw)

    # --- Property & Location ---
    yb = raw.get("building_year_built")
    yu = raw.get("building_year_updated")
    if yu:    d["effective_building_age"] = now_year - yu
    elif yb:  d["effective_building_age"] = now_year - yb
    else:     d["effective_building_age"] = None

    d["property_protection_score"] = _property_protection(raw)
    d["location_hazard_index"]     = _location_hazard(raw.get("primary_zip_code"))
    d["fire_protection_rating"]    = _fire_protection(raw)

    leased = raw.get("leased_area")
    d["premises_ownership_status"] = (1.0 if leased is False else 0.7) if leased is not None else None

    d["building_quality_score"] = raw.get("building_quality_score")    # placeholder for vision step

    # --- Cyber & Safety ---
    d["cyber_readiness_score"]    = _cyber_readiness(raw)
    d["safety_culture_indicator"] = _safety_culture(raw, d.get("claim_frequency_rate"))
    d["cyber_risk_posture"]       = _cyber_posture(raw)

    return d


def _industry_tier(naics):
    if not naics:
        return None
    prefix = str(naics)[:2]
    if prefix in _NAICS_HIGH: return "High"
    if prefix in _NAICS_MED:  return "Medium"
    return "Low"


def _complexity(raw):
    keys = ["sales_percentage_installation_service", "number_of_members",
            "additional_named_insureds", "description_of_operations"]
    if not any(raw.get(k) is not None for k in keys):
        return None
    score = 0.0
    if (raw.get("sales_percentage_installation_service") or 0) > 25: score += 0.4
    if (raw.get("number_of_members") or 0) > 3:                      score += 0.2
    if len(raw.get("additional_named_insureds") or []) > 1:          score += 0.2
    if len((raw.get("description_of_operations") or "").split()) > 50: score += 0.2
    return 1.0 - min(score, 1.0)                                     # low complexity is good


def _prior_stability(raw):
    if not raw.get("prior_carrier_name"):
        return None
    return 1.0 if raw.get("prior_policy_dates") else 0.6


def _property_protection(raw):
    keys = ["building_construction_type", "fire_alarm_present", "sprinkler_system_present"]
    if not any(raw.get(k) is not None for k in keys):
        return None
    score = 0
    ct = (raw.get("building_construction_type") or "").lower()
    if "fire" in ct or "resistive" in ct or "masonry" in ct: score += 3
    elif "frame" in ct:                                      score += 1
    if raw.get("fire_alarm_present"):      score += 2
    if raw.get("sprinkler_system_present"): score += 2
    return score / 7.0


def _location_hazard(zip_code):
    if not zip_code:
        return None
    h = _ZIP_HAZARD.get(str(zip_code), 5)        # default medium hazard
    return (10 - h) / 9.0                         # higher hazard -> lower score


def _fire_protection(raw):
    keys = ["fire_alarm_present", "sprinkler_system_present", "fire_extinguishers_present",
            "distance_to_fire_station", "distance_to_fire_hydrant"]
    if not any(raw.get(k) is not None for k in keys):
        return None
    s = 0.0
    if raw.get("fire_alarm_present"):        s += 0.25
    if raw.get("sprinkler_system_present"):  s += 0.25
    if raw.get("fire_extinguishers_present"): s += 0.15
    d_st = raw.get("distance_to_fire_station")
    if d_st is not None: s += 0.20 * max(0.0, 1.0 - d_st / 5.0)
    d_hy = raw.get("distance_to_fire_hydrant")
    if d_hy is not None: s += 0.15 * max(0.0, 1.0 - d_hy / 1000.0)
    return min(s, 1.0)


def _cyber_readiness(raw):
    if raw.get("mfa_implemented") is None and raw.get("data_backups_regular") is None:
        return None
    return (0.5 if raw.get("mfa_implemented") else 0.0) + (0.5 if raw.get("data_backups_regular") else 0.0)


def _safety_culture(raw, claim_freq):
    keys = ["formal_safety_program", "employee_safety_training", "osha_compliance"]
    if not any(raw.get(k) is not None for k in keys):
        return None
    s = sum(0.3 for k in keys if raw.get(k))
    if claim_freq is not None and claim_freq < 0.5: s += 0.1
    return min(s, 1.0)


def _cyber_posture(raw):
    keys = ["mfa_implemented", "data_backups_regular",
            "incident_response_plan", "third_party_vendor_risk_management"]
    if not any(raw.get(k) is not None for k in keys):
        return None
    return sum(0.25 for k in keys if raw.get(k))


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def normalize(feature: str, value, norm_cfg: dict) -> float | None:
    """Map a derived feature value to [0, 1] (1 = best). Returns None if value is None."""
    if value is None:
        return None
    spec = norm_cfg.get(feature)
    if not spec:
        return _clip01(value) if isinstance(value, (int, float)) else None

    t = spec["type"]
    if t == "passthrough":
        return _clip01(value)
    if t == "categorical":
        return spec["map"].get(value, spec.get("default", 0.5))
    if t == "piecewise":
        return _piecewise(value, spec["points"])
    if t == "inverse_clip":
        return max(0.0, 1.0 - float(value) / float(spec["threshold"]))
    raise ValueError(f"unknown normalization type: {t}")


def _clip01(x):
    return max(0.0, min(1.0, float(x)))


def _piecewise(x, points):
    pts = sorted([tuple(p) for p in points])
    if x <= pts[0][0]:  return pts[0][1]
    if x >= pts[-1][0]: return pts[-1][1]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1:
            t = (x - x0) / (x1 - x0) if x1 > x0 else 0.0
            return y0 + t * (y1 - y0)
    return 0.5


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def load_config(path: str | Path | None = None) -> dict:
    p = Path(path) if path else Path(__file__).parent / "weights.yaml"
    return yaml.safe_load(p.read_text())


def compute_score(raw: dict, config: dict | None = None) -> ScoreResult:
    cfg = config or load_config()
    derived = derive_features(raw)
    norm_cfg = cfg["normalization"]
    pillar_cfg = cfg["pillars"]

    pillars: list[PillarScore] = []
    all_contribs: list[FeatureContribution] = []

    for pname, pdata in pillar_cfg.items():
        if pname == "documentation_completeness":
            continue                                  # handled separately below
        pillars.append(_score_pillar(pname, pdata, derived, norm_cfg, all_contribs))

    # Documentation completeness pillar
    completeness = _completeness(raw, cfg.get("documentation", {}))
    doc_cfg = pillar_cfg.get("documentation_completeness")
    if doc_cfg:
        pillars.append(PillarScore(
            name="documentation_completeness",
            weight=doc_cfg["weight"],
            score=completeness * 100,
            confidence=1.0,
            contributions=[],
        ))

    raw_composite = sum(p.score * p.weight for p in pillars)

    knockouts = _apply_knockouts(raw, cfg.get("knockouts", []))
    composite = min(raw_composite, min(k.cap for k in knockouts)) if knockouts else raw_composite

    recs = _recommend(all_contribs, cfg.get("actions", {}), pillars)

    return ScoreResult(
        composite_score=composite,
        raw_weighted_score=raw_composite,
        pillars=pillars,
        knockouts=knockouts,
        recommendations=recs,
        completeness=completeness,
        contribution_table=all_contribs,
    )


def _score_pillar(pname, pdata, derived, norm_cfg, all_contribs):
    p_weight = pdata["weight"]
    feats = pdata["features"]
    expected = sum(feats.values()) or 1.0

    contribs: list[FeatureContribution] = []
    provided_w = 0.0
    weighted_norm = 0.0

    for fname, fweight in feats.items():
        share = fweight / expected
        raw_value = derived.get(fname)
        normed = normalize(fname, raw_value, norm_cfg)
        provided = normed is not None

        if provided:
            provided_w += fweight
            weighted_norm += fweight * normed

        points = share * (normed or 0.0) * p_weight * 100 if provided else 0.0
        c = FeatureContribution(
            name=fname, pillar=pname, raw_value=raw_value,
            normalized=normed, weight_in_pillar=share,
            points_contributed=points, provided=provided,
        )
        contribs.append(c)
        all_contribs.append(c)

    # Score over provided features only — missing data is captured by completeness, not penalized here.
    pillar_score = (weighted_norm / provided_w) * 100 if provided_w > 0 else 0.0
    confidence = provided_w / expected

    return PillarScore(
        name=pname, weight=p_weight, score=pillar_score,
        confidence=confidence, contributions=contribs,
    )


def _completeness(raw, doc_cfg):
    required = doc_cfg.get("required_features", [])
    if not required:
        return 0.0
    weights = doc_cfg.get("weights", {})
    total = sum(weights.get(f, 1.0) for f in required)
    have  = sum(weights.get(f, 1.0) for f in required if raw.get(f) not in (None, "", []))
    return have / total if total else 0.0


def _apply_knockouts(raw, rules):
    out = []
    for r in rules:
        if _matches(raw, r.get("when", {})):
            out.append(Knockout(
                trigger=r.get("id", "?"),
                cap=r["cap"],
                explanation=r.get("explanation", ""),
                remediation=r.get("remediation", ""),
            ))
    return out


def _matches(raw, cond):
    for k, v in cond.items():
        rv = raw.get(k)
        if isinstance(v, dict):
            if "gte" in v and not (rv is not None and rv >= v["gte"]): return False
            if "lt"  in v and not (rv is not None and rv <  v["lt"]):  return False
            if "eq"  in v and rv != v["eq"]:                            return False
            if "in"  in v and rv not in v["in"]:                        return False
        else:
            if rv != v: return False
    return True


def _recommend(contribs, actions, pillars):
    pillar_w = {p.name: p.weight for p in pillars}
    recs = []
    for c in contribs:
        if c.normalized is None or c.normalized >= 0.7:
            continue
        gain = (1 - c.normalized) * c.weight_in_pillar * pillar_w.get(c.pillar, 0) * 100
        template = actions.get(c.name, {})
        recs.append(Recommendation(
            feature=c.name,
            action=template.get("action", f"Improve {c.name}"),
            projected_gain=round(gain, 2),
        ))
    recs.sort(key=lambda r: -r.projected_gain)
    return recs[:8]


# ---------------------------------------------------------------------------
# Pretty printing helpers
# ---------------------------------------------------------------------------

def render_contribution_table(result: ScoreResult) -> str:
    rows = ["| Feature | Pillar | Your value | Normalized | Pillar weight | Points |",
            "|---|---|---|---|---|---|"]
    for c in sorted(result.contribution_table, key=lambda c: -c.points_contributed):
        val = "—" if not c.provided else _fmt(c.raw_value)
        norm = "—" if c.normalized is None else f"{c.normalized:.2f}"
        rows.append(f"| {c.name} | {c.pillar} | {val} | {norm} | {c.weight_in_pillar:.2f} | {c.points_contributed:.2f} |")
    return "\n".join(rows)


def _fmt(v):
    if isinstance(v, float): return f"{v:.2f}"
    if isinstance(v, list):  return f"[{len(v)} items]"
    return str(v)
