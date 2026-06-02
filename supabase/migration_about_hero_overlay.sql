-- Migration: add hero overlay image fields to bsi_about so the
-- About page editorial hero can carry an admin-placed decorative
-- image (URL) at one of six anchor positions. Idempotent.
--
-- Run in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS hero_overlay_image_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_overlay_position TEXT;

-- Lock the position vocabulary so admin can't save free-form
-- strings that the public renderer wouldn't recognise.
ALTER TABLE bsi_about
  DROP CONSTRAINT IF EXISTS bsi_about_hero_overlay_position_check;

ALTER TABLE bsi_about
  ADD CONSTRAINT bsi_about_hero_overlay_position_check
    CHECK (
      hero_overlay_position IS NULL
      OR hero_overlay_position IN (
        'top-left', 'top-right',
        'mid-left', 'mid-right',
        'bottom-left', 'bottom-right'
      )
    );
