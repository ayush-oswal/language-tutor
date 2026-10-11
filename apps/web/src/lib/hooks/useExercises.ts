import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { useApiClient } from "./useApiClient";

export function useExercises(sessionId: string) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading } = useSWR(
    isSignedIn && sessionId ? ["exercises", sessionId] : null,
    () => client.getExercises(sessionId),
    { refreshInterval: 5000 },
  );
  return { exercises: data, error, isLoading };
}

export function useExercise(exerciseId: string) {
  const { isSignedIn } = useAuth();
  const client = useApiClient();
  const { data, error, isLoading, mutate } = useSWR(
    isSignedIn && exerciseId ? ["exercise", exerciseId] : null,
    () => client.getExercise(exerciseId),
    { refreshInterval: 0 },
  );
  return { exercise: data, error, isLoading, mutate };
}
