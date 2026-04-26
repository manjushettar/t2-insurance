import Link from "next/link";

export default function AppShell({
  children,
  compact = false,
  wide = false
}: {
  children: React.ReactNode;
  compact?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 ${wide ? "max-w-[1600px]" : "max-w-6xl"}`}>
          <Link href="/" className="text-lg font-bold text-slate-900">Insuro</Link>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/onboarding">Onboarding</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/underwriter-view">Underwriter View</Link>
            <Link href="/health">Health</Link>
          </nav>
        </div>
      </header>
      <main className={`mx-auto px-4 ${wide ? "max-w-[1600px]" : "max-w-6xl"} ${compact ? "py-0" : "py-6"}`}>{children}</main>
    </div>
  );
}
