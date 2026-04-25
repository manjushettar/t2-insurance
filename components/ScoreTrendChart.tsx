import { Card } from "@/components/ui";
import { ScoreTrendPoint } from "@/lib/types";

export default function ScoreTrendChart({ points }: { points: ScoreTrendPoint[] }) {
  const recent = points.slice(-6);
  return (
    <Card title="Score Trend Over Time">
      <div className="space-y-2">
        {recent.map((point) => (
          <div key={point.date} className="grid grid-cols-[80px_1fr_1fr] items-center gap-3 text-xs">
            <span className="text-slate-500">{point.date}</span>
            <div className="rounded bg-slate-100 p-1">
              <div className="h-2 rounded bg-brand-600" style={{ width: `${point.readiness}%` }} />
              <p className="mt-1 text-slate-500">Readiness {point.readiness}</p>
            </div>
            <div className="rounded bg-slate-100 p-1">
              <div className="h-2 rounded bg-amber-500" style={{ width: `${point.confidence}%` }} />
              <p className="mt-1 text-slate-500">Confidence {point.confidence}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
