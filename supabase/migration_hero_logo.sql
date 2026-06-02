-- Migration: add `logo_url` column to bsi_hero so admins can upload
-- and customise the public-site navbar logo. Idempotent.
--
-- Run this in Supabase SQL Editor, then reload the schema cache
-- (Settings → API → Reload schema) before saving from the admin.

ALTER TABLE bsi_hero
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
