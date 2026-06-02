-- Migration: add admin-editable copy for the "Our Story" section
-- on the About page (eyebrow + headline + pull-quote paragraph).
-- The renderer supports a tiny markdown subset:
--   **word** → cyan accent (heading) / bold white (paragraph)
--   *word*   → italic-serif accent
--   \n       → line break (heading)
-- Idempotent.
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS story_eyebrow TEXT,
  ADD COLUMN IF NOT EXISTS story_heading TEXT,
  ADD COLUMN IF NOT EXISTS story_paragraph TEXT;
