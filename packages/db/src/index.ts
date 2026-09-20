import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Constructing PrismaClient eagerly requires DATABASE_URL to be set, even if
// no query is ever run — which breaks consumers (e.g. @lt/mcp) that only need
// @lt/core's types/schemas/error classes and never touch Postgres. This Proxy
// defers construction until the client is actually used.
function createLazyPrismaClient(): PrismaClient {
  let client: PrismaClient | undefined;
  function getClient(): PrismaClient {
    if (!client) {
      client = globalForPrisma.prisma ?? new PrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
      }
    }
    return client;
  }
  return new Proxy({} as PrismaClient, {
    get(_target, prop, receiver) {
      return Reflect.get(getClient() as object, prop, receiver);
    },
  });
}

export const prisma = createLazyPrismaClient();

export type PrismaClientOrTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
