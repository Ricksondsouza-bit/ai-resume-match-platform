export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export type UserRole = "candidate" | "recruiter" | "admin";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type Resume = {
  id: string;
  user_id: string;
  original_filename: string;
  content_type: string;
  file_size_bytes: number;
  status: "uploaded" | "parsing_pending" | "parsed" | "failed";
  created_at: string;
};

export type ParsedResume = Resume & {
  parsed_text: string | null;
  parsed_profile: Record<string, unknown>;
  extracted_skills: string[];
  education: string[];
  work_experience: string[];
  projects: string[];
  years_of_experience: string | null;
};

export type Job = {
  id: string;
  created_by_user_id: string | null;
  title: string;
  company_name: string;
  location: string | null;
  employment_type: string | null;
  seniority_level: string | null;
  description: string;
  requirements: string;
  salary_min: number | null;
  salary_max: number | null;
  status: "draft" | "active" | "closed";
  created_at: string;
  updated_at: string;
};

export type MatchResult = {
  id: string;
  resume_id: string;
  job_id: string;
  score: string;
  explanation: string | null;
  matched_skills: {
    items?: string[];
    count?: number;
  };
  missing_skills: {
    items?: string[];
    count?: number;
  };
  improvement_suggestions: string[];
  created_at: string;
  updated_at: string;
};

type RequestOptions = {
  method?: "GET" | "POST";
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await readApiError(response);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function uploadResume(token: string, file: File): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/v1/resumes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await readApiError(response);
    throw new Error(message);
  }

  return response.json() as Promise<Resume>;
}

export function parseResume(token: string, resumeId: string): Promise<ParsedResume> {
  return apiRequest<ParsedResume>(`/api/v1/resumes/${resumeId}/parse`, {
    method: "POST",
    token,
  });
}

export function createMatchResult(
  token: string,
  resumeId: string,
  jobId: string,
): Promise<MatchResult> {
  return apiRequest<MatchResult>("/api/v1/matches", {
    method: "POST",
    token,
    body: {
      resume_id: resumeId,
      job_id: jobId,
    },
  });
}

async function readApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: unknown };
    return formatApiDetail(payload.detail) ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

function formatApiDetail(detail: unknown): string | null {
  if (!detail) {
    return null;
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "msg" in item) {
          const record = item as { msg?: unknown; loc?: unknown };
          const location = Array.isArray(record.loc) ? record.loc.join(".") : null;
          const message = typeof record.msg === "string" ? record.msg : "Invalid value";
          return location ? `${location}: ${message}` : message;
        }

        return JSON.stringify(item);
      })
      .join("; ");
  }

  if (typeof detail === "object") {
    return JSON.stringify(detail);
  }

  return String(detail);
}
