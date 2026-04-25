import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading dashboard...</p>}>
        <DashboardClient />
      </Suspense>
    </AppShell>
  );
}
