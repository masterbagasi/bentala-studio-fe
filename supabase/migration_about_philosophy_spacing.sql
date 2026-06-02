-- Migration: admin-editable line-height for each Vision/Mission/
-- Edge description paragraph on the About page. Stored as
-- NUMERIC (unitless CSS line-height multiplier).
--
--   vision_text_line_height  → CSS line-height for Vision description (e.g. 1.55)
--   mission_text_line_height → same for Mission
--   edge_text_line_height    → same for Edge
--
-- Idempotent. Drops the earlier *_padding_y columns (replaced by
-- line-height) — they grew the row instead of the text breathing
-- room which is what was actually wanted.
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_about
  DROP COLUMN IF EXISTS vision_text_padding_y,
  DROP COLUMN IF EXISTS mission_text_padding_y,
  DROP COLUMN IF EXISTS edge_text_padding_y,
  ADD COLUMN IF NOT EXISTS vision_text_line_height  NUMERIC DEFAULT 1.55,
  ADD COLUMN IF NOT EXISTS mission_text_line_height NUMERIC DEFAULT 1.55,
  ADD COLUMN IF NOT EXISTS edge_text_line_height    NUMERIC DEFAULT 1.55;

NOTIFY pgrst, 'reload schema';
