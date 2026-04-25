import { PropertyProfile } from "@/lib/types";
import { Card, Pill } from "@/components/ui";

export default function LocationRiskCard({ property }: { property: PropertyProfile }) {
  return (
    <Card title="Property And Location">
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <span>ZIP {property.zipCode}</span>
        <Pill
          text={`Hazard ${property.naturalHazardLevel}`}
          tone={property.naturalHazardLevel === "high" ? "danger" : property.naturalHazardLevel === "medium" ? "warn" : "good"}
        />
      </div>
      <ul className="space-y-1 text-sm text-slate-600">
        <li>Effective building age: {property.effectiveBuildingAge} years</li>
        <li>Construction: {property.constructionType}</li>
        <li>Property protection score: {property.propertyProtectionScore}</li>
        <li>Location hazard index: {property.locationHazardIndex}</li>
        <li>Fire protection rating: {property.fireProtectionRating}</li>
        <li>Ownership: {property.premisesOwnershipStatus}</li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">{property.explanation}</p>
    </Card>
  );
}
