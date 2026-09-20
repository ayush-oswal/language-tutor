import { z } from "zod";

export const addWordBodySchema = z.object({
  word: z.string().min(1),
  translation: z.string().min(1),
  partOfSpeech: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
