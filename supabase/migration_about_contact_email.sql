-- Migration: admin-editable contact email for the About page
-- CTA band ("Or say hello"). The email displayed there used to
-- be hard-coded to hello@bentalastudio.id; this column lets
-- editors swap it without a code deploy.
--
-- Click behaviour on the public site opens Gmail's web-compose
-- view with the address already filled in (encoded into the
-- query string), so the column also acts as the "To:" address
-- for the compose URL.
--
-- Idempotent. Run in Supabase SQL Editor, then reload the
-- schema cache (Settings → API → Reload schema) before saving
-- from the admin.

ALTER TABLE bsi_about
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

NOTIFY pgrst, 'reload schema';
