"use client";

import { useMemo, useState } from "react";
import UnderwriterView from "@/components/UnderwriterView";
import { calculateReadiness } from "@/lib/scoring";
import { loadAppState } from "@/lib/storage";
import { AppState } from "@/lib/types";

export default function UnderwriterClient() {
  const [state] = useState<AppState>(() => loadAppState());
  const score = useMemo(() => calculateReadiness(state), [state]);

  return <UnderwriterView state={state} score={score} />;
}
