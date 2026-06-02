-- Migration: new bsi_team_gallery table for the "The People"
-- bento grid on the About page. Each row is one photo tile;
-- public renderer maps the first 9 published rows to the
-- bento layout slots (the rest are ignored), so admin can swap
-- which photos appear without touching code.
--
-- Idempotent. Run in Supabase SQL Editor, then reload schema cache
-- (Settings → API → Reload schema) before saving from the admin.

CREATE TABLE IF NOT EXISTS bsi_team_gallery (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url    TEXT NOT NULL,
  caption      TEXT NOT NULL DEFAULT '',
  alt_text     TEXT NOT NULL DEFAULT '',
  sort_order   INT  NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bsi_team_gallery_sort_idx
  ON bsi_team_gallery (sort_order);

ALTER TABLE bsi_team_gallery ENABLE ROW LEVEL SECURITY;

-- Public can read published rows
DROP POLICY IF EXISTS bsi_team_gallery_read ON bsi_team_gallery;
CREATE POLICY bsi_team_gallery_read ON bsi_team_gallery
  FOR SELECT
  USING (is_published = TRUE);

-- Authenticated users have full CRUD (admin)
DROP POLICY IF EXISTS bsi_team_gallery_write ON bsi_team_gallery;
CREATE POLICY bsi_team_gallery_write ON bsi_team_gallery
  FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);
