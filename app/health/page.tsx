import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/server/prisma";

async function getHealth() {
  try {
    const [users, businesses, locationRisks, evidenceDocs, timelineEvents, actions, snapshots] = await Promise.all([
      prisma.user.count(),
      prisma.businessProfile.count(),
      prisma.locationRisk.count(),
      prisma.evidenceDocument.count(),
      prisma.timelineEvent.count(),
      prisma.recommendedAction.count(),
      prisma.readinessSnapshot.count()
    ]);

    return {
      ok: true,
      users,
      businesses,
      locationRisks,
      evidenceDocs,
      timelineEvents,
      actions,
      snapshots,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message,
      checkedAt: new Date().toISOString()
    };
  }
}

export default async function HealthPage() {
  const health = await getHealth();

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
        <p className="text-sm text-slate-600">Database connectivity and persistence sanity check.</p>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm">
            Status:{" "}
            <span className={health.ok ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
              {health.ok ? "OK" : "ERROR"}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Checked at: {health.checkedAt}</p>
          {!health.ok ? <p className="mt-2 text-sm text-rose-700">{health.error}</p> : null}
        </section>

        {health.ok ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Table Counts</h2>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>Users: {health.users}</li>
              <li>Businesses: {health.businesses}</li>
              <li>Location Risks: {health.locationRisks}</li>
              <li>Evidence Documents: {health.evidenceDocs}</li>
              <li>Timeline Events: {health.timelineEvents}</li>
              <li>Recommended Actions: {health.actions}</li>
              <li>Readiness Snapshots: {health.snapshots}</li>
            </ul>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
