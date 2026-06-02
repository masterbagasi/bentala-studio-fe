"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { HeroData, Service, SocialLink } from "@/lib/types";
import StartCollaborationDialog from "@/components/home/StartCollaborationDialog";
import { trackEvent } from "@/lib/tracker";

const HEADLINE_SANITIZE_OPTS = {
  ALLOWED_TAGS: ["span", "br", "b", "strong", "em", "i", "u"],
  ALLOWED_ATTR: ["style", "class"],
};

interface Props {
  hero: HeroData;
  services: Service[];
  socialLinks: SocialLink[];
  // Style applied to the background layer only — used by HomeIntro
  // to drive zoom + opacity animation on the bg without touching
  // headline/cta/services that should stay visible above.
  bgStyle?: React.CSSProperties;
  // Style applied to a full-section black overlay that fades in
  // once the services section has risen up to (or past) the top
  // of the viewport — produces the "dip to black" disappearance.
  // Stays at z-[20] so it covers bg, scattered tiles, headline,
  // and the bottom socials/scroll-arrow block in one shot.
  dipOverlayStyle?: React.CSSProperties;
  // Optional slot rendered between the bg overlays (z-2) and the
  // hero content (z-10). HomeIntro uses this for the scattered
  // portfolio teaser tiles that sit behind the headline.
  children?: React.ReactNode;
}

