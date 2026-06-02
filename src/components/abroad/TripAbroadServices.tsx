"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AbroadService } from "@/lib/types";

interface Service {
  number: string;
  /** Numeral shown as the giant glyph on the left of each tab.
   *  Stored separately from `number` so we can render "1" instead of
   *  "01" — the chunky single digit is the whole point of the look. */
  digit: string;
  title: string;
  description: string;
  /** Solid Bentala-blue fill for the sticker-style tab card. */
  cardBg: string;
  /** Hue used by the right-side preview panel's radial wash + active
   *  border. Defaults to brand Bentala blue. */
  accent: string;
  /** Optional uploaded reel/still rendered inside the preview panel.
   *  When null the panel renders the gradient placeholder. */
  previewUrl: string | null;
  previewType: "video" | "image";
}

// Deterministic Bentala-blue tonal palette used when an admin row
// doesn't provide its own card_bg_color override. Cycling through
// these by sort_order gives the deck a gradient feel that's clearly
// inside the brand without converging into a single flat color.
const BRAND_CARD_BG_PALETTE = ["#0828B5", "#0B3DE7", "#3F66ED", "#7393F5"];

// Single Bentala blue used as the default accent for the preview
// panel's glow. Admin can override per-row via accent_color.
const BRAND_ACCENT_FALLBACK = "#0B3DE7";

// Default services shown when the admin hasn't created any rows in
// `bsi_abroad_services` yet — keeps the public page populated on
// fresh installs and as a safety net if the table is wiped.
const DEFAULT_SERVICES: Service[] = [
  {
    number: "01",
    digit: "1",
    title: "Video Production",
    description:
      "Full-crew cinematic shoots — from brand films to brand TVC, captured on location with international gear standards.",
    cardBg: BRAND_CARD_BG_PALETTE[0],
    accent: BRAND_ACCENT_FALLBACK,
    previewUrl: null,
    previewType: "video",
  },
  {
    number: "02",
    digit: "2",
    title: "Photography",
    description:
      "Editorial campaign stills, product, and lifestyle photography that translate the destination into hero brand visuals.",
    cardBg: BRAND_CARD_BG_PALETTE[1],
    accent: BRAND_ACCENT_FALLBACK,
    previewUrl: null,
    previewType: "video",
  },
  {
    number: "03",
    digit: "3",
    title: "Event Activation",
    description:
      "On-ground experiential activations — pop-ups, brand moments, and influencer takeovers staged in the host country.",
    cardBg: BRAND_CARD_BG_PALETTE[2],
    accent: BRAND_ACCENT_FALLBACK,
    previewUrl: null,
    previewType: "video",
  },
  {
    number: "04",
    digit: "4",
    title: "Social Content",
    description:
      "Vertical reels, BTS edits, and creator deliverables shipped during the trip — built for IG, TikTok, and YouTube Shorts.",
    cardBg: BRAND_CARD_BG_PALETTE[3],
    accent: BRAND_ACCENT_FALLBACK,
    previewUrl: null,
    previewType: "video",
  },
];

/**
 * Normalize an admin-managed `AbroadService` row into the internal
 * `Service` shape the renderer expects. Falls back to deterministic
 * brand-palette defaults so admins only need to fill in title +
 * description + preview file — colors are optional.
 */
function toRenderService(row: AbroadService, index: number): Service {
  const num = String(index + 1).padStart(2, "0");
  return {
    number: num,
    digit: String(index + 1),
    title: row.title,
    description: row.description?.trim() || "",
    cardBg:
      row.card_bg_color ||
      BRAND_CARD_BG_PALETTE[index % BRAND_CARD_BG_PALETTE.length],
    accent: row.accent_color || BRAND_ACCENT_FALLBACK,
    previewUrl: row.preview_url ?? null,
    previewType: row.preview_type ?? "video",
  };
}

interface Props {
  /** Admin-managed service rows. Empty array falls back to
   *  `DEFAULT_SERVICES` so the public section never goes blank. */
  services?: AbroadService[];
}

