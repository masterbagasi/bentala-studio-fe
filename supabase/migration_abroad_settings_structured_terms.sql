-- Extend bsi_abroad_settings with STRUCTURED T&C data so admins can
-- edit the section's intro description plus each clause's title +
-- body individually (instead of parsing a free-form textarea on the
-- public side).
--   • terms_description : reassuring intro paragraph rendered in
--     the LEFT column of the public T&C section.
--   • terms_items       : array of { title, body } clauses rendered
--     as clickable rows in the RIGHT-column card; click expands the
--     body into a popup.
-- The legacy `terms_conditions` TEXT column stays in place so any
-- existing data keeps rendering until the admin re-saves with the
-- structured editor. Public renderer prefers `terms_items` when
-- non-empty; otherwise it falls back to parsing the legacy text.
ALTER TABLE public.bsi_abroad_settings
  ADD COLUMN IF NOT EXISTS terms_description TEXT;

ALTER TABLE public.bsi_abroad_settings
  ADD COLUMN IF NOT EXISTS terms_items JSONB NOT NULL DEFAULT '[]'::jsonb;
