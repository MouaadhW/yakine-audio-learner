-- Add PARENT role to Role enum and create ParentStudentLink table
-- WARNING: altering enums in Postgres via SQL may need careful handling depending on migration tooling.

-- Add new enum value to "Role" type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    -- If enum doesn't exist as a type, skip — Prisma will manage this in dev environment.
    RAISE NOTICE 'Role enum type not found; skipping enum alter';
  ELSE
    BEGIN
      ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PARENT';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END$$;

-- Create table ParentStudentLink
CREATE TABLE IF NOT EXISTS "ParentStudentLink" (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentId" text NOT NULL,
  "studentId" text NOT NULL,
  "inviteCode" text UNIQUE NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  CONSTRAINT fk_parent FOREIGN KEY ("parentId") REFERENCES "User" (id) ON DELETE CASCADE,
  CONSTRAINT fk_student FOREIGN KEY ("studentId") REFERENCES "User" (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParentStudentLink_parent_student_unique" ON "ParentStudentLink" ("parentId", "studentId");
CREATE INDEX IF NOT EXISTS "ParentStudentLink_studentId_idx" ON "ParentStudentLink" ("studentId");
