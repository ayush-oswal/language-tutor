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

export function useSession(sessionId: string) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn && sessionId ? ["session", sessionId] : null,
    () => client.getSession(sessionId),
    { refreshInterval: 5000 },
  );
  return { session: data, error, isLoading, mutate };
}
