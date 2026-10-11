import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { useApiClient } from "./useApiClient";

/** The catalogue of languages available to enroll in. */
export function useLanguages() {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading } = useSWR(isSignedIn ? "languages" : null, () => client.getLanguages());
  return { languages: data, error, isLoading };
}
