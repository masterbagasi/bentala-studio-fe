-- Migration: add admin-uploadable video for the About "Our Story"
-- section. The video is rendered at full viewport width with a
-- 16:9 aspect ratio between the caption paragraph and the entity
-- cards (Bentala Project / Bentala Studio). When null, the
-- section flows straight from caption to entity cards as before.
-- Idempotent.
--
-- Run in Supabase SQL Editor, then reload the schema cache before
-- saving from the admin (Settings → API → Reload schema).

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS story_video_url TEXT;
