import { ReactNode } from "react";

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {title ? <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3> : null}
      {children}
    </section>
  );
}

export function Pill({ text, tone = "default" }: { text: string; tone?: "default" | "warn" | "danger" | "good" }) {
  const toneMap = {
    default: "bg-slate-100 text-slate-700",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-700",
    good: "bg-emerald-100 text-emerald-700"
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneMap[tone]}`}>{text}</span>;
}
