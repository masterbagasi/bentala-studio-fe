-- Migration: hero photo strip rendered between the editorial hero
-- ("Born in Indonesia") and the rest of the About page. Stored as
-- a plain text array on bsi_about so editors don't need a separate
-- table — just upload URLs in order.
--
-- Idempotent. Run in Supabase SQL Editor, then reload schema
-- cache (Settings → API → Reload schema).

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS hero_grid_image_urls TEXT[] DEFAULT '{}'::TEXT[];

NOTIFY pgrst, 'reload schema';
