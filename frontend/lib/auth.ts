"use client";

import type { AuthResponse, User } from "./api";

const TOKEN_KEY = "ai_resume_match_token";
const USER_KEY = "ai_resume_match_user";

export function saveAuthSession(auth: AuthResponse): void {
  window.localStorage.setItem(TOKEN_KEY, auth.access_token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function getAccessToken(): string | null {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }

  if (isJwtExpired(token)) {
    clearAuthSession();
    return null;
  }

  return token;
}

export function getStoredUser(): User | null {
  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isAuthenticationError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("invalid authentication") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("not authenticated") ||
    normalizedMessage.includes("user is inactive")
  );
}

function isJwtExpired(token: string): boolean {
  const [, payload] = token.split(".");
  if (!payload) {
    return true;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(window.atob(normalizedPayload)) as {
      exp?: number;
    };

    if (!decodedPayload.exp) {
      return true;
    }

    return decodedPayload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
