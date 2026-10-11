import type {
  CEFRLevel,
  ExerciseResult,
  ExerciseStatus,
  ExerciseSummary,
  ExerciseType,
  ExerciseWithAttempts,
  LanguageSummary,
  PaginatedWords,
  SessionOverview,
  WordStatus,
} from "@lt/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface UserProfile {
  id: string;
  clerkUserId: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Every call resolves a fresh Clerk session token before hitting the API —
 * getToken() returns a short-lived JWT the API's Clerk middleware verifies.
 */
export function createApiClient(getToken: () => Promise<string | null>) {
  function call<T>(path: string, init?: RequestInit): Promise<T> {
    return getToken().then((token) => request<T>(path, token, init));
  }

  return {
    getMe: (): Promise<UserProfile> => call("/api/users/me"),

    getLanguages: (): Promise<LanguageSummary[]> => call("/api/languages"),

    getSessions: (): Promise<SessionOverview[]> => call("/api/sessions"),

    enroll: (languageId: string, level: CEFRLevel): Promise<SessionOverview> =>
      call("/api/sessions", { method: "POST", body: JSON.stringify({ languageId, level }) }),

    getSession: (sessionId: string): Promise<SessionOverview> => call(`/api/sessions/${sessionId}`),

    changeLevel: (sessionId: string, level: CEFRLevel): Promise<SessionOverview> =>
      call(`/api/sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify({ level }) }),

    getVocabulary: (
      sessionId: string,
      opts?: { search?: string; status?: WordStatus; level?: CEFRLevel; page?: number; pageSize?: number },
    ): Promise<PaginatedWords> => {
      const params = new URLSearchParams();
      if (opts?.search) params.set("search", opts.search);
      if (opts?.status) params.set("status", opts.status);
      if (opts?.level) params.set("level", opts.level);
      if (opts?.page) params.set("page", String(opts.page));
      if (opts?.pageSize) params.set("pageSize", String(opts.pageSize));
      const qs = params.toString();
      return call(`/api/sessions/${sessionId}/vocabulary${qs ? `?${qs}` : ""}`);
    },

    getExercises: (
      sessionId: string,
      opts?: { type?: ExerciseType; status?: ExerciseStatus },
    ): Promise<ExerciseSummary[]> => {
      const params = new URLSearchParams();
      if (opts?.type) params.set("type", opts.type);
      if (opts?.status) params.set("status", opts.status);
      const qs = params.toString();
      return call(`/api/sessions/${sessionId}/exercises${qs ? `?${qs}` : ""}`);
    },

    getExercise: (exerciseId: string): Promise<ExerciseWithAttempts> => call(`/api/exercises/${exerciseId}`),

    completeExercise: (exerciseId: string, answers: unknown): Promise<ExerciseResult> =>
      call(`/api/exercises/${exerciseId}/complete`, { method: "POST", body: JSON.stringify({ answers }) }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export type { CEFRLevel };
