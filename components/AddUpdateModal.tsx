"use client";

import { FormEvent, useState } from "react";
import { BusinessUpdateInput, UpdateType } from "@/lib/types";

const options: Array<{ value: UpdateType; label: string }> = [
  { value: "upload-document", label: "Upload document" },
  { value: "business-change", label: "Report business change" },
  { value: "safety-improvement", label: "Report safety improvement" },
  { value: "new-risk", label: "Report new risk/exposure" },
  { value: "update-financials", label: "Update financials" },
  { value: "claim", label: "Add claim/incident" },
  { value: "renewal-reminder", label: "Add renewal reminder" }
];

export default function AddUpdateModal({ onSubmit }: { onSubmit: (input: BusinessUpdateInput) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<UpdateType>("business-change");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({ type, title, description });
    setTitle("");
    setDescription("");
    setType("business-change");
    setOpen(false);
  };

  return (
    <div>
      <button onClick={() => setOpen(true)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        Add Business Update
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Add Business Update</h3>
            <select value={type} onChange={(e) => setType(e.target.value as UpdateType)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What changed?"
              className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                Cancel
              </button>
              <button type="submit" className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
                Save Update
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
