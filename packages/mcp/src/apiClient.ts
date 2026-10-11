const API_BASE_URL = process.env.API_BASE_URL ?? "https://language-tutor-cgwq.onrender.com";

export class RemoteApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "RemoteApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
  if (!res.ok) {
    throw new RemoteApiError(body.message ?? `Request failed: ${res.status}`, body.error ?? "INTERNAL_ERROR");
  }
  return body as T;
}

function get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return request<T>(`${path}${qs ? `?${qs}` : ""}`);
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

const session = (sessionId: string) => `/api/mcp/sessions/${encodeURIComponent(sessionId)}`;

export const mcpApi = {
  listSessions: (userId: string) => get<unknown>("/api/mcp/sessions", { userId }),

  getSession: (sessionId: string) => get<unknown>(session(sessionId)),

  getVocabulary: (sessionId: string, opts?: { search?: string; status?: string }) =>
    get<unknown>(`${session(sessionId)}/vocabulary`, opts),

  getLearningProgress: (sessionId: string) => get<unknown>(`${session(sessionId)}/progress`),

  requestNewWords: (sessionId: string, opts?: { count?: number; tag?: string }) =>
    get<unknown>(`${session(sessionId)}/new-words`, opts),

  submitNewWordExercise: (sessionId: string, submission: unknown) =>
    post<unknown>(`${session(sessionId)}/new-word-exercises`, { submission }),

  generateExercise: (sessionId: string, type: string, topic?: string) =>
    get<unknown>(`${session(sessionId)}/exercise-words`, { type, topic }),

  submitExercise: (sessionId: string, submission: unknown) =>
    post<unknown>(`${session(sessionId)}/exercises`, { submission }),
};
