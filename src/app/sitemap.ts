import type { MetadataRoute } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/** Canonical production origin. Every sitemap URL is built from this. */
const BASE_URL = "https://bentalaproject.com";

// Refresh the generated sitemap hourly so newly-published abroad trips
// surface to crawlers without a full redeploy — mirrors the short
// revalidate windows used on the content pages themselves.
export const revalidate = 3600;

/**
 * Derive the public slug for an abroad-production trip the same way the
 * `[slug]` route resolves it: prefer the explicit `slug` column, and
 * fall back to a country-derived slug for legacy rows saved before the
 * column existed (or with a blank slug).
 */
function tripSlug(row: { slug: string | null; country: string | null }): string | null {
  const explicit = row.slug?.trim();
  if (explicit) return explicit;
  const country = row.country?.trim();
  if (!country) return null;
  return country.toLowerCase().replace(/\s+/g, "-");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static, always-present routes.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/news`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Dynamic abroad-production detail pages — only published trips.
  let tripRoutes: MetadataRoute.Sitemap = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from("bsi_abroad_production")
        .select("slug, country, updated_at")
        .eq("is_published", true)
        .order("updated_at", { ascending: false });

      tripRoutes = (data ?? [])
        .map((row) => {
          const slug = tripSlug(row as { slug: string | null; country: string | null });
          if (!slug) return null;
          return {
            url: `${BASE_URL}/abroad-production/${slug}`,
            lastModified: row.updated_at ? new Date(row.updated_at as string) : now,
            changeFrequency: "monthly" as const,
            priority: 0.7,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    } catch (err) {
      // Never let a Supabase hiccup break the sitemap — fall back to the
      // static routes so crawlers still get a valid document.
      console.error("[sitemap] Failed to fetch abroad-production slugs:", err);
    }
  }

  return [...staticRoutes, ...tripRoutes];
}
