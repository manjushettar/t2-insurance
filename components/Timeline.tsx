import { TimelineEvent } from "@/lib/types";
import { Card } from "@/components/ui";

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <Card title="Year-Round Timeline Updates">
      <ul className="space-y-3">
        {events.slice(0, 8).map((event) => (
          <li key={event.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-800">{event.title}</p>
              <p className="text-xs text-slate-500">{event.date}</p>
            </div>
            <p className="mt-1 text-sm text-slate-600">{event.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              Readiness impact {event.scoreImpact >= 0 ? `+${event.scoreImpact}` : event.scoreImpact}, confidence impact {event.confidenceImpact >= 0 ? `+${event.confidenceImpact}` : event.confidenceImpact}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
