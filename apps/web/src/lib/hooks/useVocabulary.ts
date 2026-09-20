import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import type { WordStatus } from "@lt/core";
import { useApiClient } from "./useApiClient";

export function useVocabulary(
  languageId: string,
  opts?: { search?: string; status?: WordStatus; page?: number; pageSize?: number },
) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn && languageId ? ["vocabulary", languageId, opts?.search, opts?.status, opts?.page, opts?.pageSize] : null,
    () => client.getVocabulary(languageId, opts),
    { refreshInterval: 5000, keepPreviousData: true },
  );
  return {
    words: data?.words,
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? opts?.pageSize ?? 50,
    error,
    isLoading,
    mutate,
  };
}
