import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { useApiClient } from "./useApiClient";

export function useMe() {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading } = useSWR(isSignedIn ? "me" : null, () => client.getMe());
  return { me: data, error, isLoading };
}
