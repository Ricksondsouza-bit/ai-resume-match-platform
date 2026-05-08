"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { parseResume, uploadResume, type ParsedResume, type Resume } from "@/lib/api";
import { clearAuthSession, getAccessToken, isAuthenticationError } from "@/lib/auth";

export function ResumeUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const token = getAccessToken();
    if (!token) {
      setError("Please sign in before uploading a resume.");
      return;
    }

    if (!file) {
      setError("Choose a PDF or DOCX resume first.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedResume = await uploadResume(token, file);
      setResume(uploadedResume);
      setParsedResume(null);
      setFile(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Upload failed";
      if (isAuthenticationError(message)) {
        clearAuthSession();
        setError("Your login session expired. Please sign in again before uploading a resume.");
      } else {
        setError(message);
      }
    } finally {
      setIsUploading(false);
    }
  }

  async function handleParseResume() {
    const token = getAccessToken();
    if (!token || !resume) {
      setError("Upload a resume before parsing.");
      return;
    }

    setError(null);
    setIsParsing(true);
    try {
      const parsed = await parseResume(token, resume.id);
      setParsedResume(parsed);
      setResume(parsed);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Parsing failed";
      if (isAuthenticationError(message)) {
        clearAuthSession();
        setError("Your login session expired. Please sign in again before parsing your resume.");
      } else {
        setError(message);
      }
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="rounded-lg border border-dashed border-slate-300 bg-[#fbfdff] p-8 text-center">
        <p className="text-lg font-semibold text-ink">Upload resume</p>
        <p className="mt-2 text-sm text-slate-600">PDF or DOCX, up to 10 MB.</p>
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-6 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded file:border-0 file:bg-mist file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
      </div>

      {file ? (
        <p className="mt-4 text-sm text-slate-600">
          Selected: <span className="font-medium text-ink">{file.name}</span>
        </p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          {error.toLowerCase().includes("sign in") ? (
            <Link href="/login" className="mt-2 inline-flex font-semibold text-red-800 underline">
              Go to login
            </Link>
          ) : null}
        </div>
      ) : null}

      {resume ? (
        <div className="mt-4 rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
          Resume uploaded as <span className="font-semibold">{resume.original_filename}</span>.
          Status: <span className="font-semibold">{resume.status}</span>.
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isUploading}
          className="rounded-md bg-ocean px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? "Uploading..." : "Upload resume"}
        </button>
        <button
          type="button"
          disabled={!resume || isParsing}
          onClick={handleParseResume}
          className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ocean hover:text-ocean disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isParsing ? "Parsing..." : "Extract profile"}
        </button>
      </div>

      {parsedResume ? (
        <div className="mt-6 rounded-md border border-slate-200 p-4">
          <h2 className="text-base font-semibold text-ink">Extracted profile</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ProfileGroup title="Skills" items={parsedResume.extracted_skills} />
            <ProfileGroup title="Education" items={parsedResume.education} />
            <ProfileGroup title="Work experience" items={parsedResume.work_experience} />
            <ProfileGroup title="Projects" items={parsedResume.projects} />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Years of experience:{" "}
            <span className="font-semibold text-ink">
              {parsedResume.years_of_experience ?? "0"}
            </span>
          </p>
        </div>
      ) : null}
    </form>
  );
}

function ProfileGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span key={item} className="rounded-full bg-mist px-3 py-1 text-xs text-slate-700">
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">Nothing detected yet.</p>
        )}
      </div>
    </div>
  );
}
