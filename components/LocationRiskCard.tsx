import { LocationRisk } from "@/lib/types";
import { Card, Pill } from "@/components/ui";

export default function LocationRiskCard({ locationRisk }: { locationRisk: LocationRisk }) {
  return (
    <Card title="Location Risk Summary">
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <span>ZIP {locationRisk.zipCode}</span>
        <Pill text={`Hazard ${locationRisk.naturalHazardLevel}`} tone={locationRisk.naturalHazardLevel === "high" ? "danger" : locationRisk.naturalHazardLevel === "medium" ? "warn" : "good"} />
      </div>
      <ul className="space-y-1 text-sm text-slate-600">
        <li>Flood risk: {locationRisk.floodRisk}</li>
        <li>Wildfire risk: {locationRisk.wildfireRisk}</li>
        <li>Severe weather risk: {locationRisk.severeWeatherRisk}</li>
        <li>Crime/theft risk: {locationRisk.crimeOrTheftRisk}</li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">{locationRisk.explanation}</p>
      <p className="mt-2 text-xs text-slate-400">Sources placeholder: FEMA NRI, NOAA Storm Events, Census ZIP Business Patterns, EPA EJSCREEN.</p>
    </Card>
  );
}
