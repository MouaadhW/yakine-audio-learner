-- Migration: add StoredFile table and indexes
CREATE TABLE IF NOT EXISTS "StoredFile" (
  "id" text PRIMARY KEY,
  "path" text NOT NULL UNIQUE,
  "ownerId" text,
  "ownerType" text,
  "lessonId" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "StoredFile_ownerId_idx" ON "StoredFile" ("ownerId");
CREATE INDEX IF NOT EXISTS "StoredFile_lessonId_idx" ON "StoredFile" ("lessonId");
