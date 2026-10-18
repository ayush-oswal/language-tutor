-- AlterTable: add as nullable, backfill existing exercises from their session's current level, then require it.
ALTER TABLE "Exercise" ADD COLUMN "level" "CEFRLevel";

UPDATE "Exercise" e
SET "level" = s."currentLevel"
FROM "LanguageSession" s
WHERE e."languageSessionId" = s."id";

ALTER TABLE "Exercise" ALTER COLUMN "level" SET NOT NULL;
