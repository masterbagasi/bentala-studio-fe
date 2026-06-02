import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using service role key.
 * NEVER expose this to the browser bundle.
 * Only import from API route handlers (under app/api/...).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseServerConfigured = !!(supabaseUrl && serviceRoleKey);

export const supabaseServer = isSupabaseServerConfigured
  ? createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
