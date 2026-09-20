import { z } from "zod";

export const completeExerciseBodySchema = z.object({
  answers: z.unknown(),
});
