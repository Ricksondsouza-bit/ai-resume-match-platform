"use client";

import { useEffect, useState } from "react";

import {
  apiRequest,
  createMatchResult,
  type MatchResult,
  type Resume,
} from "@/lib/api";
import { clearAuthSession, getAccessToken, isAuthenticationError } from "@/lib/auth";

export function MatchResultPanel({
  jobId,
  canCalculate = true,
}: {
  jobId: string;
  canCalculate?: boolean;
}) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!canCalculate) {
      setError("Open a real job from the jobs page before calculating a match.");
      setIsLoadingResumes(false);
      return;
    }

    if (!token) {
      setError("Sign in as a candidate to calculate a match.");
      setIsLoadingResumes(false);
      return;
    }

    apiRequest<Resume[]>("/api/v1/resumes", { token })
      .then((loadedResumes) => {
        setResumes(loadedResumes);
        setSelectedResumeId(loadedResumes[0]?.id ?? "");
      })
      .catch((caughtError) => {
        const message = caughtError instanceof Error ? caughtError.message : "Could not load resumes";
        if (isAuthenticationError(message)) {
          clearAuthSession();
          setError("Your login session expired. Please sign in again to load resumes.");
        } else {
          setError(message);
        }
      })
      .finally(() => setIsLoadingResumes(false));
  }, [canCalculate]);

  async function handleCreateMatch() {
    const token = getAccessToken();
    if (!canCalculate) {
      setError("Open a real job from the jobs page before calculating a match.");
      return;
    }

    if (!token) {
      setError("Sign in as a candidate to calculate a match.");
      return;
    }
    if (!selectedResumeId) {
      setError("Upload a resume before calculating a match.");
      return;
    }

    setError(null);
    setIsMatching(true);
    try {
      const result = await createMatchResult(token, selectedResumeId, jobId);
      setMatchResult(result);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not calculate match";
      if (isAuthenticationError(message)) {
        clearAuthSession();
        setError("Your login session expired. Please sign in again to calculate a match.");
      } else {
        setError(message);
      }
    } finally {
      setIsMatching(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">Candidate match score</p>
          <p className="mt-2 text-4xl font-semibold text-ink">
            {matchResult ? `${Number(matchResult.score).toFixed(0)}%` : "Pending"}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-leaf">
          Placeholder AI v1
        </span>
      </div>

      <div className="mt-6 h-3 rounded-full bg-slate-200">
        <div
          className="h-3 rounded-full bg-ocean transition-all"
          style={{ width: `${matchResult ? Math.min(Number(matchResult.score), 100) : 12}%` }}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={selectedResumeId}
          disabled={!canCalculate || isLoadingResumes || resumes.length === 0}
          onChange={(event) => setSelectedResumeId(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
        >
          {resumes.length > 0 ? (
            resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.original_filename} - {resume.status}
              </option>
            ))
          ) : (
            <option>No resumes uploaded</option>
          )}
        </select>
        <button
          type="button"
          disabled={!canCalculate || isMatching || isLoadingResumes}
          onClick={handleCreateMatch}
          className="rounded-md bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isMatching ? "Matching..." : "Calculate match"}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {matchResult ? (
        <div className="mt-8 space-y-5">
          <p className="rounded-md bg-mist p-4 text-sm leading-6 text-slate-700">
            {matchResult.explanation}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <SkillList title="Matched skills" skills={matchResult.matched_skills.items ?? []} />
            <SkillList title="Missing skills" skills={matchResult.missing_skills.items ?? []} />
          </div>
          <div className="rounded-md border border-slate-200 p-4">
            <h2 className="text-base font-semibold text-ink">Improvement suggestions</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              {matchResult.improvement_suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SkillList({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span key={skill} className="rounded-full bg-mist px-3 py-1 text-xs font-medium text-slate-700">
              {skill}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">No skills detected in this group.</p>
        )}
      </div>
    </div>
  );
}
