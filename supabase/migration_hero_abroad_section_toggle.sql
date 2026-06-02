-- Section-level visibility toggle for the Abroad Production block on
-- the public home page. Lives on bsi_hero alongside the existing
-- nav_*_hidden flags so the admin's site-wide visibility settings
-- stay together in one row. When `abroad_section_hidden = TRUE` the
-- public home skips the AbroadProduction section entirely and the
-- ServicesSpotlight section moves up to fill the gap naturally.
ALTER TABLE public.bsi_hero
  ADD COLUMN IF NOT EXISTS abroad_section_hidden BOOLEAN NOT NULL DEFAULT FALSE;
