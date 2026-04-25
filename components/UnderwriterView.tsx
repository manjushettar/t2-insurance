import { AppState, ReadinessScore } from "@/lib/types";
import { Card } from "@/components/ui";

export default function UnderwriterView({ state, score }: { state: AppState; score: ReadinessScore }) {
  const missingEvidence = state.evidence.filter((doc) => doc.status === "missing");
  const positiveEvidence = state.evidence.filter((doc) => doc.status === "current" || doc.status === "uploaded");

  return (
    <div className="space-y-4">
      <Card title="Underwriter View">
        <p className="text-sm text-slate-700">
          This is a readiness summary and not a final underwriting or coverage decision.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          An underwriter may ask whether the {state.profile.businessType === "restaurant" ? "cafe has an active fire suppression inspection and hood cleaning documentation" : "contractor has active subcontractor COIs and driver schedules"}, and whether corrective action was taken after any claim history.
        </p>
      </Card>

      <Card title="Business Operations">
        <p className="text-sm text-slate-600">{state.profile.description}</p>
      </Card>

      <Card title="Key Exposures">
        <ul className="list-disc pl-5 text-sm text-slate-600">
          <li>Customer foot traffic: {state.profile.customerFootTraffic ? "Yes" : "No"}</li>
          <li>Off-site work: {state.profile.offsiteWork ? "Yes" : "No"}</li>
          <li>Vehicles used: {state.profile.vehiclesUsed ? "Yes" : "No"}</li>
          <li>Subcontractors used: {state.profile.subcontractorsUsed ? "Yes" : "No"}</li>
        </ul>
      </Card>

      <Card title="Claims/Loss History">
        <p className="text-sm text-slate-600">{state.profile.priorClaims.length > 0 ? state.profile.priorClaims.join(" ") : "No known prior claims reported."}</p>
      </Card>

      <Card title="Missing Data and Evidence">
        <ul className="space-y-1 text-sm text-slate-600">
          {missingEvidence.map((doc) => (
            <li key={doc.id}>- {doc.name}</li>
          ))}
        </ul>
      </Card>

      <Card title="Positive Evidence">
        <ul className="space-y-1 text-sm text-slate-600">
          {positiveEvidence.map((doc) => (
            <li key={doc.id}>- {doc.name}</li>
          ))}
        </ul>
      </Card>

      <Card title="Likely Questions">
        <ul className="space-y-1 text-sm text-slate-600">
          <li>- What controls were added after prior incidents?</li>
          <li>- Are payroll and financials current to this policy period?</li>
          <li>- Can supporting risk-control documents be provided now?</li>
        </ul>
      </Card>

      <Card title="Readiness Snapshot">
        <p className="text-sm text-slate-600">
          Readiness {score.overallScore}/100, Confidence {score.confidenceScore}/100.
          {" "}This evidence can help support cleaner submission quality to agents and underwriters.
        </p>
      </Card>
    </div>
  );
}
