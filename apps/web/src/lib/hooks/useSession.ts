import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { useApiClient } from "./useApiClient";

export function useSessions() {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading, mutate } = useSWR(isSignedIn ? "sessions" : null, () => client.getSessions(), {
    refreshInterval: 5000,
  });
  return { sessions: data, error, isLoading, mutate };
}

/** Pass `{ poll: true }` only where live progress matters (the session dashboard). */
export function useSession(sessionId: string, opts?: { poll?: boolean }) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn && sessionId ? ["session", sessionId] : null,
    () => client.getSession(sessionId),
    { refreshInterval: opts?.poll ? 5000 : 0 },
  );
  return { session: data, error, isLoading, mutate };
}
