-- Migration: optional MOBILE hero banner for the About page. When
-- set, the public hero renders this image on phone-width viewports
-- (where the wide desktop banner would otherwise get its sides
-- cropped by object-cover). When null, mobile falls back to the
-- existing desktop banner (hero_banner_image_url).
--
-- Idempotent. Run in Supabase SQL Editor, then reload schema
-- cache (Settings → API → Reload schema).

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS hero_banner_image_url_mobile TEXT;

NOTIFY pgrst, 'reload schema';
