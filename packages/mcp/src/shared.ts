import { z } from "zod";

export const wordStatusSchema = z.enum(["NEW", "LEARNING", "FAMILIAR", "MASTERED"]);

export const sessionIdSchema = z
  .string()
  .min(1)
  .describe(
    "The id of the learner's language session (their enrollment in one language), from listSessions. If " +
      "the learner studies several languages, ask which one they mean rather than guessing.",
  );
