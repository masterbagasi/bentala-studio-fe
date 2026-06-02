-- Migration: add admin-uploaded image fields for the three
-- "philosophy" rows on the About page — Vision, Mission, Edge.
-- When a URL is set, the public site renders the image in place
-- of the giant "01 / 02 / 03" numeral on that row. When null,
-- it falls back to the existing numeral aesthetic. Idempotent.
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS vision_image_url TEXT,
  ADD COLUMN IF NOT EXISTS mission_image_url TEXT,
  ADD COLUMN IF NOT EXISTS edge_image_url TEXT;
