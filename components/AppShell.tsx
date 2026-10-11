"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, PiggyBank, User } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/analises", label: "Análises", icon: BarChart3 },
  { href: "/perfil", label: "Ajustes", icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const Logo = (
    <div className="flex items-center gap-2.5">
      <div className="rounded-xl bg-brand p-2 text-white"><PiggyBank className="h-5 w-5" /></div>
      <span className="font-semibold">Finanças</span>
    </div>
  );
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col justify-between border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="space-y-6">
          <div className="px-2 pt-1">{Logo}</div>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${path === n.href ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex"><ThemeToggle /></div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 md:hidden">
        {Logo}
        <ThemeToggle />
      </header>

      <main className="p-4 pb-24 sm:p-6 md:ml-60 md:pb-6"><div className="mx-auto max-w-5xl">{children}</div></main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900 md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${path === n.href ? "text-brand" : "text-slate-500"}`}>
            <n.icon className="h-5 w-5" />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
