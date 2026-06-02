const VISITOR_COOKIE = "bsi_vid";
const SESSION_KEY = "bsi_sid";
const SESSION_TIMESTAMP_KEY = "bsi_sid_ts";
const SESSION_LANDING_KEY = "bsi_sid_landing";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const TRACK_ENDPOINT = "/api/track";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getOrCreateVisitorId(): string {
  const existing = readCookie(VISITOR_COOKIE);
  if (existing) return existing;
  const fresh = uuid();
  writeCookie(VISITOR_COOKIE, fresh);
  return fresh;
}

function getOrCreateSessionId(): { sessionId: string; landingPath: string; isNew: boolean } {
  if (typeof window === "undefined") {
    return { sessionId: uuid(), landingPath: "/", isNew: true };
  }

  const stored = sessionStorage.getItem(SESSION_KEY);
  const ts = Number(sessionStorage.getItem(SESSION_TIMESTAMP_KEY) || 0);
  const landing = sessionStorage.getItem(SESSION_LANDING_KEY);
  const fresh = !stored || !landing || Date.now() - ts > SESSION_TIMEOUT_MS;

  if (fresh) {
    const sessionId = uuid();
    const landingPath = window.location.pathname + window.location.search;
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(Date.now()));
    sessionStorage.setItem(SESSION_LANDING_KEY, landingPath);
    return { sessionId, landingPath, isNew: true };
  }

  sessionStorage.setItem(SESSION_TIMESTAMP_KEY, String(Date.now()));
  return { sessionId: stored!, landingPath: landing!, isNew: false };
}

function detectDevice(): { device_type: string; os: string; browser: string } {
  if (typeof navigator === "undefined") return { device_type: "unknown", os: "unknown", browser: "unknown" };
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android|iPhone/i.test(ua);
  const tablet = /iPad|Tablet/i.test(ua);
  const device_type = tablet ? "tablet" : mobile ? "mobile" : "desktop";

  let os = "unknown";
  if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  let browser = "unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";

  return { device_type, os, browser };
}

function readUTM() {
  if (typeof window === "undefined") return { utm_source: null, utm_medium: null, utm_campaign: null };
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}

async function send(payload: Record<string, unknown>): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    // keepalive lets the request finish even if the user navigates away
    await fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Tracker must never break the site
  }
}

let visitorInitialized = false;

async function ensureVisitor(): Promise<string> {
  const visitor_id = getOrCreateVisitorId();
  if (visitorInitialized) return visitor_id;
  visitorInitialized = true;

  const dev = detectDevice();
  await send({
    kind: "visitor",
    visitor_id,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    device_type: dev.device_type,
    os: dev.os,
    browser: dev.browser,
  });

  return visitor_id;
}

export async function trackPageview(path: string, title?: string): Promise<void> {
  if (typeof window === "undefined") return;
  const visitor_id = await ensureVisitor();
  const { sessionId, landingPath } = getOrCreateSessionId();
  const utm = readUTM();
  const referrer = document.referrer || null;

  await send({
    kind: "pageview",
    visitor_id,
    session_id: sessionId,
    path,
    title: title ?? document.title,
    referrer,
    landing_path: landingPath,
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
  });
}

export async function trackEvent(
  eventType: string,
  target?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (typeof window === "undefined") return;
  const visitor_id = await ensureVisitor();
  const { sessionId } = getOrCreateSessionId();

  await send({
    kind: "event",
    visitor_id,
    session_id: sessionId,
    event_type: eventType,
    target: target ?? null,
    path: window.location.pathname,
    metadata: metadata ?? {},
  });
}

export function getCurrentVisitorId(): string | null {
  return readCookie(VISITOR_COOKIE);
}

export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}