/**
 * "Services We Offer" — bold sticker-deck of service cards on the
 * left (each a solid bright tile with a chunky black numeral) and a
 * dark editorial preview panel on the right that swaps to match the
 * active tab. The bright/dark contrast is intentional: the left
 * stack is the page's burst of personality against an otherwise
 * moody dark layout. Section is sized to a single viewport so the
 * whole composition reads as one focused "what we offer" moment.
 */
export default function TripAbroadServices({ services }: Props = {}) {
  // Convert admin rows to the renderer's internal shape. Empty input
  // (no rows / table missing) falls back to the canonical default
  // service set so the public page never goes blank.
  const items = useMemo<Service[]>(() => {
    if (!services || services.length === 0) return DEFAULT_SERVICES;
    return services.map(toRenderService);
  }, [services]);

  const [activeIdx, setActiveIdx] = useState(0);
  // Reset active selection if the underlying list shrinks below the
  // currently-focused index (e.g. admin deleted a row).
  const safeActiveIdx = Math.min(activeIdx, items.length - 1);

  return (
    <section className="px-5 md:px-[52px] pt-16 md:pt-36 pb-16 md:pb-36">
      <div className="mb-10 md:mb-14 flex flex-col items-center text-center">
        <h2
          className="font-sans uppercase font-bold text-white leading-[0.98] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 4.4vw, 56px)" }}
        >
          Services We Offer
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-8 lg:gap-10 items-stretch">
        {/* LEFT — sticker-deck of service tabs. Cards flex-grow to
            evenly share the column's height (matching the preview's
            16:9 height via grid items-stretch), and overlap via
            negative top margin so the bottom card still meets the
            preview's bottom edge. Alternating tilt + z-index layering
            give the deck its hand-placed sticker feel. */}
        <div className="relative flex flex-col h-full">
          {items.map((service, i) => (
            <ServiceTab
              key={`${service.number}-${service.title}`}
              service={service}
              active={i === safeActiveIdx}
              onSelect={() => setActiveIdx(i)}
              index={i}
              total={items.length}
              revealDelay={i * 90}
            />
          ))}
        </div>

        {/* RIGHT — landscape preview panel (16:9). All service media
            layers stay pre-mounted in the background so switching
            tabs is INSTANT (no iframe/video reload). Only opacity
            toggles. */}
        <div>
          <PreviewPanel services={items} activeIdx={safeActiveIdx} />
        </div>
      </div>
    </section>
  );
}

