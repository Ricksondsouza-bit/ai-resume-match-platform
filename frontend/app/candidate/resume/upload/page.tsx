import { AppShell } from "@/components/AppShell";
import { ResumeUploadForm } from "@/components/ResumeUploadForm";

export default function ResumeUploadPage() {
  return (
    <AppShell>
      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
            Candidate resume
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Upload resume</h1>
          <p className="mt-4 leading-7 text-slate-600">
            Store your resume in the backend so the next AI phase can extract
            skills, build your profile, and calculate job fit.
          </p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink">Accepted files</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>PDF resumes</li>
              <li>DOCX resumes</li>
              <li>Maximum file size: 10 MB</li>
            </ul>
          </div>
        </section>
        <ResumeUploadForm />
      </main>
    </AppShell>
  );
}

