"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{children}</label>;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

export default function OnboardingForm() {
  const [businessContext, setBusinessContext] = useState("");
  const [step, setStep] = useState<"intro" | "details">("intro");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-1",
      role: "assistant",
      content:
        "Thanks. I captured your initial business summary. As you complete the form, this panel can surface guidance, missing items, or follow-up questions."
    },
    {
      id: "assistant-2",
      role: "assistant",
      content:
        "Upload PDFs and photos on the left, then add the structured fields underneath. This area is ready for future conversational assistance."
    }
  ]);

  const submitChatMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed
      },
      {
        id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content: "Message captured. We can wire backend responses into this thread next."
      }
    ]);
    setChatInput("");
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

  return (
    <section className="px-4 py-3 lg:py-2">
      <div className="mx-auto max-w-6xl">
        <div className="relative min-h-[78vh] overflow-hidden">
          <div
            className={`transition-all duration-500 ${
              step === "intro"
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none absolute inset-0 -translate-y-6 opacity-0"
            }`}
          >
            <div className="flex min-h-[78vh] items-center justify-center">
              <div className="w-full max-w-4xl">
                <div className="mx-auto mb-10 max-w-2xl text-center">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Onboarding</p>
                  <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                    Tell me about your business...
                  </h1>
                </div>

                <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/80 px-5 py-4 transition-colors focus-within:border-slate-300 focus-within:bg-white">
                    <textarea
                      rows={6}
                      value={businessContext}
                      onChange={(event) => setBusinessContext(event.target.value)}
                      placeholder="Share anything important about you or your business that may not come through in the forms, like your background, day-to-day operations, customer relationships, or unique logistics."
                      className="w-full resize-none border-0 bg-transparent text-base leading-7 text-slate-800 outline-none placeholder:text-slate-400"
                    />

                    <div className="mt-4 flex items-center justify-end border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("details");
                          if (businessContext.trim()) {
                            setMessages((current) => {
                              const alreadySeeded = current.some((message) => message.id === "seeded-context");
                              if (alreadySeeded) return current;
                              return [
                                ...current,
                                {
                                  id: "seeded-context",
                                  role: "user",
                                  content: businessContext.trim()
                                }
                              ];
                            });
                          }
                        }}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-500 ${
              step === "details"
                ? "relative translate-y-0 opacity-100"
                : "pointer-events-none absolute inset-0 translate-y-8 opacity-0"
            }`}
          >
            <div className="grid gap-4 lg:h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
              <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Business Details</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Complete your onboarding form</h2>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600">
                      Upload supporting files and fill in the core business details. We can wire this into backend processing later.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("intro")}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                  >
                    Back
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-rows-[auto_auto_auto]">
                  <div>
                    <FieldLabel>Uploads</FieldLabel>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                        <span className="mb-1 block font-medium text-slate-800">PDF documents</span>
                        <span className="mb-3 block text-sm text-slate-500">Policies, loss runs, financial statements, licenses</span>
                        <input type="file" accept=".pdf" multiple className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white" />
                      </label>

                      <label className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                        <span className="mb-1 block font-medium text-slate-800">Photos</span>
                        <span className="mb-3 block text-sm text-slate-500">Building photos, equipment, signage, work areas</span>
                        <input type="file" accept="image/*" multiple className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white" />
                      </label>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <FieldLabel>Business Name</FieldLabel>
                      <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white" placeholder="Acme Services LLC" />
                    </div>
                    <div>
                      <FieldLabel>Owner Name</FieldLabel>
                      <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white" placeholder="Jordan Smith" />
                    </div>
                    <div>
                      <FieldLabel>Years In Business</FieldLabel>
                      <input type="number" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white" placeholder="8" />
                    </div>
                    <div>
                      <FieldLabel>Employee Count</FieldLabel>
                      <input type="number" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white" placeholder="24" />
                    </div>
                    <div>
                      <FieldLabel>Annual Revenue</FieldLabel>
                      <input type="number" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white" placeholder="1250000" />
                    </div>
                    <div>
                      <FieldLabel>ZIP Code</FieldLabel>
                      <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white" placeholder="94107" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                      Get your InsuroScore
                    </button>
                  </div>
                </div>
              </div>

              <aside className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex h-full min-h-[520px] flex-col lg:min-h-0">
                  <div className="mb-4 border-b border-slate-200 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Assistant</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Context chat</h3>
                  </div>

                  <div className="flex-1 space-y-3 overflow-auto">
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
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <form onSubmit={onChatSubmit} className="flex gap-2">
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
                    </form>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
