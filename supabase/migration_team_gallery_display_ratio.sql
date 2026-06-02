-- Migration: per-photo display ratio for "The People" gallery.
-- Editors clarified they want a FIXED set of 3 ratios so the
-- public grid is predictable and uploads target a known shape.
-- Instead of the dynamic bento packer, every photo carries the
-- ratio it should render at — admin picks one of:
--
--   '16:9'  → landscape (1920×1080 / 1600×900 / etc)
--   '9:16'  → portrait  (1080×1920)
--   '4:5'   → portrait  (1080×1350, Instagram-style)
--
-- Default '16:9' so existing rows continue to render without
-- needing manual review.
--
-- Idempotent. Run in Supabase SQL Editor, then reload schema
-- cache (Settings → API → Reload schema).

ALTER TABLE bsi_team_gallery
  ADD COLUMN IF NOT EXISTS display_ratio TEXT DEFAULT '16:9';

NOTIFY pgrst, 'reload schema';
