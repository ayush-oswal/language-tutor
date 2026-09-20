import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { useApiClient } from "./useApiClient";

export function useLanguage(languageId: string) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn && languageId ? ["language", languageId] : null,
    () => client.getLanguage(languageId),
    { refreshInterval: 5000 },
  );
  return { language: data, error, isLoading, mutate };
}

export function useProgress(languageId: string) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading } = useSWR(
    isSignedIn && languageId ? ["progress", languageId] : null,
    () => client.getProgress(languageId),
    { refreshInterval: 5000 },
  );
  return { progress: data, error, isLoading };
}
