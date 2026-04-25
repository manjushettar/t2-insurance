import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import UnderwriterClient from "@/components/UnderwriterClient";

export default function UnderwriterPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading underwriter view...</p>}>
        <UnderwriterClient />
      </Suspense>
    </AppShell>
  );
}
