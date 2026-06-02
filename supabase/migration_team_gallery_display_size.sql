-- Migration: per-photo focal point + zoom for the About-page
-- team gallery bento. Editors can drag the focal marker on the
-- admin preview to pick which part of the photo gets centered
-- when the public bento crops it via object-cover, and use a
-- zoom slider (1.0×–3.0×) to magnify the framing.
--
--   focal_x → 0–100, x% from photo's left edge
--   focal_y → 0–100, y% from photo's top edge
--   zoom    → 1.0–3.0, scale factor at the focal point
--
-- Drops the earlier `display_size` column from the same edit-
-- session — user clarified they wanted drag-to-frame, not a
-- per-photo bento slot override.
--
-- Idempotent. Defaults match the previous behaviour
-- (focal centred at 50/50, zoom 1.0).
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_team_gallery
  DROP COLUMN IF EXISTS display_size,
  ADD COLUMN IF NOT EXISTS focal_x NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS focal_y NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS zoom    NUMERIC DEFAULT 1;

NOTIFY pgrst, 'reload schema';
