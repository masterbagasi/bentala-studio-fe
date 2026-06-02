-- Migration: add admin-uploaded image carousel for the About
-- "Our Story" section. A simple JSONB array of image URLs lets
-- admin add/reorder/remove an arbitrary number of posters
-- without a separate join table. The public site renders this
-- as an auto-scrolling marquee row between the caption and the
-- entity cards. Idempotent.
--
-- Run in Supabase SQL Editor, then reload schema cache via
-- Settings → API → Reload schema before saving from the admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS story_carousel_images JSONB NOT NULL DEFAULT '[]'::jsonb;
