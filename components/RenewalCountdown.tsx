import { Card } from "@/components/ui";

export default function RenewalCountdown({ renewalDate }: { renewalDate: string }) {
  const now = new Date();
  const renewal = new Date(renewalDate);
  const days = Math.max(0, Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <Card title="Renewal Countdown">
      <p className="text-2xl font-bold text-slate-900">{days} days</p>
      <p className="mt-1 text-sm text-slate-600">Target renewal date: {renewalDate}</p>
    </Card>
  );
}
