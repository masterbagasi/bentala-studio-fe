-- Migration: add description fields for the two "entity" cards
-- in the About story section, so admin can edit the body copy
-- (Bentala Project + Bentala Studio) without code changes.
-- Idempotent.
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS entity_1_desc TEXT,
  ADD COLUMN IF NOT EXISTS entity_2_desc TEXT;
