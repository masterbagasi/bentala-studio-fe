-- Migration: optional banner image for the About hero. When set,
-- the public hero renders this image full-bleed (poster style)
-- instead of the text headline + description. When null, the
-- existing text hero ("Born in Indonesia") still shows.
--
-- Idempotent. Run in Supabase SQL Editor, then reload schema
-- cache (Settings → API → Reload schema).

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS hero_banner_image_url TEXT;

NOTIFY pgrst, 'reload schema';
