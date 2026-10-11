import { ValidationError } from "@lt/core";
import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError("Invalid request body", result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Returns the query value if it's one of the enum's values; anything else (missing, repeated, unknown) is treated as absent. */
export function queryEnum<T extends Record<string, string>>(value: unknown, enumObject: T): T[keyof T] | undefined {
  return typeof value === "string" && (Object.values(enumObject) as string[]).includes(value)
    ? (value as T[keyof T])
    : undefined;
}
