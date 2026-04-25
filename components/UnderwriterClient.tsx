"use client";

import { useEffect, useMemo, useState } from "react";
import UnderwriterView from "@/components/UnderwriterView";
import { calculateReadiness } from "@/lib/scoring";
import { AppState } from "@/lib/types";
import { useSearchParams } from "next/navigation";

export default function UnderwriterClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const score = useMemo(() => (state ? calculateReadiness(state) : null), [state]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const id = searchParams.get("id");
      const endpoint = id ? `/api/businesses/${id}` : "/api/businesses/active";
      const response = await fetch(endpoint);
      const data = (await response.json()) as { state: AppState | null };
      setState(data.state);
      setLoading(false);
    }
    load();
  }, [searchParams]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading underwriter view...</p>;
  }
  if (!state || !score) {
    return <p className="text-sm text-slate-600">No business profile found.</p>;
  }
  return <UnderwriterView state={state} score={score} />;
}
