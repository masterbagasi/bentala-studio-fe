-- Secondary image used in the side-by-side block on the trip's
-- detail page (under the full-width hero banner). Editorial layout:
-- image on the left, description + booking CTA on the right. Null
-- is allowed — when empty the detail page falls back to the trip's
-- main `image_url` so the layout still renders.
ALTER TABLE public.bsi_abroad_production
  ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;
