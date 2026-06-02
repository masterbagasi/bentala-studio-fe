-- Adds per-route navbar visibility toggles to bsi_hero. Setting any
-- of these to TRUE hides the matching link from the public site's
-- navbar. The underlying route stays functional — only the navbar
-- list is filtered. Defaults to FALSE so existing rows keep showing
-- every link until an admin actively hides one.

ALTER TABLE bsi_hero
  ADD COLUMN IF NOT EXISTS nav_home_hidden  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nav_about_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nav_news_hidden  BOOLEAN DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
