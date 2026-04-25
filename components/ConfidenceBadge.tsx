import { confidenceLabel } from "@/lib/scoring";

export default function ConfidenceBadge({ score }: { score: number }) {
  const label = confidenceLabel(score);
  const tone = label === "High" ? "bg-emerald-100 text-emerald-700" : label === "Medium" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>Confidence: {label}</span>;
}
