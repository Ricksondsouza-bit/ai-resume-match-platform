import Link from "next/link";

import { AppShell } from "@/components/AppShell";

const platformStats = [
  { label: "Candidate profiles", value: "Structured" },
  { label: "Recruiter workflows", value: "Ranked" },
  { label: "Matching engine", value: "AI-ready" },
];

const workflow = [
  "Upload resume",
  "Extract profile",
  "Compare jobs",
  "Explain fit",
];

export default function LandingPage() {
  return (
    <AppShell>
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
                AI Resume Match Platform
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                Match candidates to roles with structured hiring intelligence.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                Job seekers manage resumes and applications. Recruiters publish
                roles and prepare for AI-ranked candidate discovery. The Phase 3
                frontend is ready for the AI pipeline to connect next.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-md bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e]"
                >
                  Create account
                </Link>
                <Link
                  href="/jobs"
                  className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ocean hover:text-ocean"
                >
                  Browse jobs
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-[#fbfdff] p-5 shadow-sm">
              <div className="rounded-md bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Match preview</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Production UI shell
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-leaf">
                    Online
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {workflow.map((item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-mist text-sm font-semibold text-ocean">
                        {index + 1}
                      </span>
                      <div className="h-3 flex-1 rounded-full bg-slate-200">
                        <div
                          className="h-3 rounded-full bg-ocean"
                          style={{ width: `${85 - index * 12}%` }}
                        />
                      </div>
                      <span className="w-28 text-sm font-medium text-slate-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {platformStats.map((stat) => (
                    <div key={stat.label} className="rounded-md bg-mist p-3">
                      <p className="text-xs text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

