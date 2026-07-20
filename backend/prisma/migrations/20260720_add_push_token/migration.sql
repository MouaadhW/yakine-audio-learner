-- Add PushToken table
CREATE TABLE IF NOT EXISTS "PushToken" (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  token text UNIQUE NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  CONSTRAINT fk_user_push FOREIGN KEY ("userId") REFERENCES "User" (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "PushToken_userId_idx" ON "PushToken" ("userId");
