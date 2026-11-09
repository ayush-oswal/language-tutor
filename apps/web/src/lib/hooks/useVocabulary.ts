import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import type { CEFRLevel, WordStatus } from "@lt/core";
import { useApiClient } from "./useApiClient";

export function useVocabulary(
  sessionId: string,
  opts?: {
    search?: string;
    status?: WordStatus;
    level?: CEFRLevel;
    page?: number;
    pageSize?: number;
    sortBy?: "mastery";
    sortDir?: "asc" | "desc";
  },
) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading } = useSWR(
    isSignedIn && sessionId
      ? [
          "vocabulary",
          sessionId,
          opts?.search,
          opts?.status,
          opts?.level,
          opts?.page,
          opts?.pageSize,
          opts?.sortBy,
          opts?.sortDir,
        ]
      : null,
    () => client.getVocabulary(sessionId, opts),
    { refreshInterval: 5000, keepPreviousData: true },
  );
  return {
    words: data?.words,
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? opts?.pageSize ?? 50,
    error,
    isLoading,
  };
}
