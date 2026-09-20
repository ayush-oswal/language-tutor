import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { useApiClient } from "./useApiClient";

export function useLanguages() {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading } = useSWR(isSignedIn ? "languages" : null, () => client.getLanguages(), {
    refreshInterval: 5000,
  });
  return { languages: data, error, isLoading };
}
