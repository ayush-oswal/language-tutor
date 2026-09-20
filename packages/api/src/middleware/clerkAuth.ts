import { clerkClient, clerkMiddleware, getAuth } from "@clerk/express";
import { getOrCreateUserByClerkId } from "@lt/core";
import type { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./errorHandler.js";

export const clerkAuth = clerkMiddleware();

export const resolveUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Sign-in required." });
    return;
  }
  // Session claims don't include email by default — fetch the full profile.
  const clerkUser = await clerkClient.users.getUser(userId);
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  req.user = await getOrCreateUserByClerkId(userId, email);
  next();
});
