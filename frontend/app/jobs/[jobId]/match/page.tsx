import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { MatchResultPanel } from "@/components/MatchResultPanel";
import { API_URL, type Job } from "@/lib/api";

type MatchPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

async function getJob(jobId: string): Promise<Job | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Job;
  } catch {
    return null;
  }
}

export default async function JobMatchResultPage({ params }: MatchPageProps) {
  const { jobId } = await params;
  const job = await getJob(jobId);
  const canCalculateMatch = Boolean(job && isUuid(jobId));

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/jobs" className="text-sm font-semibold text-ocean">
          Back to jobs
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
              Job match result
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ink">
              {job?.title ?? "Job unavailable"}
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {job ? job.company_name : "Start the backend to load this job"}
            </p>
            {job?.description ? (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {job.description}
              </p>
            ) : null}
          </section>

          <MatchResultPanel jobId={jobId} canCalculate={canCalculateMatch} />
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Score breakdown</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["Semantic fit", "Skill overlap", "Experience fit", "Location fit"].map((label) => (
              <div key={label} className="rounded-md bg-mist p-4">
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="mt-2 text-xs text-slate-500">Not calculated yet</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
