import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { checkRateLimit, getClientIdentifier } from "@/lib/server-utils";

const visitorPayload = z.object({
  kind: z.literal("visitor"),
  visitor_id: z.string().uuid(),
  user_agent: z.string().max(500).nullable(),
  device_type: z.string().max(20).nullable(),
  os: z.string().max(40).nullable(),
  browser: z.string().max(40).nullable(),
});

const pageviewPayload = z.object({
  kind: z.literal("pageview"),
  visitor_id: z.string().uuid(),
  session_id: z.string().uuid(),
  path: z.string().max(2000),
  title: z.string().max(500).nullable(),
  referrer: z.string().max(2000).nullable(),
  landing_path: z.string().max(2000),
  utm_source: z.string().max(200).nullable(),
  utm_medium: z.string().max(200).nullable(),
  utm_campaign: z.string().max(200).nullable(),
});

const eventPayload = z.object({
  kind: z.literal("event"),
  visitor_id: z.string().uuid(),
  session_id: z.string().uuid(),
  event_type: z.string().max(50),
  target: z.string().max(200).nullable(),
  path: z.string().max(2000).nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const payloadSchema = z.discriminatedUnion("kind", [visitorPayload, pageviewPayload, eventPayload]);

export async function POST(req: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const identifier = getClientIdentifier(req);

  // 60 tracking events per minute per IP — generous for legit users, blocks bots.
  const allowed = await checkRateLimit("track", identifier, 60, 60);
  if (!allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const data = parsed.data;

  try {
    if (data.kind === "visitor") {
      await supabaseServer.rpc("bsi_track_visitor", {
        p_visitor_id: data.visitor_id,
        p_user_agent: data.user_agent,
        p_device_type: data.device_type,
        p_os: data.os,
        p_browser: data.browser,
      });
    } else if (data.kind === "pageview") {
      await supabaseServer.rpc("bsi_track_pageview", {
        p_visitor_id: data.visitor_id,
        p_session_id: data.session_id,
        p_path: data.path,
        p_title: data.title,
        p_referrer: data.referrer,
        p_landing_path: data.landing_path,
        p_utm_source: data.utm_source,
        p_utm_medium: data.utm_medium,
        p_utm_campaign: data.utm_campaign,
      });
    } else {
      await supabaseServer.rpc("bsi_track_event", {
        p_visitor_id: data.visitor_id,
        p_session_id: data.session_id,
        p_event_type: data.event_type,
        p_target: data.target,
        p_path: data.path,
        p_metadata: data.metadata ?? {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track] failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
