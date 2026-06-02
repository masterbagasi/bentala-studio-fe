-- Add the optional `return_date` column so trips can display a full
-- date range (e.g. "12 – 15 Jun 2026") on the admin card and the
-- public detail page. Null is allowed — single-day trips simply
-- leave the column empty and render the departure date alone.
ALTER TABLE public.bsi_abroad_production
  ADD COLUMN IF NOT EXISTS return_date DATE;
