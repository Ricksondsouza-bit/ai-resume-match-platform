import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { RecruiterJobForm } from "@/components/RecruiterJobForm";

const recruiterStats = [
  { label: "Active jobs", value: "API-backed" },
  { label: "Candidate ranking", value: "Pending AI" },
  { label: "Analytics", value: "Queued" },
];

export default function RecruiterDashboardPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
              Recruiter dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">
              Create jobs and prepare candidate ranking
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Job posting is connected to the Phase 2 backend. Candidate search,
              ranking, comparison, and analytics are staged for the matching
              pipeline.
            </p>
          </div>
          <Link
            href="/jobs"
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ocean hover:text-ocean"
          >
            View jobs
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {recruiterStats.map((stat) => (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-ink">Post a job</h2>
            <RecruiterJobForm />
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-ink">Ranking readiness</h2>
            <div className="mt-5 space-y-4">
              {[
                "Collect structured job requirements",
                "Generate job embeddings",
                "Search candidate vectors",
                "Persist match explanations",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <span className={`mt-1 h-3 w-3 rounded-full ${index === 0 ? "bg-leaf" : "bg-slate-300"}`} />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}

