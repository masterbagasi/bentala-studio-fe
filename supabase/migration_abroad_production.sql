-- Abroad Production section — manages the cards that appear on the
-- public home page between Services Spotlight and the portfolio grid.
-- Each row is one upcoming trip / on-location shoot the studio is
-- taking on, surfaced to visitors with a "Booking Now" CTA.
CREATE TABLE IF NOT EXISTS public.bsi_abroad_production (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url       TEXT        NOT NULL,
  country         TEXT        NOT NULL,
  -- ISO date (YYYY-MM-DD). When the trip has a window rather than a
  -- single day, store the start date and put the window in `note`.
  departure_date  DATE        NOT NULL,
  -- Optional short label rendered above the date (e.g. "Eropa Trip
  -- 2026", "Asia Window"). Free-form so editors can tag any service.
  note            TEXT,
  -- Where the card + Booking Now button navigate. Typically a WA
  -- chat link or a Google form for booking the slot.
  service_link_url TEXT       NOT NULL,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  is_published    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bsi_abroad_production_sort_idx
  ON public.bsi_abroad_production (sort_order, departure_date);

CREATE INDEX IF NOT EXISTS bsi_abroad_production_published_idx
  ON public.bsi_abroad_production (is_published);

-- Row-level security. Public read for published rows, authenticated
-- write — matches every other website content table.
ALTER TABLE public.bsi_abroad_production ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published abroad production"
  ON public.bsi_abroad_production FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Authenticated full access abroad production"
  ON public.bsi_abroad_production FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
