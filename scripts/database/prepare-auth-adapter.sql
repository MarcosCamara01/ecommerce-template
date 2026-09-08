-- Run with the legacy table owner while traffic is paused. This creates the
-- reversible schema compatibility required by Better Auth's admin plugin.
BEGIN;
ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS ban_expires timestamptz;
ALTER TABLE public.session
  ADD COLUMN IF NOT EXISTS impersonated_by text;
COMMIT;
