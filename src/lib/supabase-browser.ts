import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseBrowserConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabaseBrowser = isSupabaseBrowserConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
