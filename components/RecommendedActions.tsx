import { RecommendedAction } from "@/lib/types";
import { Card, Pill } from "@/components/ui";

export default function RecommendedActions({ actions }: { actions: RecommendedAction[] }) {
  return (
    <Card title="Recommended Actions">
      <ul className="space-y-3">
        {actions.map((action) => (
          <li key={action.id} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-800">{action.title}</p>
              <Pill text={action.priority} tone={action.priority === "high" ? "danger" : action.priority === "medium" ? "warn" : "default"} />
            </div>
            <p className="text-sm text-slate-600">{action.description}</p>
            <p className="mt-1 text-xs text-slate-500">Expected readiness impact: +{action.expectedScoreImpact} | Effort: {action.effort}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
