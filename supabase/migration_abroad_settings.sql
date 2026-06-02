-- Abroad Production global settings — a singleton row that holds
-- the UNIVERSAL terms & conditions applied to every /abroad-production
-- /[slug] detail page. Moved out of `bsi_abroad_production` (where it
-- was a per-trip column) so the studio can update copy once and have
-- it reflect on every trip without re-editing each row.
CREATE TABLE IF NOT EXISTS public.bsi_abroad_settings (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  terms_conditions TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Singleton — only id=1 is ever inserted. Any future settings
  -- columns (e.g. global meta tags) live on this same row.
  CONSTRAINT bsi_abroad_settings_singleton CHECK (id = 1)
);

-- Seed the singleton row so the admin always has a target for the
-- T&C textarea — no insert path on first load, only updates.
INSERT INTO public.bsi_abroad_settings (id, terms_conditions)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

-- RLS — public read (T&C must render on the public detail page) and
-- authenticated full access, matching every other website table.
ALTER TABLE public.bsi_abroad_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read abroad settings"
  ON public.bsi_abroad_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated full access abroad settings"
  ON public.bsi_abroad_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
