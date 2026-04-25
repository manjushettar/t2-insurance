import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function LandingPage() {
  return (
    <AppShell>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">Insuro</p>
        <h1 className="max-w-2xl text-4xl font-bold text-slate-900">Turn insurance prep into a year-round readiness system.</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Insuro helps small businesses build a living underwriting profile with clear readiness scoring, confidence tracking, evidence locker management, and practical next steps.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">View Demo Dashboard</Link>
          <Link href="/onboarding" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Start Onboarding</Link>
          <Link href="/underwriter-view" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Underwriter View</Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Not a quote engine</h2>
          <p className="mt-1 text-sm text-slate-600">This tool prepares evidence and improves submission quality. It does not issue quotes or guarantee coverage.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Readiness + confidence</h2>
          <p className="mt-1 text-sm text-slate-600">Separate readiness scoring from confidence so missing evidence is clearly visible.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">Agent-underwriter bridge</h2>
          <p className="mt-1 text-sm text-slate-600">Export-ready summary language helps owners and agents prepare cleaner submissions.</p>
        </article>
      </section>
    </AppShell>
  );
}
