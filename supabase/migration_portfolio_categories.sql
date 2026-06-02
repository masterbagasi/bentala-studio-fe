-- Migration: add `categories` array column to bsi_portfolio.
-- Run this against existing databases that were created with the
-- single-`category` schema. Idempotent — safe to run multiple times.

-- 1) Add the column with a permissive default so the ADD doesn't fail
--    on existing rows.
ALTER TABLE bsi_portfolio
  ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';

-- 2) Backfill: copy each row's `category` into `categories` so the
--    array starts pointing at the same single tab the row used to.
--    Skip rows that already have a non-empty array (re-runs).
UPDATE bsi_portfolio
SET categories = ARRAY[category]
WHERE cardinality(categories) = 0;

-- 3) Now that every row has at least one category, lock the
--    constraints in. `<@` checks the array is a subset of the
--    allowed vocabulary.
ALTER TABLE bsi_portfolio
  DROP CONSTRAINT IF EXISTS bsi_portfolio_categories_check;

ALTER TABLE bsi_portfolio
  ADD CONSTRAINT bsi_portfolio_categories_check
    CHECK (cardinality(categories) >= 1
      AND categories <@ ARRAY['video','social','design','intl']::TEXT[]);
