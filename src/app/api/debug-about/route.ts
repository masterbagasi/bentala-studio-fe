import { NextResponse } from "next/server";
import { createElement } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// TEMP DEBUG ROUTE — reproduces the About page's server render in the
// Vercel serverless runtime and reports exactly which step throws, with
// the real error message + stack (Next.js redacts these on the public
// 500 page). Delete once the dynamic-render 500 is fixed.
export const dynamic = "force-dynamic";

function cap(e: unknown) {
  const err = e as { message?: string; stack?: string; name?: string };
  return {
    name: err?.name ?? null,
    message: err?.message ?? String(e),
    stack: (err?.stack ?? "").split("\n").slice(0, 8).join("\n"),
  };
}

export async function GET() {
  const out: Record<string, unknown> = {};

  // 1) Fetch the about data (same queries as the page).
  let data: Record<string, unknown> = {};
  try {
    if (!isSupabaseConfigured || !supabase) {
      out.fetch = "supabase not configured";
    } else {
      const [aboutRes, teamRes, servicesRes, heroRes, galleryRes] = await Promise.all([
        supabase.from("bsi_about").select("*").single(),
        supabase.from("bsi_team").select("*").eq("is_published", true).order("sort_order"),
        supabase.from("bsi_services").select("*").eq("is_published", true).order("sort_order"),
        supabase.from("bsi_hero").select("lead_whatsapp_number").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("bsi_team_gallery").select("*").eq("is_published", true).order("sort_order"),
      ]);
      data = {
        about: aboutRes.data,
        team: teamRes.data,
        services: servicesRes.data,
        heroLead: heroRes.data,
        gallery: galleryRes.data,
      };
      out.fetch = "ok";
      out.aboutErr = aboutRes.error?.message ?? null;
    }
  } catch (e) {
    out.fetch = cap(e);
    return NextResponse.json(out, { status: 200 });
  }

  // 2) Render each child component in isolation; report the first throw.
  const about = (data.about as Record<string, unknown>) ?? {};
  const components: Array<[string, () => Promise<unknown>]> = [
    ["StorySection", async () => (await import("@/components/about/StorySection")).default],
    ["ValuesGrid", async () => (await import("@/components/about/ValuesGrid")).default],
    ["TeamGallery", async () => (await import("@/components/about/TeamGallery")).default],
    ["CtaBand", async () => (await import("@/components/about/CtaBand")).default],
  ];

  const propsByName: Record<string, Record<string, unknown>> = {
    StorySection: { about },
    ValuesGrid: { values: about.values, title: about.principles_title },
    TeamGallery: { photos: data.gallery },
    CtaBand: { services: data.services, ctaTitle: about.cta_title, heroLead: data.heroLead },
  };

  // Dynamic import to dodge Next's static "no react-dom/server in app" rule.
  const { renderToStaticMarkup } = (await import("react-dom/server")) as {
    renderToStaticMarkup: (el: unknown) => string;
  };

  const renders: Record<string, unknown> = {};
  for (const [name, load] of components) {
    try {
      const Comp = (await load()) as React.ComponentType<Record<string, unknown>>;
      renderToStaticMarkup(createElement(Comp, propsByName[name]) as unknown);
      renders[name] = "rendered ok";
    } catch (e) {
      renders[name] = cap(e);
    }
  }
  out.renders = renders;

  return NextResponse.json(out, { status: 200 });
}