export default function HeroSection({
  hero,
  services,
  socialLinks,
  bgStyle,
  dipOverlayStyle,
  children,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoIdxRef = useRef(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const backgroundType = hero.background_type ?? "video";
  const isImageBg = backgroundType === "image" && hero.background_image_url;

  const safeHeadline = useMemo(() => {
    // Convert plain newlines into <br> so admin's multi-line input is preserved.
    const withBreaks = (hero.headline ?? "").replace(/\r\n|\n/g, "<br>");
    return DOMPurify.sanitize(withBreaks, HEADLINE_SANITIZE_OPTS);
  }, [hero.headline]);

  const safeSubtitle = useMemo(() => {
    // Subtitle is now rich HTML too (from the same Tiptap editor).
    const withBreaks = (hero.subtitle ?? "").replace(/\r\n|\n/g, "<br>");
    return DOMPurify.sanitize(withBreaks, HEADLINE_SANITIZE_OPTS);
  }, [hero.subtitle]);

  // Responsive headline size. Absolute floor (20px) + 5vw scaling
  // keeps mobile copies compact regardless of how large the admin
  // sets `headline_font_size_px` — phones land in the 20–28px
  // range, tablets ~38–55px, and only desktop viewports reach the
  // configured cap. Hard-coding the vw scale (instead of deriving
  // it from desktop size) is intentional so a giant desktop value
  // doesn't blow up phone sizes too.
  const desktopHeadlinePx = hero.headline_font_size_px ?? 96;
  const minHeadlinePx = 20;
  const headlineVwScale = "5";
  const headlineFontSize = `clamp(${minHeadlinePx}px, ${headlineVwScale}vw, ${desktopHeadlinePx}px)`;

  const headlineStyle: React.CSSProperties = {
    color: hero.headline_color ?? "#ffffff",
    fontSize: headlineFontSize,
    fontWeight: hero.headline_font_weight ?? 700,
    fontStyle: hero.headline_font_style ?? "normal",
    textTransform: hero.headline_text_transform ?? "none",
    letterSpacing: `${hero.headline_letter_spacing_em ?? -0.01}em`,
    lineHeight: 0.95,
  };

  // Subtitle floor is 75% on mobile (vs 85% historic) so the
  // body copy reads as compact, supporting type beneath the
  // smaller mobile headline.
  const subtitleDesktopPx = hero.subtitle_font_size_px ?? 18;
  const subtitleMinPx = Math.round(subtitleDesktopPx * 0.75);
  const subtitleStyle: React.CSSProperties = {
    color: hero.subtitle_color ?? "rgba(240,244,255,0.92)",
    fontSize: `clamp(${subtitleMinPx}px, ${(subtitleDesktopPx / 14.94).toFixed(2)}vw, ${subtitleDesktopPx}px)`,
    fontWeight: hero.subtitle_font_weight ?? 400,
    fontStyle: hero.subtitle_font_style ?? "normal",
    textTransform: hero.subtitle_text_transform ?? "none",
  };

  useEffect(() => {
    if (isImageBg) return;
    const video = videoRef.current;
    if (!video || !hero.video_urls.length) return;

    // Force muted on the IDL property (not just attribute) so when we
    // eventually call play(), browser autoplay policies don't reject it.
    video.muted = true;

    // Two gates: user must interact AND video must be buffered enough.
    // Only when both are true do we actually start playback. This keeps the
    // poster visible during a scroll-while-buffering scenario.
    let userWantsPlay = false;
    let played = false;

    const HAVE_FUTURE_DATA = 3; // readyState ≥ 3 means we can play without re-buffering soon

    const attemptPlay = () => {
      if (played || !userWantsPlay) return;
      if (video.readyState < HAVE_FUTURE_DATA) return; // still buffering — wait
      played = true;
      cleanupAll();
      void video.play().catch(() => {
        // If play() rejects (browser autoplay policy edge cases), the user
        // can re-interact; reset so a future click can try again.
        played = false;
        userWantsPlay = false;
      });
    };

    const onUserInteraction = () => {
      userWantsPlay = true;
      attemptPlay();
    };
    const onVideoReady = () => attemptPlay();

    const cleanupAll = () => {
      window.removeEventListener("scroll", onUserInteraction);
      window.removeEventListener("click", onUserInteraction);
      window.removeEventListener("touchstart", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      video.removeEventListener("canplay", onVideoReady);
      video.removeEventListener("canplaythrough", onVideoReady);
    };

    window.addEventListener("scroll", onUserInteraction, { passive: true });
    window.addEventListener("click", onUserInteraction);
    window.addEventListener("touchstart", onUserInteraction, { passive: true });
    window.addEventListener("keydown", onUserInteraction);
    video.addEventListener("canplay", onVideoReady);
    video.addEventListener("canplaythrough", onVideoReady);

    const nextVideo = () => {
      videoIdxRef.current = (videoIdxRef.current + 1) % hero.video_urls.length;
      video.src = hero.video_urls[videoIdxRef.current];
      void video.play().catch(() => {});
    };

    video.addEventListener("ended", nextVideo);
    video.addEventListener("error", nextVideo);

    return () => {
      cleanupAll();
      video.removeEventListener("ended", nextVideo);
      video.removeEventListener("error", nextVideo);
    };
  }, [hero.video_urls, isImageBg]);

  const platformIcon = (platform: string) => {
    if (platform === "ig")
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    if (platform === "tiktok")
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
        </svg>
      );
    if (platform === "whatsapp")
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.956 9.956 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    return null;
  };

  return (
    <section
      className="
        relative min-h-screen flex flex-col items-center justify-center text-center px-6
        overflow-hidden
      "
    >
      {/* Background — image or video. Image uses `cover` at every
          breakpoint so it always fills the hero top-to-bottom and
          edge-to-edge (no letterbox bands). If the file's aspect
          ratio doesn't match the viewport some sides may crop —
          upload images with safe margins around any frame text.
          `bgStyle` is reserved for parent-driven animations
          (zoom/fade) — spread first so it can't override the bg
          image source. */}
      {/* Mobile-only background — only rendered when admin has
          uploaded a mobile-specific image. The image is anchored
          to the TOP of the viewport and occupies ~58vh (the upper
          stage of the mobile composition). The bottom ~25% of the
          image fades to transparent via mask-image so it bleeds
          smoothly into the dark text block below — no hard cut.
          The scroll-driven bg zoom/fade (`bgStyle`) is omitted on
          mobile because (a) the image is a static brand still that
          shouldn't visibly scale, and (b) the dip overlay above
          handles the disappearance as the user scrolls past. */}
      {hero.background_image_url_mobile && (
        <div
          aria-hidden
          className="md:hidden absolute inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${hero.background_image_url_mobile})`,
            // Dim + desaturate the mobile bg so the headline + CTA
            // float clearly above. Same flavor as the desktop bg's
            // `filter:saturate(0.5)_brightness(0.35)` plus a 0.55
            // opacity to soften the image further on small screens
            // where it competes more aggressively with foreground.
            opacity: 0.55,
            filter: "saturate(0.6) brightness(0.5)",
          }}
        />
      )}
      {isImageBg ? (
        <div
          className={`absolute inset-0 w-full h-full z-0 pointer-events-none bg-bg bg-cover bg-center bg-no-repeat ${
            hero.background_image_url_mobile ? "hidden md:block" : ""
          }`}
          style={{
            ...bgStyle,
            backgroundImage: `url(${hero.background_image_url})`,
          }}
        />
      ) : (
        <video
          ref={videoRef}
          key={hero.video_urls[0]}
          className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none ${
            hero.background_image_url_mobile ? "hidden md:block" : ""
          }`}
          style={bgStyle}
          src={hero.video_urls[0]}
          muted
          loop={hero.video_urls.length === 1}
          playsInline
          preload="metadata"
          poster={hero.poster_url ?? undefined}
        />
      )}

      {/* Dark Overlay — on md+ pinned to the viewport via `fixed`
          so the gradient doesn't ride along when the user scrolls
          (the bg image below uses a scroll-driven scale transform;
          this overlay sits above it and must stay stationary).
          On mobile it falls back to `absolute inset-0` so it stays
          contained inside the hero section and scrolls away with
          the hero — no fixed dim covering the services section
          beneath. */}
      <div
        className="absolute inset-0 md:fixed md:inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,9,13,0.65) 0%, rgba(8,9,13,0.55) 40%, rgba(8,9,13,0.82) 85%, rgba(8,9,13,1) 100%), linear-gradient(to right, rgba(8,9,13,0.4) 0%, transparent 35%, transparent 65%, rgba(8,9,13,0.4) 100%)",
        }}
      />
      {/* Scanline */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)",
        }}
      />

      {/* Optional extras layer — sits between the bg overlays and
          the headline content. HomeIntro renders the scattered
          portfolio teaser here so the tiles appear behind the
          headline (which keeps reading priority). */}
      {children && (
        <div className="hidden md:block absolute inset-0 z-[5] pointer-events-none">
          {children}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-[1100px]">
        <SanitizedHeadline html={safeHeadline} style={headlineStyle} />
        <SanitizedSubtitle html={safeSubtitle} style={subtitleStyle} />
        <div className="flex gap-3.5 justify-center animate-fade-up animate-fade-up-delay-3">
          <button
            type="button"
            onClick={() => {
              setDialogOpen(true);
              void trackEvent("cta_click", "hero_start_collaboration");
            }}
            className="font-sans text-sm md:text-body-sm font-bold tracking-[0.02em] bg-cyan text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full transition-all hover:bg-blue4 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(11,61,231,0.25)]"
          >
            {hero.cta_text}
          </button>
        </div>
      </div>

      {/* Hero Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-5 pb-9">
        {/* Social Links — single horizontal row. On mobile the type
            shrinks and gaps tighten; if the handles are still wider
            than the screen the row scrolls horizontally (scrollbar
            hidden) instead of hard-clipping at the edge. Inline
            separator dots throughout. */}
        <div className="w-full overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-3 md:gap-10 w-max mx-auto px-5 md:px-0">
            {socialLinks.map((link, i) => (
              <span key={link.id} className="flex items-center gap-3 md:gap-10 shrink-0">
                {i > 0 && (
                  <span className="text-[rgba(240,244,255,0.18)] text-base md:text-lg leading-none">
                    &middot;
                  </span>
                )}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 md:gap-3 font-sans text-xs md:text-lg text-[rgba(240,244,255,0.6)] no-underline transition-colors tracking-[0.02em] whitespace-nowrap hover:text-[rgba(240,244,255,0.95)]"
                >
                  {platformIcon(link.platform)}
                  {link.handle}
                </a>
              </span>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          type="button"
          aria-label="Scroll to next section"
          className="flex flex-col items-center gap-1.5 cursor-pointer opacity-40 transition-opacity hover:opacity-80 bg-transparent border-none p-0"
          onClick={() =>
            document.getElementById("collabs")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
            className="w-5 h-5 text-white animate-scroll-bounce"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Dip overlay — z-[20] sits above bg, overlay, scanline,
          scattered tiles, and the headline/bottom-block, so a single
          layer here applies the "dip to blur until it disappears"
          effect to the entire hero. HomeIntro animates two things
          via inline style: a `backdrop-filter: blur(...)` that
          intensifies, and a `background-color` whose alpha fades in
          toward fully opaque dark — so the hero first goes blurry,
          then fades out behind the darkening tint.
          Hidden on mobile (`hidden md:block`) because the mobile
          hero scrolls naturally with the page; the dip animation
          would just dim a hero that's already scrolling away. */}
      <div
        aria-hidden
        className="hidden md:block absolute inset-0 z-[20] pointer-events-none"
        style={dipOverlayStyle}
      />

      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        services={services}
        leadWhatsappNumber={hero.lead_whatsapp_number}
      />
    </section>
  );
}

// Headline html is already sanitized by DOMPurify upstream (caller MUST pass sanitized html).
function SanitizedHeadline({ html, style }: { html: string; style: React.CSSProperties }) {
  return (
    <h1
      className="font-sans animate-fade-up animate-fade-up-delay-1 [text-shadow:0_2px_32px_rgba(0,0,0,0.9),0_0_80px_rgba(0,0,0,0.6)]"
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Same: subtitle html is sanitized upstream.
function SanitizedSubtitle({ html, style }: { html: string; style: React.CSSProperties }) {
  return (
    <div
      className="font-normal max-w-[560px] mx-auto mt-6 mb-10 leading-[1.75] animate-fade-up animate-fade-up-delay-2 [text-shadow:0_1px_20px_rgba(0,0,0,1),0_0_40px_rgba(0,0,0,0.8)]"
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
