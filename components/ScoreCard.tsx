import { ReadinessScore } from "@/lib/types";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import { Card } from "@/components/ui";

export default function ScoreCard({ score }: { score: ReadinessScore }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Readiness Score</p>
          <h2 className="text-3xl font-bold text-slate-900">{score.overallScore} / 100</h2>
          <p className="mt-2 max-w-lg text-sm text-slate-600">{score.explanation} This is not a quote or coverage decision.</p>
        </div>
        <div className="space-y-2 text-right">
          <ConfidenceBadge score={score.confidenceScore} />
          <p className="text-sm text-slate-600">Confidence score: {score.confidenceScore} / 100</p>
        </div>
      </div>
    </Card>
  );
}
