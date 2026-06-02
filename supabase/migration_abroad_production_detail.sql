-- Detail-page fields for Abroad Production trips. Each banner that
-- visitors click now routes to /abroad-production/[slug] with a
-- custom headline + description, so the table grows three columns:
--   * title       — long-form headline used on the detail page
--                   (falls back to `country` when empty)
--   * description — body copy under the headline
--   * slug        — URL-safe identifier used in the route
ALTER TABLE public.bsi_abroad_production
  ADD COLUMN IF NOT EXISTS title       TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS slug        TEXT;

-- Backfill slug from country for existing rows so every trip has a
-- valid route immediately after the migration runs. Replace any
-- run of non-alphanumerics with a single dash, lowercase, strip
-- leading/trailing dashes.
UPDATE public.bsi_abroad_production
SET slug = trim(both '-' from lower(regexp_replace(country, '[^a-zA-Z0-9]+', '-', 'g')))
WHERE (slug IS NULL OR slug = '')
  AND country IS NOT NULL;

-- Slug must be unique — that's the lookup key. The unique index also
-- guards against accidental admin overwrites that would collide.
CREATE UNIQUE INDEX IF NOT EXISTS bsi_abroad_production_slug_idx
  ON public.bsi_abroad_production (slug);
