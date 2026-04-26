"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Card, Pill } from "@/components/ui";
import { ONBOARDING_DRAFT_STORAGE_KEY } from "@/lib/onboarding-draft";
import { calculateReadiness } from "@/lib/scoring";
import { AppState } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Gauge({ score }: { score: number }) {
  const strokeTone = score <= 33 ? "#f43f5e" : score <= 66 ? "#f59e0b" : "#22c55e";
  const radius = 90;
  const circumference = Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative mx-auto h-48 w-full max-w-[300px]">
      <p className="absolute inset-x-0 top-0 text-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        InsuroScore
      </p>
      <svg viewBox="0 0 240 140" className="absolute inset-x-0 bottom-0 h-40 w-full">
        <path
          d="M 30 120 A 90 90 0 0 1 210 120"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path
          d="M 30 120 A 90 90 0 0 1 210 120"
          fill="none"
          stroke={strokeTone}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <p className="mt-2 text-6xl font-semibold leading-none text-slate-900">{score}</p>
        <p className="mt-2 text-sm text-slate-500">out of 100</p>
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-1",
      role: "assistant",
      content: "This dashboard summarizes the current business profile. Ask for missing items, risk explanations, or recommended next steps."
    }
  ]);
  const score = useMemo(() => (state ? calculateReadiness(state) : null), [state]);
  const businessId = searchParams.get("id");
  const source = searchParams.get("source");

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (source === "onboarding") {
        const raw = window.localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { state?: AppState };
            if (parsed.state) {
              setState(parsed.state);
              setLoading(false);
              return;
            }
          } catch {
            window.localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
          }
        }
      }
      const endpoint = businessId ? `/api/businesses/${businessId}` : "/api/businesses/active";
      const response = await fetch(endpoint);
      const data = (await response.json()) as { state: AppState | null };
      setState(data.state);
      setLoading(false);
    }
    load();
  }, [businessId, source]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!state) return;
    setMessages((current) => {
      const seeded = current.some((message) => message.id === "state-seed");
      if (seeded) return current;
      return [
        ...current,
        {
          id: "state-seed",
          role: "assistant",
          content: `Loaded ${state.profile.businessName}. Current readiness is ${calculateReadiness(state).overallScore}/100 with ${state.documentation.missingDocuments.length} missing documentation items.`
        }
      ];
    });
  }, [state]);

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

  const submitChatMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed && stagedFiles.length === 0) return;

    const userMessage =
      trimmed && stagedFiles.length > 0
        ? `${trimmed}\n\nAttached files: ${stagedFiles.join(", ")}`
        : trimmed || `Attached files: ${stagedFiles.join(", ")}`;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: userMessage },
      {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content:
          stagedFiles.length > 0
            ? `Message and ${stagedFiles.length} file${stagedFiles.length === 1 ? "" : "s"} captured. We can wire real upload handling into this thread next.`
            : "Message captured. This thread is UI-functional and ready for a real backend assistant later."
      }
    ]);
    setChatInput("");
    setStagedFiles([]);
  };

  const onChatSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitChatMessage();
  };

  const onChatKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitChatMessage();
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  }

  if (!state || !score) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">No business loaded yet.</p>
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

  const missingEvidence = state.evidence.filter((doc) => doc.status === "missing");
  const brokerQuestions = [
    state.claimsFinancial.claimsOpenCount > 0
      ? "What is the current status of any open claims, and what remediation has already been completed?"
      : "Have there been any losses, near-misses, or incidents that are not yet reflected in formal claims history?",
    missingEvidence.length > 0
      ? "Can you provide the missing supporting documents before submission?"
      : "Are the uploaded documents current for this policy period?"
  ];

  return (
    <section className="px-1 py-2">
      <div className="grid gap-4 lg:h-[calc(100vh-4.75rem)] lg:grid-cols-[minmax(0,2.2fr)_minmax(360px,1fr)]">
          <div className="grid h-full min-h-0 gap-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-rows-[auto_1fr]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{state.profile.businessName}</h1>
                <p className="mt-2 text-sm text-slate-600">
                  {source === "onboarding"
                    ? "Preliminary Insuro workspace generated from your onboarding inputs."
                    : "Live underwriting workspace aligned to the 5-pillar model."}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadDemo("oakland")} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                  Cafe Demo
                </button>
                <button onClick={() => loadDemo("contractor")} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                  Contractor Demo
                </button>
              </div>
            </div>

            <div className="grid min-h-0 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="flex min-h-0 flex-col rounded-[1.6rem]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current Readiness</p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">{score.explanation}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <Pill text={`Confidence ${score.confidenceScore}`} tone={score.confidenceScore >= 70 ? "good" : score.confidenceScore >= 50 ? "warn" : "danger"} />
                    <Pill text={`${missingEvidence.length} missing docs`} tone={missingEvidence.length > 0 ? "warn" : "good"} />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 items-center justify-center">
                  <Gauge score={score.overallScore} />
                </div>
              </Card>

              <div className="grid min-h-0 gap-4 grid-rows-[auto_auto_auto]">
                <Card title="Review Summary" className="rounded-[1.6rem]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryStat label="Revenue" value={`$${state.profile.annualRevenue.toLocaleString()}`} />
                    <SummaryStat label="Employees" value={`${state.profile.employeeCount}`} />
                    <SummaryStat label="Location" value={state.profile.zipCode} />
                    <SummaryStat label="Open Claims" value={`${state.claimsFinancial.claimsOpenCount}`} />
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                    <p><span className="font-medium text-slate-800">Business:</span> {state.profile.description}</p>
                    <p><span className="font-medium text-slate-800">Top concern:</span> {score.concerns[0] || "No major concern flagged in the current draft."}</p>
                    <p><span className="font-medium text-slate-800">Top strength:</span> {score.strengths[0] || "Operational baseline is still being established."}</p>
                  </div>
                </Card>

                <Card title="Broker Questions To Expect" className="rounded-[1.6rem]">
                  <div className="grid gap-3 text-sm leading-6 text-slate-700">
                    {brokerQuestions.map((question) => (
                      <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        {question}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Recommended Next Step" className="rounded-[1.6rem]">
                  <div className="space-y-3">
                    {score.recommendedActions.slice(0, 2).map((action) => (
                      <div key={action.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">{action.title}</p>
                          <Pill text={action.priority} tone={action.priority === "high" ? "danger" : action.priority === "medium" ? "warn" : "default"} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <aside className="h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex h-full min-h-[520px] min-h-0 flex-col overflow-hidden lg:min-h-0">
              <div className="mb-4 border-b border-slate-200 pb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Assistant</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Context chat</h3>
              </div>

              <div ref={messagesContainerRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[90%] rounded-3xl rounded-br-md bg-slate-900 px-4 py-3 text-sm leading-6 text-white"
                        : "max-w-[90%] rounded-3xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700"
                    }
                  >
                    {message.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <form onSubmit={onChatSubmit} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) =>
                          setStagedFiles(Array.from(event.target.files ?? []).map((file) => file.name))
                        }
                      />
                      Upload additional files
                    </label>
                    {stagedFiles.length > 0 ? (
                      <p className="text-xs text-slate-500">
                        {stagedFiles.length} file{stagedFiles.length === 1 ? "" : "s"} staged
                      </p>
                    ) : null}
                  </div>
                  {stagedFiles.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {stagedFiles.join(", ")}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={onChatKeyDown}
                      placeholder="Ask a question or add context..."
                      className="w-full rounded-[1.6rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </aside>
      </div>
    </section>
  );
}