function ServiceTab({
  service,
  active,
  onSelect,
  index,
  total,
  revealDelay,
}: {
  service: Service;
  active: boolean;
  onSelect: () => void;
  index: number;
  total: number;
  revealDelay: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Alternating tilt seeds — small, asymmetric numbers so the stack
  // looks hand-placed instead of mechanically alternating. The first
  // card stays flat-leaning-left, the rest follow a -/+ pattern.
  const tiltSeed = [-1.8, 1.4, -1.2, 1.7, -1.5][index] ?? 0;
  const restRotation = tiltSeed;
  const activeRotation = 0;

  // Cards overlap by 28px (`lg:-mt-7` on every card after the first)
  // so the deck reads as stacked stickers without hiding the title /
  // description of the card behind it. Overlap is suppressed on
  // mobile to keep the giant numeral readable.

  // Active or hovered card jumps in front of the rest. Inactive
  // cards descend by z-index so each subsequent card partly covers
  // the one above (deck depth read top-to-bottom).
  const z = active ? 50 : hovered ? 30 : total - index;

  const lift = active ? -6 : hovered ? -3 : 0;
  const scale = active ? 1.015 : 1;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative block w-full text-left rounded-[28px] overflow-hidden focus:outline-none flex-none lg:flex-1 lg:min-h-0 ${
        index > 0 ? "mt-3 lg:-mt-7" : ""
      }`}
      style={{
        background: service.cardBg,
        // Sticker-deck overlap (negative top margin via `lg:-mt-7`,
        // i.e. -28px) only kicks in at lg+ where the deck has a
        // defined height to share. On mobile / tablet the cards stack
        // as natural-height tiles with `mt-3` between them so the
        // giant numeral never gets clipped by a 0-height flex share.
        zIndex: z,
        opacity: revealed ? 1 : 0,
        transform: revealed
          ? `rotate(${active || hovered ? activeRotation : restRotation}deg) translateY(${lift}px) scale(${scale})`
          : `rotate(${restRotation}deg) translateY(24px) scale(0.97)`,
        transitionDelay: revealed ? `${revealDelay}ms` : undefined,
        transitionProperty: "transform, opacity, box-shadow",
        transitionDuration: "420ms",
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        boxShadow: active
          ? "0 30px 70px -18px rgba(0,0,0,0.65), 0 0 0 2px rgba(0,0,0,0.06)"
          : hovered
            ? "0 22px 56px -20px rgba(0,0,0,0.55)"
            : "0 18px 44px -22px rgba(0,0,0,0.5)",
        cursor: "pointer",
      }}
    >
      <div className="relative h-full grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.6fr)] items-center gap-3 md:gap-4 px-5 py-5 md:px-6">
        {/* Giant numeral — overflows toward the bottom-left so the
            crop feels intentional, like a poster numeral. White
            (Bentala brand white #f0f4ff) against the blue cardBg
            for maximum on-brand contrast. */}
        <span
          aria-hidden
          className="select-none pointer-events-none leading-[0.75] text-white font-black"
          style={{
            fontFamily: "var(--font-sans, ui-sans-serif), system-ui",
            fontSize: "clamp(90px, 8vw, 140px)",
            letterSpacing: "-0.08em",
            marginLeft: "-0.05em",
            marginBottom: "-0.1em",
            transform: "translateY(2px)",
          }}
        >
          {service.digit}
        </span>

        <div className="flex flex-col gap-1.5 md:gap-2 pl-1">
          <h3
            className="font-sans font-extrabold text-white leading-[1.05] tracking-[-0.015em]"
            style={{ fontSize: "clamp(17px, 1.4vw, 22px)" }}
          >
            {service.title}
          </h3>
          <p
            className="font-sans text-white leading-[1.45] max-w-[34ch]"
            style={{ fontSize: "clamp(13px, 1vw, 15px)", opacity: 0.85 }}
          >
            {service.description}
          </p>
        </div>

        {/* Active-state pointer — small triangle nudging into the
            left edge of the focused card, like a sticker pulled out
            from the deck. Subtle but unmistakable. */}
        {active && (
          <span
            aria-hidden
            className="absolute -left-3 top-1/2 -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              borderRight: `12px solid ${service.cardBg}`,
              filter: "drop-shadow(-2px 0 4px rgba(0,0,0,0.18))",
            }}
          />
        )}
      </div>
    </button>
  );
}

/**
 * Preview panel for the active service. A 4:5 portrait card with a
 * service-tinted radial wash, a dashed inner frame, and the active
 * service's identity stack (label / title / description) centered
 * over a watermark numeral. The `key` on the inner content forces
 * a remount on tab change so the cross-fade reveal plays each time.
 */
function PreviewPanel({
  services,
  activeIdx,
}: {
  services: Service[];
  activeIdx: number;
}) {
  const active = services[activeIdx];
  const accentRGB = hexToRgb(active.accent);

  // Two-stage mount strategy:
  //   1. On first paint, render ONLY the active service's media so
  //      the bandwidth + decode cost goes entirely to the video the
  //      visitor is about to watch → starts playing in the shortest
  //      possible time.
  //   2. Once the browser is idle (~1.5s post-mount or sooner via
  //      requestIdleCallback), preload the rest of the services in
  //      the background so subsequent tab switches feel instant.
  // This avoids the 4-iframe-cold-start that was making the initial
  // video appear slow even though the active one is the only one
  // visitors actually see.
  const [preloadOthers, setPreloadOthers] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    type IdleAPI = {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as Window & IdleAPI;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(() => setPreloadOthers(true));
    } else {
      timeoutId = window.setTimeout(() => setPreloadOthers(true), 1500);
    }
    return () => {
      if (idleId !== null) w.cancelIdleCallback?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px]"
      style={{
        aspectRatio: "16 / 9",
        background: `radial-gradient(120% 90% at 20% 15%, rgba(${accentRGB},0.32) 0%, transparent 55%), radial-gradient(80% 60% at 80% 90%, rgba(${accentRGB},0.18) 0%, transparent 60%), linear-gradient(135deg, rgba(20,22,32,0.96) 0%, rgba(8,9,13,0.98) 100%)`,
        border: `1px solid rgba(${accentRGB},0.3)`,
        boxShadow: `0 32px 80px -24px rgba(${accentRGB},0.4), 0 0 0 1px rgba(${accentRGB},0.14)`,
        transition: "background 500ms, border-color 500ms, box-shadow 500ms",
      }}
    >
      {/* Pre-mount EVERY service's media as a stacked layer. All
          videos / iframes start loading the moment the panel mounts,
          so switching between services is just an opacity toggle —
          no fresh iframe load, no <video> re-buffer. Inactive layers
          stay at opacity 0 (still playing in the background, decoded
          frames just go to /dev/null). */}
      {services.map((service, i) => {
        if (!service.previewUrl) return null;
        const isActive = i === activeIdx;
        // Skip rendering non-active services until the idle-time
        // preload kicks in. The active service always renders so
        // its video starts loading on the very first paint.
        if (!isActive && !preloadOthers) return null;
        return (
          <div
            key={`media-${service.number}-${service.previewUrl}`}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : 0,
              transition: "opacity 220ms ease",
              pointerEvents: isActive ? "auto" : "none",
              zIndex: isActive ? 2 : 1,
            }}
            aria-hidden={!isActive}
          >
            <PreviewMedia
              url={service.previewUrl}
              type={service.previewType}
              alt={service.title}
            />
          </div>
        );
      })}

      {/* Placeholder layer — only renders when the ACTIVE service has
          no media. Editorial frame with watermark numeral + copy
          stack + "coming soon" pill so the panel never goes blank. */}
      {!active.previewUrl && (
        <>
          <div
            aria-hidden
            className="absolute inset-5 md:inset-7 rounded-[20px] pointer-events-none"
            style={{
              border: `1px dashed rgba(${accentRGB},0.22)`,
              transition: "border-color 500ms",
            }}
          />
          <span
            key={`num-${active.number}`}
            aria-hidden
            className="absolute font-sans font-bold leading-none select-none pointer-events-none animate-fade-up-svc"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: "clamp(220px, 30vw, 420px)",
              letterSpacing: "-0.05em",
              color: "transparent",
              WebkitTextStroke: `1px rgba(${accentRGB},0.18)`,
            }}
          >
            {active.number}
          </span>
          <div
            key={`copy-${active.number}`}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 md:px-10 animate-fade-up-svc"
          >
            <span
              className="font-sans uppercase font-semibold"
              style={{
                fontSize: "clamp(11px, 0.85vw, 12.5px)",
                letterSpacing: "0.3em",
                color: active.accent,
              }}
            >
              Service {active.number}
            </span>
            <h3
              className="font-sans uppercase font-bold text-white leading-[0.95] tracking-[-0.015em] mt-4"
              style={{ fontSize: "clamp(24px, 2.4vw, 36px)" }}
            >
              {active.title}
            </h3>
            {active.description && (
              <p
                className="font-sans text-white/70 leading-[1.6] mt-5 max-w-[38ch]"
                style={{ fontSize: "clamp(14.5px, 1.15vw, 17px)" }}
              >
                {active.description}
              </p>
            )}
            <div
              className="mt-7 inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid rgba(${accentRGB},0.35)`,
              }}
            >
              <span
                className="block w-2 h-2 rounded-full"
                style={{
                  background: active.accent,
                  boxShadow: `0 0 10px rgba(${accentRGB},0.7)`,
                }}
              />
              <span
                className="font-sans uppercase tracking-[0.22em] text-white/80"
                style={{ fontSize: "clamp(10.5px, 0.8vw, 12px)" }}
              >
                Reel preview coming soon
              </span>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeUpSvc {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        :global(.animate-fade-up-svc) {
          animation: fadeUpSvc 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </div>
  );
}

