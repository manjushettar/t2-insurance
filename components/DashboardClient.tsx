"use client";

import { useEffect, useMemo, useState } from "react";
import EvidenceLocker from "@/components/EvidenceLocker";
import LocationRiskCard from "@/components/LocationRiskCard";
import RecommendedActions from "@/components/RecommendedActions";
import RenewalCountdown from "@/components/RenewalCountdown";
import ScoreCard from "@/components/ScoreCard";
import ScoreTrendChart from "@/components/ScoreTrendChart";
import Timeline from "@/components/Timeline";
import UnderwriterView from "@/components/UnderwriterView";
import DimensionProgressBars from "@/components/DimensionProgressBars";
import { Card } from "@/components/ui";
import { calculateReadiness } from "@/lib/scoring";
import { AppState } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const score = useMemo(() => (state ? calculateReadiness(state) : null), [state]);
  const businessId = searchParams.get("id");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const endpoint = businessId ? `/api/businesses/${businessId}` : "/api/businesses/active";
      const response = await fetch(endpoint);
      const data = (await response.json()) as { state: AppState | null };
      setState(data.state);
      setLoading(false);
    }
    load();
  }, [businessId]);

  const loadDemo = async (preset: "oakland" | "contractor") => {
    const response = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset })
    });
    if (!response.ok) return;
    const data = (await response.json()) as { id: string; state: AppState };
    setState(data.state);
    router.push(`/dashboard?id=${data.id}`);
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  }

  if (!state) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">No demo business loaded yet.</p>
        <div className="flex gap-2">
          <button onClick={() => loadDemo("oakland")} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Load Cafe Demo
          </button>
          <button onClick={() => loadDemo("contractor")} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700">
            Load Contractor Demo
          </button>
        </div>
      </div>
    );
  }

  if (!score) return null;
  const missingEvidence = state.evidence.filter((doc) => doc.status === "missing");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{state.profile.businessName} Dashboard</h1>
          <p className="text-sm text-slate-600">Synthetic underwriting profile aligned to the 5-pillar scoring model.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadDemo("oakland")} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Load Cafe Demo
          </button>
          <button onClick={() => loadDemo("contractor")} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Load Contractor Demo
          </button>
        </div>
      </div>

      <ScoreCard score={score} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DimensionProgressBars score={score} />
          <ScoreTrendChart points={state.scoreTrend} />
          <EvidenceLocker evidence={state.evidence} />
          <Timeline events={state.timeline} />
          <Card title="Documentation Snapshot">
            <p className="text-sm text-slate-600">
              Features completed: {state.documentation.completedFeatureCount}/{state.documentation.expectedFeatureCount}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Missing documents: {state.documentation.missingDocuments.length > 0 ? state.documentation.missingDocuments.join(", ") : "None"}
            </p>
          </Card>
        </div>
        <div className="space-y-4">
          <RenewalCountdown renewalDate={state.renewalDate} />
          <LocationRiskCard property={state.property} />
          <Card title="Top Strengths">
            <ul className="space-y-1 text-sm text-slate-600">{score.strengths.map((item) => <li key={item}>- {item}</li>)}</ul>
          </Card>
          <Card title="Top Concerns">
            <ul className="space-y-1 text-sm text-slate-600">{score.concerns.map((item) => <li key={item}>- {item}</li>)}</ul>
          </Card>
          <Card title="Missing Evidence">
            <ul className="space-y-1 text-sm text-slate-600">{missingEvidence.map((doc) => <li key={doc.id}>- {doc.name}</li>)}</ul>
          </Card>
        </div>
      </div>

      <RecommendedActions actions={score.recommendedActions} />
      <UnderwriterView state={state} score={score} />
    </div>
  );
}
