-- =============================================================================
-- On-demand public-site revalidation via database triggers
-- =============================================================================
-- Purpose: whenever public content changes in any bsi_* table, ping the public
-- site's revalidation endpoint (POST https://bentalaproject.com/api/revalidate)
-- so Next.js (Vercel ISR) refreshes the affected pages immediately, instead of
-- waiting out the per-page time-based `revalidate` window.
--
-- Chain: write to bsi_* -> AFTER STATEMENT trigger -> bsi_revalidate_public()
--        -> net.http_post (pg_net, async) -> /api/revalidate -> revalidatePath.
--
-- The shared secret is NOT stored here. It lives in Supabase Vault under the
-- name 'revalidate_secret' and must match REVALIDATE_SECRET in the public
-- site's Vercel env. Add it via Dashboard -> Integrations -> Vault:
--     Name:   revalidate_secret
--     Secret: <same value as Vercel REVALIDATE_SECRET>
--
-- bsi_leads is intentionally EXCLUDED: it stores visitor form submissions
-- (high-frequency, not rendered on public pages).
-- =============================================================================

-- pg_net provides async HTTP from Postgres; its failures never roll back the
-- originating write.
create extension if not exists pg_net;

-- Trigger function. SECURITY DEFINER so it can read Vault + call net.* regardless
-- of the writing role. EXECUTE is revoked from app roles below; trigger
-- execution does not require the EXECUTE privilege, so triggers still fire.
create or replace function public.bsi_revalidate_public()
returns trigger
language plpgsql
security definer
set search_path = public, net, vault, extensions
as $func$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'revalidate_secret'
  limit 1;

  -- No secret configured yet -> skip silently so the write still succeeds.
  if v_secret is null or v_secret = '' then
    return null;
  end if;

  perform net.http_post(
    url := 'https://bentalaproject.com/api/revalidate',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-revalidate-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );
  return null;
end;
$func$;

-- Not meant to be called directly (it is a trigger function). Keep it off the
-- PostgREST RPC surface for anon/authenticated.
revoke execute on function public.bsi_revalidate_public() from anon, authenticated, public;

-- Attach an AFTER INSERT/UPDATE/DELETE statement-level trigger to every
-- public-content table.
do $do$
declare
  t text;
  content_tables text[] := array[
    'bsi_about','bsi_abroad_production','bsi_abroad_services',
    'bsi_abroad_settings','bsi_collaborations','bsi_hero',
    'bsi_news_feed','bsi_portfolio','bsi_seo','bsi_services',
    'bsi_social_links','bsi_team','bsi_team_gallery'
  ];
begin
  foreach t in array content_tables loop
    execute format('drop trigger if exists trg_revalidate_public on public.%I', t);
    execute format(
      'create trigger trg_revalidate_public after insert or update or delete on public.%I for each statement execute function public.bsi_revalidate_public()',
      t
    );
  end loop;
end $do$;
