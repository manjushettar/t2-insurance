"""CLI bridge: read raw features from JSON, run engine, output score JSON to stdout and report to file."""
import json
import sys
from dataclasses import asdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from engine import compute_score


def serialize(obj):
    if isinstance(obj, float):
        return round(obj, 4)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def main():
    if len(sys.argv) != 3:
        print("Usage: run_engine.py <input_json> <output_report>", file=sys.stderr)
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    raw = json.loads(input_path.read_text())
    result = compute_score(raw)

    # JSON output to stdout
    output = {
        "composite_score": result.composite_score,
        "raw_weighted_score": result.raw_weighted_score,
        "completeness_ratio": result.completeness,
        "pillars": [
            {
                "name": p.name,
                "weight": p.weight,
                "score": p.score,
                "confidence": p.confidence,
            }
            for p in result.pillars
        ],
        "knockouts": [
            {
                "trigger": k.trigger,
                "cap": k.cap,
                "explanation": k.explanation,
                "remediation": k.remediation,
            }
            for k in result.knockouts
        ],
        "recommendations": [
            {
                "feature": r.feature,
                "action": r.action,
                "projected_gain": r.projected_gain,
            }
            for r in result.recommendations
        ],
        "contribution_table": [
            {
                "name": c.name,
                "pillar": c.pillar,
                "raw_value": c.raw_value,
                "normalized": c.normalized,
                "weight_in_pillar": c.weight_in_pillar,
                "points_contributed": c.points_contributed,
                "provided": c.provided,
            }
            for c in result.contribution_table
        ],
    }

    json.dump(output, sys.stdout, default=serialize)

    # Text report to output file
    lines = [
        f"Insurance Readiness Score Report",
        f"=" * 40,
        f"Composite Score: {result.composite_score:.1f} / 100",
        f"Raw Weighted Score (pre-knockouts): {result.raw_weighted_score:.1f}",
        f"Documentation Completeness: {result.completeness:.0%}",
        f"",
        f"Pillar Breakdown:",
    ]
    for p in result.pillars:
        lines.append(
            f"  {p.name:<35} score={p.score:5.1f}  weight={p.weight:.0%}  confidence={p.confidence:.0%}"
        )

    if result.knockouts:
        lines.append("")
        lines.append("Knockouts Triggered:")
        for k in result.knockouts:
            lines.append(f"  [{k.trigger}] cap={k.cap}  {k.explanation}")
            lines.append(f"  -> {k.remediation}")

    lines.append("")
    lines.append("Top Recommendations:")
    for r in result.recommendations[:5]:
        lines.append(f"  +{r.projected_gain:.2f} pts  ({r.feature}) {r.action}")

    output_path.write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
