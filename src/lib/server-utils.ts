import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { supabaseServer } from "./supabase-server";

/**
 * Get a stable, hashed identifier for the request's IP address.
 * Falls back to user-agent hash if IP is not available.
 * Hashing avoids storing raw PII in the rate-limit table.
 */
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0].trim() || realIp || "unknown";
  const ua = req.headers.get("user-agent") || "";
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

/**
 * Returns true if the request is allowed, false if it has exceeded the limit.
 * Bucket distinguishes different rate-limit categories (e.g. 'leads' vs 'track').
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  windowSeconds: number,
  maxCount: number
): Promise<boolean> {
  if (!supabaseServer) {
    // If Supabase isn't configured, allow the request through.
    // The caller is expected to validate other constraints.
    return true;
  }
  const { data, error } = await supabaseServer.rpc("bsi_rate_limit_check", {
    p_bucket: bucket,
    p_identifier: identifier,
    p_window_seconds: windowSeconds,
    p_max_count: maxCount,
  });

  if (error) {
    console.error("[rate-limit]", bucket, error.message);
    // Fail open — don't block legit traffic if our own infra has a hiccup.
    return true;
  }
  return data === true;
}

/**
 * Honeypot field name. Real users never fill this; bots filling every input
 * will. Submissions with this field non-empty are silently rejected.
 */
export const HONEYPOT_FIELD = "website_url_extra";
