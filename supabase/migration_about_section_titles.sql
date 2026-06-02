-- Migration: admin-editable section headlines for the About page.
--   • principles_title — heading above the Six Principles grid
--   • cta_title        — large headline inside the CTA band
--
-- Both columns accept a markdown-lite syntax the public renderer
-- understands:
--   *word*    → italic-serif blue accent
--   **word**  → outline-stroke blue accent
--   \n        → line break
--
-- Defaults are left NULL — the public site falls back to bundled
-- copy when the column is null/empty so this migration is safe to
-- ship before any admin edit.
--
-- Idempotent. Run in Supabase SQL Editor, then reload the schema
-- cache (Settings → API → Reload schema) before saving from the
-- admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS principles_title TEXT,
  ADD COLUMN IF NOT EXISTS cta_title TEXT;

NOTIFY pgrst, 'reload schema';
