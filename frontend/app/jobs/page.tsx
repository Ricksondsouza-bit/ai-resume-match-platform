import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { API_URL, type Job } from "@/lib/api";

async function getJobs(): Promise<{ jobs: Job[]; error: string | null }> {
  try {
    const response = await fetch(`${API_URL}/api/v1/jobs`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { jobs: [], error: `Jobs API returned ${response.status}` };
    }

    return { jobs: (await response.json()) as Job[], error: null };
  } catch {
    return {
      jobs: [],
      error: "Backend API is not reachable. Start the FastAPI service to load jobs.",
    };
  }
}

export default async function JobsPage() {
  const { jobs, error } = await getJobs();

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
              Jobs
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">
              Open roles for candidate matching
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Browse active jobs from the backend. Match scores will become live
              when the AI pipeline starts producing match results.
            </p>
          </div>
          <Link
            href="/recruiter/dashboard"
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ocean hover:text-ocean"
          >
            Recruiter dashboard
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4">
          {jobs.length > 0 ? (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          ) : (
            <EmptyJobs />
          )}
        </section>
      </main>
    </AppShell>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-ink">{job.title}</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-leaf">
              {job.status}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {job.company_name}
            {job.location ? ` · ${job.location}` : ""}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            {job.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            {job.employment_type ? <Badge>{job.employment_type}</Badge> : null}
            {job.seniority_level ? <Badge>{job.seniority_level}</Badge> : null}
            <Badge>AI match pending</Badge>
          </div>
        </div>
        <Link
          href={`/jobs/${job.id}/match`}
          className="rounded-md bg-ocean px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#12576e]"
        >
          View match
        </Link>
      </div>
    </article>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-mist px-3 py-1">
      {children}
    </span>
  );
}

function EmptyJobs() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-ink">No jobs yet</h2>
      <p className="mt-2 text-sm text-slate-600">
        Create the first job from the recruiter dashboard once the backend is
        running.
      </p>
      <Link
        href="/recruiter/dashboard"
        className="mt-5 inline-flex rounded-md bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e]"
      >
        Create job
      </Link>
    </div>
  );
}