/**
 * Plays the active service's uploaded video (or shows its image) at
 * native aspect-ratio fill inside the 16:9 preview frame. When the
 * URL is a YouTube/Vimeo page link we swap to an `<iframe>` embed
 * (HTML5 `<video>` can only play direct file URLs); direct .mp4 /
 * .webm / .mov URLs autoplay muted-looped so the panel feels alive
 * without forcing audio on the visitor. Images render via `<img>`.
 */
function PreviewMedia({
  url,
  type,
  alt,
}: {
  url: string;
  type: "video" | "image";
  alt: string;
}) {
  const embed = getEmbedSource(url);
  if (embed) {
    return <EmbedPlayer source={embed} alt={alt} />;
  }
  if (type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover animate-fade-up-svc"
        draggable={false}
      />
    );
  }
  return (
    <video
      src={url}
      className="absolute inset-0 w-full h-full object-cover animate-fade-up-svc"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    />
  );
}

/**
 * Convert a YouTube / Vimeo page URL into the matching player-embed
 * URL with autoplay+mute+loop wired up. Returns `null` for direct
 * file URLs (those go straight to <video>/<img>) and for anything we
 * don't recognise — the caller falls back to <video>, which is the
 * right behaviour for unknown direct hosts.
 */
function getEmbedSource(url: string): string | null {
  if (!url) return null;
  // YouTube — long form (`watch?v=`), short (`youtu.be/`), or embed.
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) {
    const id = yt[1];
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: id,
      controls: "0",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      iv_load_policy: "3",
      disablekb: "1",
      fs: "0",
      cc_load_policy: "0",
    });
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }
  // Vimeo — page URL or player URL.
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/);
  if (vm) {
    return `https://player.vimeo.com/video/${vm[1]}?autoplay=1&muted=1&loop=1&controls=0&background=1`;
  }
  // Google Drive — share link or open/uc link. Convert to the
  // `/preview` embed endpoint which renders an in-iframe Drive
  // viewer (works for videos, images, PDFs). Drive does NOT support
  // autoplay via URL params or postMessage in its free embed, and
  // its direct-stream URLs (`uc?export=view`) get blocked by CORS /
  // 302-redirected to interstitial pages, so the iframe is the
  // most reliable surface. For genuinely chrome-free + autoplaying
  // video reels admins should upload .mp4 directly or use YouTube
  // unlisted / Vimeo — both of those DO autoplay.
  const drive =
    url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/) ??
    url.match(/drive\.google\.com\/[^?]*[?&]id=([A-Za-z0-9_-]+)/);
  if (drive) {
    return `https://drive.google.com/file/d/${drive[1]}/preview`;
  }
  return null;
}

/**
 * Renders a YouTube/Vimeo embed iframe at full 16:9 — no scale-crop,
 * no opacity-gating delay. Some YouTube chrome (center play/pause
 * controls during loop transitions, title bar on init, "More videos"
 * card at edges) will be visible at moments. That's a free-YouTube-
 * embed limitation that no URL param can fully suppress. For a truly
 * chrome-free preview, upload the reel as a direct .mp4 (it renders
 * via native <video>) or use a Vimeo link (their `background=1`
 * mode is fully chrome-free).
 */
function EmbedPlayer({
  source,
  alt,
}: {
  source: string;
  alt: string;
}) {
  return (
    <iframe
      src={source}
      title={alt}
      className="absolute inset-0 w-full h-full"
      style={{
        border: "none",
        pointerEvents: "none",
      }}
      allow="autoplay; encrypted-media; picture-in-picture"
    />
  );
}

/**
 * Hex `#rrggbb` → `r, g, b` string usable in `rgba(${rgb}, alpha)`.
 * Falls back to white when the input isn't a valid 6-digit hex so
 * the card never crashes on a bad accent value.
 */
function hexToRgb(hex: string): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{6})$/i);
  if (!m) return "255, 255, 255";
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
