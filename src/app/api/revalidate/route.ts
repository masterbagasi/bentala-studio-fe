import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// This endpoint mutates the cache, so it must never be cached itself.
export const dynamic = "force-dynamic";

/**
 * On-demand revalidation endpoint.
 *
 * The admin dashboard ("Bentala Internal System") calls this right
 * after saving content so the public site reflects the change
 * immediately, instead of waiting out each page's time-based
 * `revalidate` window. Without this, edits only surface after the
 * ISR window (10–3600s) AND a follow-up request — which reads as
 * "production never updates".
 *
 * Auth: a shared secret in the `REVALIDATE_SECRET` env var. Set the
 * SAME value in Vercel (Project → Settings → Environment Variables)
 * and in the admin app. Send it via the `x-revalidate-secret` header
 * or the `?secret=` query param. Fails closed (401) when the env var
 * is unset, so a misconfigured deploy can't be revalidated anonymously.
 *
 * Body (JSON, all optional):
 *   { "path": "/about" }                       → revalidate one path
 *   { "paths": ["/", "/about"] }               → revalidate several
 *   { "path": "/abroad-production/japan" }     → one detail page
 *   (empty body)                               → revalidate ALL public
 *                                                pages incl. every
 *                                                abroad-production slug
 */

// Public pages refreshed by the catch-all (empty-body) call.
const PUBLIC_PATHS = ["/", "/about", "/news"];

const bodySchema = z
  .object({
    path: z.string().min(1).max(2000).optional(),
    paths: z.array(z.string().min(1).max(2000)).max(50).optional(),
  })
  .strict();

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  // Fail closed: no secret configured → reject everything.
  if (!secret) return false;
  const provided =
    req.headers.get("x-revalidate-secret") ??
    req.nextUrl.searchParams.get("secret");
  return provided === secret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { revalidated: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  // Body is optional — tolerate an empty/missing body and fall back to
  // the "revalidate everything" path.
  let parsed: z.infer<typeof bodySchema> = {};
  try {
    const raw = await req.json();
    const result = bodySchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { revalidated: false, message: "Invalid body", issues: result.error.issues },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    // No JSON body sent — treat as the catch-all revalidate.
    parsed = {};
  }

  const explicit = parsed.path
    ? [parsed.path]
    : parsed.paths?.length
      ? parsed.paths
      : null;

  const targets = explicit ?? PUBLIC_PATHS;
  for (const p of targets) {
    revalidatePath(p);
  }

  // On the catch-all call, also refresh the whole dynamic detail route
  // so every published trip slug is regenerated in one shot. Skipped
  // when the caller asked for specific paths, so a targeted call stays
  // targeted.
  if (!explicit) {
    revalidatePath("/abroad-production/[slug]", "page");
  }

  return NextResponse.json({
    revalidated: true,
    paths: targets,
    detailRoute: !explicit ? "/abroad-production/[slug]" : undefined,
  });
}
