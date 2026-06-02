-- Abroad Production services — universal list of service categories
-- (Video Production / Photography / Event Activation / Social Content
-- by default) rendered on every /abroad-production/[slug] detail page
-- inside the "Services We Offer" section. Editing happens through the
-- admin so the studio can swap titles, descriptions, and per-service
-- preview videos/images without redeploying.
CREATE TABLE IF NOT EXISTS public.bsi_abroad_services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Order in the left sticker-deck on the public page (1 → top).
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  -- Headline shown on the card AND in the right preview panel.
  title           TEXT        NOT NULL,
  -- Short blurb under the headline. Optional — public falls back to
  -- a single-line placeholder when empty.
  description     TEXT,
  -- Supabase Storage URL of the preview asset shown in the right
  -- panel when this service is active. Optional — when null the
  -- panel renders the gradient placeholder.
  preview_url     TEXT,
  -- Whether the preview file is a clip or a still. Drives the
  -- public renderer (<video> vs <img>).
  preview_type    TEXT        NOT NULL DEFAULT 'video'
                  CHECK (preview_type IN ('video', 'image')),
  -- Optional accent override for the preview panel's radial wash and
  -- active-card border. Leave NULL to inherit the brand Bentala blue
  -- (#0B3DE7) which is the public default.
  accent_color    TEXT,
  -- Optional sticker-card background override. Leave NULL to inherit
  -- a deterministic tint from the brand palette keyed off sort_order.
  card_bg_color   TEXT,
  is_published    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bsi_abroad_services_sort_idx
  ON public.bsi_abroad_services (sort_order, created_at);

CREATE INDEX IF NOT EXISTS bsi_abroad_services_published_idx
  ON public.bsi_abroad_services (is_published);

-- Row-level security. Public read for published rows, authenticated
-- write — matches every other website content table.
ALTER TABLE public.bsi_abroad_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published abroad services"
  ON public.bsi_abroad_services FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Authenticated full access abroad services"
  ON public.bsi_abroad_services FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Seed the canonical 4 categories so admins see a working section
-- on first load. They can edit/delete these like any other row.
INSERT INTO public.bsi_abroad_services
  (title, description, preview_type, sort_order)
VALUES
  ('Video Production',
   'Full-crew cinematic shoots — from brand films to brand TVC, captured on location with international gear standards.',
   'video', 1),
  ('Photography',
   'Editorial campaign stills, product, and lifestyle photography that translate the destination into hero brand visuals.',
   'video', 2),
  ('Event Activation',
   'On-ground experiential activations — pop-ups, brand moments, and influencer takeovers staged in the host country.',
   'video', 3),
  ('Social Content',
   'Vertical reels, BTS edits, and creator deliverables shipped during the trip — built for IG, TikTok, and YouTube Shorts.',
   'video', 4)
ON CONFLICT DO NOTHING;
