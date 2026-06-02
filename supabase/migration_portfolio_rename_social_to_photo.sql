-- Migration: consolidate portfolio category values onto a single
-- vocabulary. Editors had been splitting their "still image"
-- bucket across multiple labels ('social', 'sosmed') and we
-- standardise that to 'photo' to match the public filter pill.
--
-- Final allowed set: ('video', 'photo', 'design', 'intl').
--
-- The table carries TWO category columns:
--   • `category`   — legacy single value (TEXT)
--   • `categories` — multi-tag array (TEXT[])
--
-- Both have their own CHECK constraints, so we drop BOTH, rewrite
-- the data, then re-add the constraints with the new allow-list.
--
-- Idempotent — re-running after a successful migration is a no-op
-- because the DROP/UPDATE/ADD pattern is value-safe.

-- 1. Drop both check constraints so the UPDATE below can land
--    rows that temporarily mix old + new values.
ALTER TABLE bsi_portfolio
  DROP CONSTRAINT IF EXISTS bsi_portfolio_category_check,
  DROP CONSTRAINT IF EXISTS bsi_portfolio_categories_check;

-- 2. Backfill the legacy single-value column.
UPDATE bsi_portfolio
   SET category = 'photo'
 WHERE category IN ('social', 'sosmed');

-- 3. Backfill the array column. Each element is mapped via CASE
--    so any 'social' or 'sosmed' tag becomes 'photo', leaving
--    the rest of the array untouched.
UPDATE bsi_portfolio
   SET categories = (
     SELECT array_agg(
       CASE
         WHEN c IN ('social', 'sosmed') THEN 'photo'
         ELSE c
       END
     )
     FROM unnest(categories) AS c
   )
 WHERE categories IS NOT NULL
   AND (
     'social' = ANY(categories) OR 'sosmed' = ANY(categories)
   );

-- 4. Re-add constraints. The array constraint uses the `<@`
--    "is contained by" operator so every element of `categories`
--    must come from the allowed set.
ALTER TABLE bsi_portfolio
  ADD CONSTRAINT bsi_portfolio_category_check
    CHECK (category IN ('video', 'photo', 'design', 'intl'));

ALTER TABLE bsi_portfolio
  ADD CONSTRAINT bsi_portfolio_categories_check
    CHECK (
      categories IS NULL
      OR categories <@ ARRAY['video', 'photo', 'design', 'intl']::text[]
    );

NOTIFY pgrst, 'reload schema';
