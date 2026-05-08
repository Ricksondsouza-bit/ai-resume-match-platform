import Link from "next/link";
import type { ReactNode } from "react";

import { SessionControl } from "@/components/SessionControl";

const navItems = [
  { href: "/candidate/dashboard", label: "Candidate" },
  { href: "/candidate/resume/upload", label: "Resume" },
  { href: "/jobs", label: "Jobs" },
  { href: "/recruiter/dashboard", label: "Recruiter" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7fafc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-ocean text-sm font-bold text-white">
              AI
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">
                AI Resume Match
              </span>
              <span className="block text-xs text-slate-500">
                Hiring intelligence platform
              </span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-slate-600 transition hover:bg-mist hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <SessionControl />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
