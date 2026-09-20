import { prisma, type User } from "@lt/db";
import { NotFoundError } from "../errors.js";

export async function getOrCreateUserByClerkId(clerkUserId: string, email?: string | null): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { clerkUserId } });
  if (existing) {
    // Backfills rows created before email capture was added, or if Clerk's
    // primary email changes later — self-healing rather than a one-off migration.
    if (!existing.email && email) {
      return prisma.user.update({ where: { id: existing.id }, data: { email } });
    }
    return existing;
  }
  return prisma.user.create({ data: { clerkUserId, email: email ?? undefined } });
}

export async function requireUser(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User", userId);
  return user;
}
