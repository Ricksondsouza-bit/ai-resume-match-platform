"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { API_URL, apiRequest, type AuthResponse, type UserRole } from "@/lib/api";
import { clearAuthSession, saveAuthSession } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAuthSession();
    setError(null);
    setIsSubmitting(true);

    try {
      const auth = await apiRequest<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      });
      saveAuthSession(auth);
      router.push(
        auth.user.role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Login failed. Check your email and password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      <Divider />
      <GoogleButton role="candidate" label="Continue with Google" />
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-ocean">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAuthSession();
    setError(null);
    setIsSubmitting(true);

    try {
      const auth = await apiRequest<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: {
          email,
          full_name: fullName,
          password,
          role,
        },
      });
      saveAuthSession(auth);
      router.push(role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
      <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Account type</label>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-mist p-1">
          {(["candidate", "recruiter"] as UserRole[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              className={`rounded px-3 py-2 text-sm font-medium capitalize transition ${
                role === option
                  ? "bg-white text-ink shadow-sm"
                  : "text-slate-600 hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-ocean px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#12576e] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
      <Divider />
      <GoogleButton role={role} label={`Continue with Google as ${role}`} />
      <p className="text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-ocean">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        or
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function GoogleButton({ role, label }: { role: UserRole; label: string }) {
  return (
    <a
      href={`${API_URL}/api/v1/auth/google/login?role=${role}`}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-ocean hover:text-ocean"
    >
      <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-300 text-xs font-bold text-ocean">
        G
      </span>
      {label}
    </a>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      />
    </div>
  );
}
