"use client";

import { useMemo, useState } from "react";
import AddUpdateModal from "@/components/AddUpdateModal";
import DimensionProgressBars from "@/components/DimensionProgressBars";
import EvidenceLocker from "@/components/EvidenceLocker";
import LocationRiskCard from "@/components/LocationRiskCard";
import RecommendedActions from "@/components/RecommendedActions";
import RenewalCountdown from "@/components/RenewalCountdown";
import ScoreCard from "@/components/ScoreCard";
import ScoreTrendChart from "@/components/ScoreTrendChart";
import Timeline from "@/components/Timeline";
import { Card } from "@/components/ui";
import { bayBuildContractorState, oaklandInitialState } from "@/lib/mockData";
import { applyUpdate, calculateReadiness } from "@/lib/scoring";
import { loadAppState, saveAppState } from "@/lib/storage";
import { AppState, BusinessUpdateInput } from "@/lib/types";
import Link from "next/link";

export default function DashboardClient() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const score = useMemo(() => calculateReadiness(state), [state]);

  const onUpdate = (input: BusinessUpdateInput) => {
    const next = applyUpdate(state, input);
    setState(next);
    saveAppState(next);
  };

  const resetDemo = () => {
    setState(oaklandInitialState);
    saveAppState(oaklandInitialState);
  };

  const loadContractorDemo = () => {
    setState(bayBuildContractorState);
    saveAppState(bayBuildContractorState);
  };

  const exportSummary = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      business: state.profile,
      score,
      missingEvidence: state.evidence.filter((doc) => doc.status === "missing").map((doc) => doc.name),
      recommendedActions: score.recommendedActions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.profile.businessName.replace(/\\s+/g, "-").toLowerCase()}-submission-summary.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const missingEvidence = state.evidence.filter((doc) => doc.status === "missing");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{state.profile.businessName} Dashboard</h1>
          <p className="text-sm text-slate-600">Living, year-round insurance readiness profile.</p>
        </div>
        <div className="flex gap-2">
          <AddUpdateModal onSubmit={onUpdate} />
          <button onClick={loadContractorDemo} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Load Contractor Demo
          </button>
          <button onClick={resetDemo} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">Reset Demo</button>
          <button onClick={exportSummary} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Export Submission Packet
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
        </div>
        <div className="space-y-4">
          <RenewalCountdown renewalDate={state.renewalDate} />
          <LocationRiskCard locationRisk={state.locationRisk} />
          <Card title="Top Strengths">
            <ul className="space-y-1 text-sm text-slate-600">{score.strengths.map((item) => <li key={item}>- {item}</li>)}</ul>
          </Card>
          <Card title="Top Concerns">
            <ul className="space-y-1 text-sm text-slate-600">{score.concerns.map((item) => <li key={item}>- {item}</li>)}</ul>
          </Card>
          <Card title="Missing Evidence">
            <ul className="space-y-1 text-sm text-slate-600">{missingEvidence.map((doc) => <li key={doc.id}>- {doc.name}</li>)}</ul>
          </Card>
          <Card title="Underwriter View Summary">
            <p className="text-sm text-slate-600">An underwriter may ask for loss runs, property control evidence, and clear corrective action notes.</p>
            <Link href="/underwriter-view" className="mt-3 inline-block text-sm font-semibold text-brand-600">Open Underwriter View</Link>
          </Card>
        </div>
      </div>

      <RecommendedActions actions={score.recommendedActions} />
    </div>
  );
}
