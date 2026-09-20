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

export const mcpApi = {
  createLanguage: (userId: string, input: { name: string; languageCode: string; currentLevel: string }) =>
    post<unknown>("/api/mcp/languages", { userId, ...input }),

  listLanguages: (userId: string) => get<unknown>("/api/mcp/languages", { userId }),

  getLanguage: (languageId: string) => get<unknown>(`/api/mcp/languages/${languageId}`),

  submitInitialVocabulary: (languageId: string, submission: unknown) =>
    post<unknown>(`/api/mcp/languages/${languageId}/initial-vocabulary`, { submission }),

  getVocabulary: (languageId: string, opts?: { search?: string; status?: string }) =>
    get<unknown>(`/api/mcp/languages/${languageId}/vocabulary`, opts),

  addWord: (
    languageId: string,
    input: { word: string; translation: string; partOfSpeech?: string; metadata?: Record<string, unknown> },
  ) => post<unknown>(`/api/mcp/languages/${languageId}/words`, input),

  getLearningProgress: (languageId: string) => get<unknown>(`/api/mcp/languages/${languageId}/progress`),

  requestNewWords: (languageId: string, opts?: { count?: number; topic?: string }) =>
    get<unknown>(`/api/mcp/languages/${languageId}/new-words`, opts),

  submitNewWordExercise: (languageId: string, submission: unknown) =>
    post<unknown>(`/api/mcp/languages/${languageId}/new-word-exercises`, { submission }),

  generateRevision: (languageId: string, preferredType: string) =>
    get<unknown>(`/api/mcp/languages/${languageId}/revision`, { preferredType }),

  submitRevisionExercise: (languageId: string, submission: unknown) =>
    post<unknown>(`/api/mcp/languages/${languageId}/revision-exercises`, { submission }),

  generateStory: (languageId: string, topic?: string) =>
    get<unknown>(`/api/mcp/languages/${languageId}/story`, { topic }),

  submitStoryExercise: (languageId: string, submission: unknown) =>
    post<unknown>(`/api/mcp/languages/${languageId}/story-exercises`, { submission }),
};
