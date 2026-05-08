"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { apiRequest, type User } from "@/lib/api";
import { saveAuthSession } from "@/lib/auth";

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Completing Google sign in..." />}>
      <GoogleCallbackContent />
    </Suspense>
  );
}

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing Google sign in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const accessToken = searchParams.get("access_token");

    if (oauthError) {
      setError(oauthError);
      setMessage("Google sign in could not be completed.");
      return;
    }

    if (!accessToken) {
      setError("Missing access token from Google sign in.");
      setMessage("Google sign in could not be completed.");
      return;
    }

    apiRequest<User>("/api/v1/auth/me", { token: accessToken })
      .then((user) => {
        saveAuthSession({
          access_token: accessToken,
          token_type: "bearer",
          user,
        });
        router.replace(
          user.role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard",
        );
      })
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load Google account.",
        );
        setMessage("Google sign in could not be completed.");
      });
  }, [router, searchParams]);

  return <CallbackShell message={message} error={error} />;
}

function CallbackShell({ message, error }: { message: string; error?: string | null }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7fafc] px-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-ocean">
          Google sign in
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">{message}</h1>
        {error ? (
          <>
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm leading-6 text-red-700">
              {error}
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-md bg-ocean px-5 py-3 text-sm font-semibold text-white"
            >
              Back to login
            </Link>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Please wait.</p>
        )}
      </section>
    </main>
  );
}
