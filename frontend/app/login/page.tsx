import { LoginForm } from "@/components/AuthForms";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7fafc] px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Sign in</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Continue to your candidate or recruiter workspace.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>
      </section>
      <section className="hidden items-center justify-center lg:flex">
        <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-ocean">Operational view</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            One login, role-aware workflows.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Candidate accounts open resume and job tools. Recruiter accounts open
            job creation and hiring dashboards backed by the same FastAPI auth
            contract.
          </p>
        </div>
      </section>
    </main>
  );
}

