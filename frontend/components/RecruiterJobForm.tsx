"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { apiRequest, type Job } from "@/lib/api";
import { clearAuthSession, getAccessToken, getStoredUser } from "@/lib/auth";

export function RecruiterJobForm() {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [createdJob, setCreatedJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const token = getAccessToken();
    const user = getStoredUser();
    if (!token) {
      setError("Please sign in as a recruiter before creating a job.");
      return;
    }

    if (!user || !["recruiter", "admin"].includes(user.role)) {
      setError("This action needs a recruiter account. Sign out, then register or sign in as a recruiter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const job = await apiRequest<Job>("/api/v1/jobs", {
        method: "POST",
        token,
        body: {
          title,
          company_name: companyName,
          location: location || null,
          employment_type: "Full-time",
          seniority_level: "Mid-level",
          description,
          requirements,
          status: "active",
        },
      });
      setCreatedJob(job);
      setTitle("");
      setCompanyName("");
      setLocation("");
      setDescription("");
      setRequirements("");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Could not create job";
      if (
        message.toLowerCase().includes("invalid authentication") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        clearAuthSession();
        setError("Your saved login session expired. Sign in again as a recruiter.");
      } else if (message.toLowerCase().includes("recruiter or admin role required")) {
        setError("This action needs a recruiter account. Sign out, then sign in as a recruiter.");
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Job title" value={title} onChange={setTitle} />
        <Input label="Company" value={companyName} onChange={setCompanyName} />
      </div>
      <div className="mt-4">
        <Input label="Location" value={location} onChange={setLocation} required={false} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Textarea label="Description" value={description} onChange={setDescription} />
        <Textarea label="Requirements" value={requirements} onChange={setRequirements} />
      </div>

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          <Link href="/login" className="mt-2 inline-flex font-semibold text-red-800 underline">
            Go to login
          </Link>
        </div>
      ) : null}
      {createdJob ? (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
          Created job: <span className="font-semibold">{createdJob.title}</span>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 rounded-md bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Publishing..." : "Publish job"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <textarea
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="mt-2 w-full resize-none rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      />
    </label>
  );
}
