-- Detail-page enrichment:
--   * locations         — JSONB array of { name, image_url, description? }
--                         entries. Rendered as a "Destinations We'll
--                         Visit" gallery on the trip's detail page so
--                         visitors can see the spots covered during
--                         the production trip.
--   * terms_conditions  — Free-form text block (line breaks preserved
--                         on the public site). Used for the trip's
--                         Syarat & Ketentuan / T&C section.
ALTER TABLE public.bsi_abroad_production
  ADD COLUMN IF NOT EXISTS locations        JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
