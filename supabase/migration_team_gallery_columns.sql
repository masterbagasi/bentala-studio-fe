-- Combined migration: adds the per-photo crop ratio + focal point +
-- zoom columns to bsi_team_gallery in one shot. Safe to re-run.
--
--   display_ratio → '16:9' | '9:16' | '4:5', the public-site crop shape
--   focal_x       → 0–100, x% from photo's left edge
--   focal_y       → 0–100, y% from photo's top edge
--   zoom          → 1.0–3.0, scale factor at the focal point
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_team_gallery
  ADD COLUMN IF NOT EXISTS display_ratio TEXT    DEFAULT '16:9',
  ADD COLUMN IF NOT EXISTS focal_x       NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS focal_y       NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS zoom          NUMERIC DEFAULT 1;

NOTIFY pgrst, 'reload schema';
