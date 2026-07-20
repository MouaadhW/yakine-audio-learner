-- Migration: add traceId to AudioGenerationJob
ALTER TABLE "AudioGenerationJob" ADD COLUMN IF NOT EXISTS "traceId" text;
CREATE INDEX IF NOT EXISTS "AudioGenerationJob_traceId_idx" ON "AudioGenerationJob" ("traceId");
