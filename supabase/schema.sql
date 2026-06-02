-- ============================================
-- Bentala Studio Indonesia — Database Schema
-- ============================================

-- Hero Section
CREATE TABLE IF NOT EXISTS bsi_hero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  cta_text TEXT NOT NULL DEFAULT 'Start Collaboration',
  cta_url TEXT NOT NULL,
  video_urls TEXT[] NOT NULL DEFAULT '{}',
  poster_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portfolio
-- bsi_hero is treated as a single-row settings table; the logo
-- column lives here alongside other global brand assets.
ALTER TABLE bsi_hero ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE TABLE IF NOT EXISTS bsi_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  -- Legacy single-category column. Kept in sync with categories[1]
  -- so older readers still resolve to a sensible value.
  category TEXT NOT NULL CHECK (category IN ('video','social','design','intl')),
  -- Multi-category array. An item can appear under multiple filter
  -- tabs on the public site. Values must come from the same vocabulary
  -- as `category`; the array length must be >= 1.
  categories TEXT[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(categories) >= 1
      AND categories <@ ARRAY['video','social','design','intl']::TEXT[]),
  tag TEXT NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  thumbnail_url TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '16:9',
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Collaborations
CREATE TABLE IF NOT EXISTS bsi_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  logo_svg TEXT NOT NULL,
  tint_color TEXT NOT NULL DEFAULT '#00d4ff',
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS bsi_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Social Links
CREATE TABLE IF NOT EXISTS bsi_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('ig','tiktok','whatsapp')),
  handle TEXT NOT NULL,
  url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- About (singleton)
CREATE TABLE IF NOT EXISTS bsi_about (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_title TEXT NOT NULL,
  story_body TEXT NOT NULL,
  story_cta_url TEXT NOT NULL,
  vision_text TEXT NOT NULL,
  mission_text TEXT NOT NULL,
  edge_text TEXT NOT NULL,
  stats JSONB NOT NULL DEFAULT '[]',
  "values" JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team Members
CREATE TABLE IF NOT EXISTS bsi_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role_description TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL,
  avatar_color TEXT NOT NULL DEFAULT '#1757c2',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News Feed (BPI Instagram & TikTok)
CREATE TABLE IF NOT EXISTS bsi_news_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account TEXT NOT NULL CHECK (account IN ('bpi_ig','bpi_tt')),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  thumbnail_url TEXT,
  caption TEXT NOT NULL DEFAULT '',
  permalink TEXT NOT NULL,
  like_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEO Metadata
CREATE TABLE IF NOT EXISTS bsi_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL UNIQUE,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  og_image_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_portfolio_published ON bsi_portfolio (is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON bsi_portfolio (category) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_collabs_published ON bsi_collaborations (is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_news_account ON bsi_news_feed (account, is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_seo_page ON bsi_seo (page);
