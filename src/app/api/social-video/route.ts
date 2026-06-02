import { NextResponse } from "next/server";

// Resolves the direct video/poster URL from a social-post URL so the public
// lightbox can play the raw video in a <video> tag — no surrounding platform
// UI like the "View profile" header / caption footer of Instagram's embed.
//
// Strategy:
//   1. Fetch the post's HTML (Instagram /embed/ route, TikTok oEmbed, or the
//      raw URL) with a crawler-friendly User-Agent.
//   2. Extract og:video / og:image meta tags.
//   3. Return both — the player uses og:video as <video src> and og:image as
//      poster fallback while loading.

const USER_AGENTS = [
  "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; Twitterbot/1.0)",
];

const MAX_HTML_BYTES = 1024 * 1024;

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0") return true;
  if (h.endsWith(".local") || h.endsWith(".localhost")) return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  if (/^::1$/.test(h)) return true;
  if (/^fe80:/i.test(h)) return true;
  return false;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    );
}

function extractMeta(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]*?content\\s*=\\s*["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content\\s*=\\s*["']([^"']+)["'][^>]*?(?:property|name|itemprop)\\s*=\\s*["']${escaped}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeHtmlEntities(m[1]);
  }
  return null;
}

// Instagram embeds the post JSON inside a JS string inside a <script> tag,
// which means values are double-escaped — JSON-escape inside JS-escape. So
// `https://...` ends up as `https:\\\/\\\/...` in the raw HTML. Two passes
// of JSON.parse strip both layers cleanly.
function unescapeDoubleEscaped(raw: string): string {
  try {
    const once = JSON.parse(`"${raw}"`);
    return JSON.parse(`"${once}"`);
  } catch {
    // Fall back to single-pass for single-escaped values.
    return raw.replace(/\\\//g, "/").replace(/\\u0026/g, "&");
  }
}

function extractInstagramJsonValue(
  html: string,
  key: string,
): string | null {
  // Match the double-escaped form (the common case): `\"key\":\"value\"`.
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reEscaped = new RegExp(
    `\\\\"${escaped}\\\\":\\\\"([^"]+?)\\\\"`,
    "i",
  );
  let m = html.match(reEscaped);
  if (m) return unescapeDoubleEscaped(m[1]);
  // Fall back to plain JSON: `"key":"value"`.
  const rePlain = new RegExp(`"${escaped}"\\s*:\\s*"([^"]+)"`, "i");
  m = html.match(rePlain);
  if (m) return m[1].replace(/\\\//g, "/").replace(/\\u0026/g, "&");
  return null;
}

function extractInstagramVideoUrl(html: string): string | null {
  return extractInstagramJsonValue(html, "video_url");
}

function extractInstagramImageUrl(html: string): string | null {
  return (
    extractInstagramJsonValue(html, "display_url") ||
    extractInstagramJsonValue(html, "thumbnail_src")
  );
}

async function fetchHtml(target: string, ua: string): Promise<string | null> {
  try {
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": ua,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok || !upstream.body) return null;
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let html = "";
    let total = 0;
    while (total < MAX_HTML_BYTES) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
    try {
      await reader.cancel();
    } catch {
      // closing early is fine
    }
    return html;
  } catch {
    return null;
  }
}

// Rewrite Instagram post URLs to their /embed/ counterpart — that route
// returns a simpler HTML page with og tags and inline JSON containing the
// direct video URL, instead of the login-walled main feed page.
function instagramEmbedUrl(url: URL): string | null {
  if (!/(^|\.)(instagram\.com|instagr\.am)$/.test(url.hostname)) return null;
  const m = url.pathname.match(/\/(p|reel|reels|tv)\/([^/]+)/);
  if (!m) return null;
  const kind = m[1] === "reels" ? "reel" : m[1];
  return `https://www.instagram.com/${kind}/${m[2]}/embed/captioned/`;
}

interface VideoResolveResult {
  video_url: string | null;
  poster_url: string | null;
  source: string;
}

async function resolveFromHtml(
  fetchTarget: string,
  base: URL,
): Promise<VideoResolveResult | null> {
  for (const ua of USER_AGENTS) {
    const html = await fetchHtml(fetchTarget, ua);
    if (!html) continue;
    const videoRaw =
      extractMeta(html, "og:video:secure_url") ||
      extractMeta(html, "og:video:url") ||
      extractMeta(html, "og:video") ||
      extractMeta(html, "twitter:player:stream") ||
      extractInstagramVideoUrl(html);
    const imageRaw =
      extractMeta(html, "og:image:secure_url") ||
      extractMeta(html, "og:image") ||
      extractMeta(html, "twitter:image") ||
      extractInstagramImageUrl(html);
    if (videoRaw || imageRaw) {
      return {
        video_url: videoRaw ? toAbsolute(videoRaw, base) : null,
        poster_url: imageRaw ? toAbsolute(imageRaw, base) : null,
        source: ua.split(" ")[0],
      };
    }
  }
  return null;
}

function toAbsolute(u: string, base: URL): string | null {
  try {
    return new URL(u, base).toString();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json(
      { error: "protocol not allowed" },
      { status: 400 },
    );
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "host blocked" }, { status: 403 });
  }

  // Instagram: prefer the /embed/ route which is more scraper-friendly.
  const ig = instagramEmbedUrl(parsed);
  if (ig) {
    const result = await resolveFromHtml(ig, new URL(ig));
    if (result?.video_url || result?.poster_url) {
      return jsonOk(result);
    }
  }

  // Default: try the URL itself with rotating crawler UAs.
  const generic = await resolveFromHtml(parsed.toString(), parsed);
  if (generic?.video_url || generic?.poster_url) {
    return jsonOk(generic);
  }

  return NextResponse.json(
    {
      video_url: null,
      poster_url: null,
      error: "no video/poster found",
    },
    { status: 200 },
  );
}

function jsonOk(result: VideoResolveResult) {
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
    },
  });
}
