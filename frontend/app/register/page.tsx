import { RegisterForm } from "@/components/AuthForms";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen bg-[#f7fafc] px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
            Start here
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Create account</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a candidate or recruiter workspace. Admin accounts remain a
            backend-controlled role.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <RegisterForm />
        </div>
      </section>
      <section className="hidden items-center justify-center lg:flex">
        <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-ocean">Phase 3 frontend</p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Ready for candidate and recruiter journeys.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Registration stores the JWT session locally for this development
            phase and redirects users into the right dashboard.
          </p>
        </div>
      </section>
    </main>
  );
}

