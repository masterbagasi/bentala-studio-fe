-- Migration: add entity logo fields to bsi_about so the About
-- page "entity cards" (Bentala Project + Bentala Studio) can be
-- swapped from the admin without code changes. Idempotent.
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS entity_1_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS entity_2_logo_url TEXT;
