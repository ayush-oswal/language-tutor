import { CEFRLevel } from "@lt/db";
import { z } from "zod";

export const cefrLevelSchema = z.nativeEnum(CEFRLevel);

export const enrollBodySchema = z.object({
  languageId: z.string().min(1),
  level: cefrLevelSchema,
});

export const changeLevelBodySchema = z.object({
  level: cefrLevelSchema,
});
