import { AppState, ReadinessScore } from "@/lib/types";
import { Card } from "@/components/ui";

export default function UnderwriterView({ state, score }: { state: AppState; score: ReadinessScore }) {
  const missingEvidence = state.evidence.filter((doc) => doc.status === "missing");
  const positiveEvidence = state.evidence.filter((doc) => doc.status === "current" || doc.status === "uploaded");

  return (
    <div className="space-y-4">
      <Card title="Underwriter View">
        <p className="text-sm text-slate-700">Synthetic underwriting summary based on the 5-pillar readiness model.</p>
        <p className="mt-2 text-sm text-slate-600">
          This business is scored across operations, claims and financials, property and location, cyber and safety, and documentation completeness.
        </p>
      </Card>

      <Card title="Business Operations">
        <p className="text-sm text-slate-600">{state.profile.operationsDescription}</p>
      </Card>

      <Card title="Operational Factors">
        <ul className="space-y-1 text-sm text-slate-600">
          <li>NAICS: {state.profile.naicsCode || "Not provided"}</li>
          <li>Industry risk tier: {state.profile.industryRiskTier}</li>
          <li>Years in business: {state.profile.yearsInBusiness}</li>
          <li>Multiple insureds: {state.profile.multipleInsureds ? "Yes" : "No"}</li>
          <li>Install/service mix: {state.profile.installServiceMix || "Not specified"}</li>
        </ul>
      </Card>

      <Card title="Claims And Financial">
        <ul className="space-y-1 text-sm text-slate-600">
          <li>Total claims: {state.claimsFinancial.totalClaimsCount}</li>
          <li>Open claims: {state.claimsFinancial.claimsOpenCount}</li>
          <li>Average severity: ${state.claimsFinancial.averageClaimSeverity.toLocaleString()}</li>
          <li>Loss ratio estimate: {state.claimsFinancial.lossRatioEstimate}</li>
          <li>Financial stability: {state.claimsFinancial.financialStabilityFlag}</li>
          <li>Prior insurance decline: {state.claimsFinancial.priorInsuranceDeclined ? "Yes" : "No"}</li>
        </ul>
      </Card>

      <Card title="Property And Location">
        <ul className="space-y-1 text-sm text-slate-600">
          <li>Effective building age: {state.property.effectiveBuildingAge}</li>
          <li>Construction type: {state.property.constructionType}</li>
          <li>Protection score: {state.property.propertyProtectionScore}</li>
          <li>Hazard index: {state.property.locationHazardIndex}</li>
          <li>Fire protection rating: {state.property.fireProtectionRating}</li>
        </ul>
      </Card>

      <Card title="Cyber And Safety">
        <ul className="space-y-1 text-sm text-slate-600">
          <li>Cyber readiness score: {state.cyberSafety.cyberReadinessScore}</li>
          <li>Safety culture indicator: {state.cyberSafety.safetyCultureIndicator}</li>
          <li>Cyber risk posture: {state.cyberSafety.cyberRiskPosture}</li>
          <li>MFA enabled: {state.cyberSafety.mfaEnabled ? "Yes" : "No"}</li>
          <li>Regular backups: {state.cyberSafety.regularBackups ? "Yes" : "No"}</li>
          <li>Training cadence: {state.cyberSafety.employeeTrainingCadence}</li>
        </ul>
      </Card>

      <Card title="Missing Data And Evidence">
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

      <Card title="Pillar Snapshot">
        <ul className="space-y-1 text-sm text-slate-600">
          {score.pillars.map((pillar) => (
            <li key={pillar.id}>
              {pillar.label}: {pillar.score}/100
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
