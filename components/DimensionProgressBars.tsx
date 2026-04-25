import { ReadinessScore } from "@/lib/types";
import { Card } from "@/components/ui";

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function DimensionProgressBars({ score }: { score: ReadinessScore }) {
  return (
    <Card title="Score Dimensions">
      <div className="space-y-3">
        <Row label="Data Completeness" value={score.dataCompleteness} />
        <Row label="Classification Clarity" value={score.classificationClarity} />
        <Row label="Financial Stability" value={score.financialStability} />
        <Row label="Loss History" value={score.lossHistory} />
        <Row label="Property Controls" value={score.propertyControls} />
        <Row label="Operational Controls" value={score.operationalControls} />
        <Row label="Location Context" value={score.locationContext} />
      </div>
    </Card>
  );
}
