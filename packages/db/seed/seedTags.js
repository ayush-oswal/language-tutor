// Usage: node packages/db/seed/seedTags.js
// Upserts every tag in tags.json. Safe to re-run; never deletes tags.

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://tutor:tutor@localhost:5432/language_tutor";

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

const tags = JSON.parse(readFileSync(new URL("./tags.json", import.meta.url), "utf8"));

try {
  let created = 0;
  for (const { name } of tags) {
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (!existing) {
      await prisma.tag.create({ data: { name } });
      created++;
    }
  }
  console.log(`Tags: ${created} created, ${tags.length - created} already existed (${tags.length} total).`);
} finally {
  await prisma.$disconnect();
}
