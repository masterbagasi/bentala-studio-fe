import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { leadSchema, LeadPayload } from "@/lib/lead-schema";
import { supabaseServer } from "@/lib/supabase-server";
import { checkRateLimit, getClientIdentifier, HONEYPOT_FIELD } from "@/lib/server-utils";

const serverSchema = leadSchema.extend({
  submitted_at: z.string().datetime(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referrer: z.string().optional(),
  user_agent: z.string().optional(),
  visitor_id: z.string().optional(),
  [HONEYPOT_FIELD]: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (typeof body?.[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].trim() !== "") {
      // Bot detected — pretend it succeeded so they don't retry.
      return NextResponse.json({ success: true });
    }

    const data = serverSchema.parse(body) as LeadPayload & { visitor_id?: string };

    const identifier = getClientIdentifier(req);
    const allowed = await checkRateLimit("leads", identifier, 3600, 5);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak permintaan. Coba lagi dalam 1 jam." },
        { status: 429 }
      );
    }

    if (!supabaseServer) {
      console.error("[leads] Supabase server client not configured");
      return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
    }

    // Existing bsi_leads schema still has contact_type & contact_value columns.
    // We keep those filled (hard-coded to whatsapp) so historical lead rows
    // remain shape-compatible with the new schema-only flow.
    const insertResult = await supabaseServer
      .from("bsi_leads")
      .insert({
        full_name: data.full_name,
        brand_name: data.brand_name,
        contact_type: "whatsapp",
        contact_value: data.whatsapp_number,
        project_type: data.project_type,
        notes: data.notes ?? "",
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        referrer: data.referrer ?? null,
        user_agent: data.user_agent ?? null,
        submitted_at: data.submitted_at,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      console.error("[leads] insert failed", insertResult.error);
      return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
    }

    if (data.visitor_id) {
      // Best-effort link visitor → lead. Failure here doesn't fail the request.
      await supabaseServer
        .from("bsi_visitors")
        .update({ is_lead: true, lead_id: insertResult.data.id })
        .eq("visitor_id", data.visitor_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.issues }, { status: 400 });
    }
    console.error("[leads] error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
