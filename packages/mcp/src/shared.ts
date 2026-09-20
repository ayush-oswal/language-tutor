import { z } from "zod";

export const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export const wordStatusSchema = z.enum(["NEW", "LEARNING", "FAMILIAR", "MASTERED"]);
export const revisionExerciseTypeSchema = z.enum(["MATCHING", "MULTIPLE_CHOICE", "TRANSLATION", "FILL_BLANK"]);
