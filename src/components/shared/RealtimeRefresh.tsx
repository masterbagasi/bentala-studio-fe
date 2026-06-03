"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Public content tables whose changes should live-refresh the open page.
// bsi_leads and the analytics tables are intentionally excluded (they are
// high-frequency, visitor-driven, and not rendered on public pages).
const CONTENT_TABLES = [
  "bsi_about",
  "bsi_abroad_production",
  "bsi_abroad_services",
  "bsi_abroad_settings",
  "bsi_collaborations",
  "bsi_hero",
  "bsi_news_feed",
  "bsi_portfolio",
  "bsi_seo",
  "bsi_services",
  "bsi_social_links",
  "bsi_team",
  "bsi_team_gallery",
];

/**
 * Live-refresh the current public page the moment an admin edit lands in
 * Supabase — no manual reload.
 *
 * Subscribes to Postgres changes on the content tables via Supabase
 * Realtime. On any insert/update/delete it calls `router.refresh()`, which
 * re-runs the (force-dynamic) server components and reconciles the open page
 * with fresh data. Debounced so a multi-statement save fires one refresh.
 *
 * Requires the content tables to be in the `supabase_realtime` publication.
 * If Realtime is unavailable this is a no-op — pages are force-dynamic, so a
 * normal reload still shows the latest content. Pure enhancement, no risk.
 */
export default function RealtimeRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!supabase) return;
    // Local non-null handle so the cleanup closure keeps the narrowing.
    const client = supabase;

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };

    const channel = client.channel("public-content-live");
    for (const table of CONTENT_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      );
    }
    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      client.removeChannel(channel);
    };
  }, [router]);

  return null;
}
