import Link from "next/link";

import { AppShell } from "@/components/AppShell";

const metrics = [
  { label: "Resume status", value: "Upload ready" },
  { label: "Job matches", value: "Pending AI" },
  { label: "Applications", value: "Trackable" },
];

const actions = [
  {
    id: "upload-resume",
    href: "/candidate/resume/upload",
    title: "Upload resume",
    detail: "Add a PDF or DOCX resume to create your candidate profile.",
  },
  {
    id: "browse-jobs",
    href: "/jobs",
    title: "Browse jobs",
    detail: "Review open jobs from recruiters and inspect match readiness.",
  },
  {
    id: "calculate-match",
    href: "/jobs",
    title: "Calculate a match",
    detail: "Open a real job and compare it with one of your uploaded resumes.",
  },
];

export default function CandidateDashboardPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
              Candidate dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">
              Resume, recommendations, and applications
            </h1>
          </div>
          <Link
            href="/candidate/resume/upload"
            className="rounded-md bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e]"
          >
            Upload resume
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{metric.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-ocean"
            >
              <h2 className="text-lg font-semibold text-ink">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{action.detail}</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Application timeline</h2>
          <div className="mt-5 space-y-4">
            {["Resume uploaded", "AI matching queued", "Application submitted"].map((item, index) => (
              <div key={item} className="flex items-center gap-4">
                <span className={`h-3 w-3 rounded-full ${index === 0 ? "bg-leaf" : "bg-slate-300"}`} />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
