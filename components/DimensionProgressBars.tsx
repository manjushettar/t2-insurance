import { ReadinessScore } from "@/lib/types";
import { Card } from "@/components/ui";

function Row({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">
          {value} <span className="text-slate-400">({weight}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function DimensionProgressBars({ score }: { score: ReadinessScore }) {
  return (
    <Card title="Scoring Pillars">
      <div className="space-y-3">
        {score.pillars.map((pillar) => (
          <Row key={pillar.id} label={pillar.label} value={pillar.score} weight={pillar.weight} />
        ))}
      </div>
    </Card>
  );
}
