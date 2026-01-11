-- Add collaborator demand count columns to clients table
-- These store the COUNT of demands per collaborator (from import data)
-- NOT to be confused with collaborator selection flags (manual interaction)

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS demands_celine integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS demands_gabi integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS demands_darley integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS demands_vanessa integer NOT NULL DEFAULT 0;