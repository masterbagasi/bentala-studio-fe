import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BackToTop from "@/components/layout/BackToTop";
import AnalyticsTracker from "@/components/shared/AnalyticsTracker";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Bentala Studio Indonesia — Create Stories Beyond Borders",
  description:
    "Indonesia's creative agency producing cinematic content from around the world. Video production, social media, KOL campaigns, and brand design.",
};

interface NavSettings {
  logoUrl: string | null;
  hideHome: boolean;
  hideAbout: boolean;
  hideNews: boolean;
}

// Fetch the navbar settings server-side once per request — logo URL
// plus per-route visibility toggles. Cached alongside page-level
// revalidate windows so we don't burn a Supabase round-trip on every
// navigation. Falls back to all-visible defaults when Supabase isn't
// configured or the row doesn't exist yet.
async function getNavSettings(): Promise<NavSettings> {
  const fallback: NavSettings = {
    logoUrl: null,
    hideHome: false,
    hideAbout: false,
    hideNews: false,
  };
  if (!isSupabaseConfigured || !supabase) return fallback;
  try {
    const { data } = await supabase
      .from("bsi_hero")
      .select("logo_url, nav_home_hidden, nav_about_hidden, nav_news_hidden")
      .eq("is_active", true)
      .single();
    return {
      logoUrl: (data?.logo_url as string | null | undefined) ?? null,
      hideHome: Boolean(data?.nav_home_hidden),
      hideAbout: Boolean(data?.nav_about_hidden),
      hideNews: Boolean(data?.nav_news_hidden),
    };
  } catch {
    return fallback;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { logoUrl, hideHome, hideAbout, hideNews } = await getNavSettings();

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.cdnfonts.com/css/open-sauce-sans"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-white font-sans overflow-x-hidden">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <Navbar
          logoUrl={logoUrl}
          hideHome={hideHome}
          hideAbout={hideAbout}
          hideNews={hideNews}
        />
        <main>{children}</main>
        <BackToTop />
      </body>
    </html>
  );
}
