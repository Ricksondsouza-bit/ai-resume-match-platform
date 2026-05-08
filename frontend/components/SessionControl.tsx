"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { User } from "@/lib/api";
import { clearAuthSession, getStoredUser } from "@/lib/auth";

export function SessionControl() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md border border-slate-300 px-3 py-2 font-medium text-ink transition hover:border-ocean hover:text-ocean"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md bg-mist px-3 py-2 text-xs font-medium text-slate-700">
        {user.role}
      </span>
      <button
        type="button"
        onClick={() => {
          clearAuthSession();
          window.location.href = "/login";
        }}
        className="rounded-md border border-slate-300 px-3 py-2 font-medium text-ink transition hover:border-ocean hover:text-ocean"
      >
        Sign out
      </button>
    </div>
  );
}
