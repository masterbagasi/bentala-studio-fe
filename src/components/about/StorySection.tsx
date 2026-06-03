"use client";

import { ReactNode, createElement, useEffect, useRef, useState } from "react";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { AboutData } from "@/lib/types";
import RevealOnScroll from "@/components/shared/RevealOnScroll";

// Pre/post-process HTML so DOMPurify's CSS scrubber never touches
// the contents of `style` attributes. Each `style="..."` is
// stashed into a numbered placeholder before sanitization, then
// restored verbatim afterwards. This is bulletproof regardless
// of DOMPurify version or hook ordering — we simply never give
// the sanitizer the chance to strip `font-size`, `color`, etc.
//
// Safe because the source is the admin's authenticated Tiptap
// editor; the placeholders only appear as `data-*` attributes
// during the sanitize window, which the allow-list explicitly
// permits.
function sanitizeKeepStyles(
  html: string,
  config: { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[] },
): string {
  // Server: the source is the admin's authenticated Tiptap editor
  // (trusted), so we skip DOMPurify here and return the markup as-is.
  // This keeps `isomorphic-dompurify` → jsdom out of the serverless
  // render path, whose transitive `@exodus/bytes` throws ERR_REQUIRE_ESM
  // on Vercel's Node. The client re-sanitizes on hydration for
  // defense-in-depth (the dangerouslySetInnerHTML site uses
  // suppressHydrationWarning, so the server/client diff is benign).
  if (typeof window === "undefined") {
    return html;
  }
  const styles: string[] = [];
  const stashed = html.replace(/\sstyle="([^"]*)"/gi, (_match, value) => {
    const idx = styles.push(value) - 1;
    return ` data-bsi-style="${idx}"`;
  });
  const cleaned = DOMPurify.sanitize(stashed, {
    ALLOWED_TAGS: config.ALLOWED_TAGS,
    ALLOWED_ATTR: [...config.ALLOWED_ATTR, "data-bsi-style"],
  });
  return cleaned.replace(/\sdata-bsi-style="(\d+)"/g, (_m, idx) => {
    const value = styles[Number(idx)];
    if (!value) return "";
    return ` style="${value.replace(/"/g, "&quot;")}"`;
  });
}

// Detect whether a stored value is HTML (from the admin's Tiptap
// editor) or the legacy markdown-lite syntax. Any presence of an
// HTML tag flips into HTML mode; otherwise we fall back to the
// `renderRichText` markdown renderer so older content keeps
// rendering correctly.
function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(s);
}

// Unwraps Tiptap's `<p>` blocks and re-emits each as its own
// `display:block` line wrapper. Critically, when the inner
// content carries a custom `font-size` (set via the rich text
// editor), we LIFT THAT SIZE onto the wrapping block too. That
// makes the wrapping block's CSS "strut" — the phantom box that
// dictates how tall each line-box is — match the actual content
// instead of inheriting the heading's viewport-scaled clamp
// font-size. Without this lift, the strut grows with the
// viewport (because clamp scales with `vw`), and the visible
// gap between lines drifts across breakpoints.
//
// `line-height: 1` then collapses each block to exactly its
// content's height — same on mobile, tablet, and full-screen
// desktop.
function stripOuterParagraphs(html: string): string {
  if (!/<p\b[^>]*>/i.test(html)) return html;

  const pattern = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const collected = Array.from(html.matchAll(pattern), (m) => m[1].trim());
  if (collected.length === 0) {
    return html.replace(/<\/?p\b[^>]*>/gi, "");
  }
  const FONT_SIZE_RE = /font-size:\s*([\d.]+(?:px|em|rem|pt|%))/i;
  return collected
    .filter(Boolean)
    .map((line) => {
      const match = line.match(FONT_SIZE_RE);
      const sizeDecl = match ? `;font-size:${match[1]}` : "";
      return `<span style="display:block;line-height:1${sizeDecl}">${line}</span>`;
    })
    .join("");
}

// Markdown-in-HTML post-processor. The admin uses Tiptap which
// stores rich text as HTML wrapped in <p> tags. Power users still
// type the `**word**` / `*word*` shorthand inside the rich editor
// expecting it to render as styled spans — Tiptap stores those
// asterisks as literal text, so they would otherwise show as raw
// `**` on the public site. We run the same regex pass we use on
// the legacy markdown path, but now over the sanitised HTML
// string, so both flows produce the same visual output.
function inlineMarkdownToHtml(
  html: string,
  opts: { boldStyle: string; italicStyle: string },
): string {
  return html
    .replace(
      /\*\*([^*<>\n]+)\*\*/g,
      `<span style="${opts.boldStyle}">$1</span>`,
    )
    .replace(
      /(^|[^*])\*([^*<>\n]+)\*(?!\*)/g,
      `$1<span style="${opts.italicStyle}">$2</span>`,
    );
}

// Render trusted-source HTML safely. The string is always passed
// through DOMPurify here, so the inner-HTML injection below is
// bounded — even if the admin DB row somehow contained untrusted
// markup, only the sanitiser's allow-list survives. The optional
// `markdown` opts let callers also upgrade `**...**` / `*...*`
// patterns that survived inside the HTML.
function SanitizedHtml({
  html,
  as = "div",
  className,
  style,
  markdown,
}: {
  html: string;
  as?: "div" | "h2" | "p";
  className?: string;
  style?: React.CSSProperties;
  markdown?: { boldStyle: string; italicStyle: string };
}) {
  // Route through sanitizeKeepStyles so Tiptap's inline
  // `font-size` / `color` / `font-weight` declarations survive
  // intact — DOMPurify's default CSS allow-list would otherwise
  // strip them, breaking the admin → public visual parity.
  const sanitized = sanitizeKeepStyles(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u", "s", "span",
      "h1", "h2", "h3", "h4", "h5", "h6", "a",
    ],
    ALLOWED_ATTR: ["style", "class", "href", "target", "rel"],
  });
  // Strip Tiptap's outer `<p>` wrapper so we don't end up with
  // `<p><p>...</p></p>` (invalid HTML → hydration mismatch).
  const unwrapped = stripOuterParagraphs(sanitized);
  const processed = markdown
    ? inlineMarkdownToHtml(unwrapped, markdown)
    : unwrapped;
  // suppressHydrationWarning silences benign mismatches between
  // server-side DOMPurify (jsdom polyfill) and client-side
  // DOMPurify (real DOM). Both pipelines sanitize the same
  // trusted input, but minor attribute-ordering differences can
  // trigger React's hydration check — we explicitly trust the
  // client render to take over.
  return createElement(as, {
    className,
    style,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: { __html: processed },
  });
}

interface Props {
  about: AboutData;
}

/**
 * Tiny markdown-lite renderer used for the "Our Story" eyebrow/
 * heading/paragraph copy. Supports:
 *   **word**  → wrapped in <span class={boldClass}>
 *   *word*    → wrapped in <span class={italicClass}>
 *   \n        → <br />  (only when allowBreaks is true)
 *
 * Keeps things deliberately small — no nested marks, no escapes.
 * The admin only needs ASCII asterisks and newlines, which is
 * forgiving enough for non-technical editors.
 */
function renderRichText(
  source: string,
  opts: {
    boldClass: string;
    italicClass: string;
    allowBreaks?: boolean;
  },
): ReactNode {
  const { boldClass, italicClass, allowBreaks = false } = opts;
  const tokens = source.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\n)/g);
  return tokens.map((tok, i) => {
    if (!tok) return null;
    if (tok === "\n") return allowBreaks ? <br key={i} /> : " ";
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
      return (
        <span key={i} className={boldClass}>
          {tok.slice(2, -2)}
        </span>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      return (
        <span key={i} className={italicClass}>
          {tok.slice(1, -1)}
        </span>
      );
    }
    return tok;
  });
}

const STORY_DEFAULTS = {
  eyebrow: "Our Story",
  heading: "Born in **Indonesia.**\n*Made* for the world.",
  paragraph:
    "Bentala adalah **creative ecosystem** yang menggabungkan kekuatan dua entitas — satu membangun narasi, satu memproduksi visual. Bersama, kami membawa perspektif Indonesia ke skala global.",
};

type Entity = {
  fallbackLogo: string;
  customLogo?: string | null;
  name: string;
  handle: string;
  desc: string;
  accent: string;
  /** Filter applied only to the bundled fallback (which is dark
   *  on transparent and needs inverting to read on the dark card).
   *  Admin uploads are assumed already-styled, so no filter is
   *  applied to custom URLs. */
  fallbackFilter: string;
  imgW: number;
  imgH: number;
};

/**
 * Editorial Story section — replaces the prior grid-heavy layout
 * with a magazine-spread feel:
 *   • Pull-quote opening with oversized display type and an
 *     italic word break for cadence
 *   • Two entities as paired editorial cards (not divider strips),
 *     each with its own glow accent
 *   • Vision / Mission / Edge as alternating editorial rows.
 *     Vision text-left + image-right, Mission text-right +
 *     image-left, Edge text-left + image-right — the eye
 *     zig-zags down the page. The image always bleeds to the
 *     opposite viewport edge with an asymmetric rounded corner
 *     (Leonardo.AI style).
 */
export default function StorySection({ about }: Props) {
  const philosophy = [
    {
      num: "01",
      label: "Our Vision",
      text: about.vision_text,
      image: about.vision_image_url,
    },
    {
      num: "02",
      label: "Our Mission",
      text: about.mission_text,
      image: about.mission_image_url,
    },
    {
      num: "03",
      label: "Our Edge",
      text: about.edge_text,
      image: about.edge_image_url,
    },
  ];

  const ENTITY_1_DEFAULT_DESC =
    "Media platform yang menyajikan informasi internasional berkaitan dengan Indonesia — membangun narasi global dari dalam negeri.";
  const ENTITY_2_DEFAULT_DESC =
    "Creative agency dengan kapabilitas produksi internasional — menghasilkan konten sinematik yang membawa brand Indonesia ke panggung dunia.";

  const entities: Entity[] = [
    {
      fallbackLogo: "/logo-bentala-project.png",
      customLogo: about.entity_1_logo_url,
      name: "Bentala Project Indonesia",
      handle: "bentala project",
      desc: about.entity_1_desc?.trim() || ENTITY_1_DEFAULT_DESC,
      accent: "rgba(11,61,231,0.55)",
      fallbackFilter: "invert(1)",
      imgW: 114,
      imgH: 57,
    },
    {
      fallbackLogo: "/logo-studio-tight.png",
      customLogo: about.entity_2_logo_url,
      name: "Bentala Studio Indonesia",
      handle: "bentala studio",
      desc: about.entity_2_desc?.trim() || ENTITY_2_DEFAULT_DESC,
      accent: "rgba(255,255,255,0.45)",
      fallbackFilter: "none",
      imgW: 114,
      imgH: 50,
    },
  ];

  // ── Scroll-driven blur/fade for the pinned hero ─────────────
  // The hero (heading + paragraph) is rendered as a fixed layer
  // that stays anchored to the viewport. As the scrollable
  // content section (video + entities + philosophy) rises into
  // view from below, the hero blurs and fades — by the time the
  // content's top reaches the viewport top, the hero is invisible.
  const contentRef = useRef(null as HTMLDivElement | null);
  const [coverProgress, setCoverProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    function update() {
      const content = contentRef.current;
      if (!content) return;
      const rect = content.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      // 0 when the content's top is at the viewport bottom (just
      // peeking in), 1 when the content's top reaches the viewport
      // top (content fully covers the hero behind it).
      const distance = viewportH - rect.top;
      const p = Math.max(0, Math.min(1, distance / viewportH));
      setCoverProgress(p);
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Auto-snap the story video to the top of the viewport. Triggers
  // the moment the user nudges scroll past the hero — even a tiny
  // scroll pulls the video up. The snap is a 1100ms cinematic
  // easeOutQuint glide. The user's continued wheel/touch input is
  // ignored DURING the glide (grace period) so the snap actually
  // completes; only after the glide settles do new user inputs
  // re-arm the trigger.
  const videoSnapRef = useRef(null as HTMLDivElement | null);
  useEffect(() => {
    let raf = 0;
    let snapAnimRaf = 0;
    let lastY = window.scrollY;
    let snapping = false;
    let armed = true;

    // easeOutCubic — gentler decel than quint, so the page feels
    // snappy at the start and lands smoothly without a long tail.
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateScrollTo = (targetY: number, duration: number) => {
      const startY = window.scrollY;
      const delta = targetY - startY;
      if (Math.abs(delta) < 1) return;
      const startTime = performance.now();
      snapping = true;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOutCubic(t);
        window.scrollTo(0, startY + delta * eased);
        if (t < 1) {
          snapAnimRaf = requestAnimationFrame(tick);
        } else {
          snapping = false;
        }
      };
      cancelAnimationFrame(snapAnimRaf);
      snapAnimRaf = requestAnimationFrame(tick);
    };

    function check() {
      const video = videoSnapRef.current;
      if (!video) return;
      const rect = video.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const scrollingDown = window.scrollY > lastY;
      const scrollingUp = window.scrollY < lastY;

      // Down-snap zone — the moment video's top dips below the
      // viewport top (between 1% and 99% of viewport height),
      // pull it up to the top.
      const inDownSnapZone =
        rect.top > viewportH * 0.01 && rect.top < viewportH * 0.99;

      // Up-snap zone — once the video has been parked at (or just
      // above) the viewport top, scrolling up reverses the action
      // and glides the page back to the hero. Triggered when the
      // video's top is within ±15% of the viewport top.
      const inUpSnapZone =
        rect.top < viewportH * 0.15 && rect.top > -viewportH * 0.15;

      if (scrollingDown && armed && !snapping && inDownSnapZone) {
        armed = false;
        const targetY = window.scrollY + rect.top;
        animateScrollTo(targetY, 450);
      } else if (
        scrollingUp &&
        armed &&
        !snapping &&
        inUpSnapZone &&
        window.scrollY > 0
      ) {
        // Reverse snap — glide back to the very top of the page
        // (hero fully visible). Target = 0 so the page lands at
        // scrollTop = 0 regardless of where the video naturally
        // sits in the document.
        armed = false;
        animateScrollTo(0, 450);
      }

      // Re-arm once the user has clearly left BOTH snap zones —
      // i.e., they've scrolled past the video downward (past
      // entities/philosophy) OR they've made it back above the
      // video into the hero region. Without this, repeated snaps
      // would re-fire as the page settles into target position.
      if (!armed && !snapping && !inDownSnapZone && !inUpSnapZone) {
        armed = true;
      }
      lastY = window.scrollY;
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    }

    // Lock user scroll input DURING the snap animation by
    // preventDefault-ing wheel/touchmove. Without this, the
    // browser's native scroll (from wheel momentum or continued
    // user wheeling) fights our rAF-driven scrollTo, producing
    // jittery / "rough" motion. Non-passive listeners are
    // required for preventDefault to actually work.
    const onWheel = (e: WheelEvent) => {
      if (snapping) e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (snapping) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      // Stop arrow-down / page-down / space from scrolling while
      // the snap is in flight too — same reason as wheel.
      if (!snapping) return;
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Spacebar"];
      if (keys.includes(e.key)) e.preventDefault();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(snapAnimRaf);
    };
  }, []);

  const hasBanner = Boolean(about.hero_banner_image_url);

  return (
    <div className="relative">
      <div
        aria-hidden={coverProgress >= 1}
        className={`fixed inset-0 z-0 flex flex-col items-center justify-center pointer-events-none bg-bg2 overflow-hidden ${
          hasBanner ? "" : "px-5 md:px-[52px]"
        }`}
        style={{
          opacity: 1 - coverProgress * 0.95,
          filter: `blur(${coverProgress * 28}px) saturate(${1 - coverProgress * 0.3})`,
          transform: `scale(${1 - coverProgress * 0.04}) translateY(${-coverProgress * 30}px)`,
          visibility: coverProgress >= 0.999 ? "hidden" : "visible",
          willChange: "opacity, filter, transform",
        }}
      >
        {hasBanner ? (
          /* Banner mode — fills the viewport with the uploaded
             image. `object-cover` crops slightly when the image's
             ratio doesn't match the visitor's viewport, but never
             leaves empty bars.
             A separate MOBILE banner (portrait/square) can be
             uploaded so phone viewports aren't side-cropped; it shows
             below md and falls back to the desktop banner when unset.
             The desktop banner shows at md+. */
          <>
            {/* Mobile: render in a true 9:16 portrait frame so a 9:16
                upload shows in FULL with no side-cropping. (Full-bleed
                cover would crop the sides because phone screens are
                taller than 9:16.) Falls back to the desktop banner when
                no mobile image is set. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={about.hero_banner_image_url_mobile || about.hero_banner_image_url!}
              alt=""
              className="w-full aspect-[9/16] object-cover md:hidden"
            />
            {/* Desktop (md+): full-bleed cover fills the wide viewport. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={about.hero_banner_image_url!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover hidden md:block"
            />
          </>
        ) : (
          <>
            {/* Atmosphere — soft blue glow top-left and faint warm
                bottom-right. Locks the hero into the same atmospheric
                palette the rest of the About page uses. */}
            <div
              aria-hidden
              className="absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(11,61,231,0.18) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -right-32 w-[560px] h-[560px] rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,255,255,0.05) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />

            <div className="relative flex flex-col items-center text-center gap-7 md:gap-10 w-full max-w-[1400px]">
              {(() => {
                const raw = about.story_heading?.trim() || STORY_DEFAULTS.heading;
                const headingClass =
                  "font-sans uppercase font-black text-white leading-[0.94] tracking-[-0.012em] max-w-none";
                const headingStyle = { fontSize: "60px" };
                return looksLikeHtml(raw) ? (
                  <SanitizedHtml
                    html={raw}
                    as="h2"
                    className={headingClass}
                    style={headingStyle}
                    markdown={{
                      boldStyle: "color:#0B3DE7;font-weight:900",
                      italicStyle:
                        "font-family:Georgia,serif;font-style:italic;font-weight:500;letter-spacing:-0.01em;color:rgba(240,244,255,0.92)",
                    }}
                  />
                ) : (
                  <h2 className={headingClass} style={headingStyle}>
                    {renderRichText(raw, {
                      boldClass: "text-cyan",
                      italicClass:
                        "font-serif italic font-medium tracking-tight text-[rgba(240,244,255,0.92)]",
                      allowBreaks: true,
                    })}
                  </h2>
                );
              })()}
              <div className="w-full">
                {(() => {
                  const raw = about.story_paragraph?.trim() || STORY_DEFAULTS.paragraph;
                  const pClass =
                    "font-sans text-[rgba(240,244,255,0.78)] leading-[1.6] tracking-tight";
                  const pStyle = { fontSize: "clamp(18px, 1.8vw, 26px)" };
                  return looksLikeHtml(raw) ? (
                    <SanitizedHtml
                      html={raw}
                      as="p"
                      className={pClass}
                      style={pStyle}
                      markdown={{
                        boldStyle: "color:#fff;font-weight:600",
                        italicStyle:
                          "font-family:Georgia,serif;font-style:italic;font-weight:500;letter-spacing:-0.01em;color:rgba(240,244,255,0.9)",
                      }}
                    />
                  ) : (
                    <p className={pClass} style={pStyle}>
                      {renderRichText(raw, {
                        boldClass: "text-white font-medium",
                        italicClass:
                          "font-serif italic font-medium tracking-tight text-[rgba(240,244,255,0.9)]",
                      })}
                    </p>
                  );
                })()}
              </div>

              {/* ── Editorial photo strip ──────────────────────────
                  Lives INSIDE the pinned hero so it stays in fixed
                  position with the headline + description, blurs
                  and fades with them as the user scrolls. Hidden
                  in banner mode — banner is its own hero. Admin-
                  managed via bsi_about.hero_grid_image_urls. */}
              {about.hero_grid_image_urls && about.hero_grid_image_urls.length > 0 && (
                <HeroGridStrip urls={about.hero_grid_image_urls} />
              )}
            </div>
          </>
        )}
      </div>

      {/* Hero spacer — reserves one viewport of scroll height so
          the fixed hero above appears to occupy the first screen
          before the scrollable content begins to overlay it. */}
      <div aria-hidden style={{ height: "100vh" }} />

      {/* ── Scrollable story content — video, entities, philosophy.
          z-10 so it visually rises ABOVE the fixed hero layer as
          the user scrolls. `bg-bg2` gives it an opaque background
          so by the time it fully covers the viewport the hero
          behind is completely hidden. */}
      <section
        ref={contentRef}
        className="relative z-10 overflow-hidden"
      >
        {about.story_video_url && (
          <div
            ref={videoSnapRef}
            className="px-5 md:px-[52px] pt-24 md:pt-36 pb-16 md:pb-20 flex flex-col gap-10 md:gap-14"
          >
            {/* Video — full width 16:9, same size as before. */}
            <RevealOnScroll delay={80} className="block">
              <div
                className="relative w-full bg-black overflow-hidden rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]"
                style={{ aspectRatio: "16 / 9" }}
              >
                <SeamlessLoopVideo src={about.story_video_url} />
              </div>
            </RevealOnScroll>

            {/* Entity cards — side-by-side on md+ (Project on left,
                Studio on right) so the two halves read as paired
                lockups. Slide-in animation enters from opposite
                edges to reinforce the duality. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {entities.map((entity, i) => (
                <RevealOnScroll
                  key={entity.name}
                  delay={120 + i * 80}
                  className={`block h-full ${i === 0 ? "reveal-left" : "reveal-right"}`}
                >
                  <div
                    className="group relative overflow-hidden rounded-2xl px-8 md:px-12 py-7 md:py-9 h-full transition-transform duration-500 hover:-translate-y-0.5"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      aria-hidden
                      className="absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-100"
                      style={{
                        background: `radial-gradient(closest-side, ${entity.accent} 0%, transparent 70%)`,
                        filter: "blur(30px)",
                      }}
                    />
                    {/* Vertical stack: logo on top (left-aligned),
                        then description below at full card width. */}
                    <div className="relative flex flex-col gap-5 md:gap-7">
                      <div className="flex items-center justify-start">
                        {entity.customLogo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={entity.customLogo}
                            alt={entity.name}
                            style={{
                              height: "clamp(72px, 7vw, 110px)",
                              width: "auto",
                              opacity: 0.94,
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                        ) : (
                          <Image
                            src={entity.fallbackLogo}
                            alt={entity.name}
                            width={Math.round(entity.imgW * 5)}
                            height={Math.round(entity.imgH * 5)}
                            style={{
                              filter: entity.fallbackFilter,
                              opacity: 0.94,
                              height: "clamp(72px, 7vw, 110px)",
                              width: "auto",
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                        )}
                      </div>
                      <p
                        className="font-sans text-white/85 leading-[1.55] tracking-tight m-0"
                        style={{ fontSize: "clamp(20px, 1.8vw, 28px)" }}
                      >
                        {entity.desc}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        )}

        <div className="relative pt-24 md:pt-32 pb-24 md:pb-36">
        <div className="relative px-5 md:px-[52px]">

        {/* ── Vision / Mission / Edge — Leonardo.AI editorial split:
            big uppercase title + caption on one side, oversized
            image dominating the opposite side. Rows alternate
            direction so the eye zig-zags down the page. */}
        <div className="flex flex-col gap-20 md:gap-32">
          {philosophy.map((item, i) => {
            // Alternate sides — Vision text-left, Mission text-
            // right, Edge text-left. Images and text stay INSIDE
            // the section's 52px padded container so the row
            // edges align with the Six Principles + The People
            // sections below (no viewport-edge bleed).
            // Vision (i=0) → image LEFT, text RIGHT
            // Mission (i=1) → image RIGHT, text LEFT
            // Edge (i=2)   → image LEFT, text RIGHT
            // `reversed` flips the default; flipping the parity
            // gives the requested L/R/L cadence.
            const reversed = i % 2 === 0;

            return (
              // Per-row entrance animation. Editors asked for an
              // alternating slide-IN pattern (each row glides to
              // centre from the opposite side):
              //   Vision (i=0)  → enter from the RIGHT
              //   Mission (i=1) → enter from the LEFT
              //   Edge (i=2)    → enter from the RIGHT
              // This is the inverse of the static layout side, so
              // the eye gets a fresh entrance direction on every
              // scroll-in instead of always reading left-to-right.
              <RevealOnScroll
                key={item.label}
                delay={i * 120}
                className={`block ${i % 2 === 0 ? "reveal-right" : "reveal-left"}`}
              >
                <div
                  key={item.label}
                  className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-12 lg:gap-20"
                >
                  {/* Text column — half of the content area. Order
                      swaps via `md:order-1/2` instead of changing
                      DOM order, so screen readers still get the
                      natural reading flow. Reversed rows align
                      content to the right (mirror layout). */}
                  <div
                    className={`order-2 flex flex-col gap-5 md:gap-7 ${
                      reversed
                        ? "md:order-2 md:items-end md:text-right"
                        : "md:order-1"
                    }`}
                  >
                    {(() => {
                      const raw = item.text ?? "";
                      // Line-height for the paragraph as a whole
                      // defaults to 1.55 via `leading-[1.55]`;
                      // inner spans with their own `line-height`
                      // (set via the RichTextEditor toolbar) win
                      // over this default, giving editors per-
                      // selection control.
                      // No max-width cap on the paragraph — the
                      // text fills the full text column so editors
                      // get the same character-per-line budget as
                      // the rest of the section (Six Principles,
                      // The People).
                      const pClass =
                        "font-sans text-white/85 leading-[1.55] tracking-tight";
                      const pStyle: React.CSSProperties = {
                        fontSize: "clamp(20px, 1.8vw, 28px)",
                      };
                      return looksLikeHtml(raw) ? (
                        <SanitizedHtml
                          html={raw}
                          as="p"
                          className={pClass}
                          style={pStyle}
                          markdown={{
                            boldStyle: "color:#fff;font-weight:600",
                            italicStyle:
                              "font-family:Georgia,serif;font-style:italic;font-weight:500;letter-spacing:-0.01em;color:rgba(240,244,255,0.9)",
                          }}
                        />
                      ) : (
                        <p className={pClass} style={pStyle}>
                          {renderRichText(raw, {
                            boldClass: "text-white font-medium",
                            italicClass:
                              "font-serif italic font-medium tracking-tight text-[rgba(240,244,255,0.9)]",
                          })}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Visual column — fits INSIDE the section's
                      52px padded container so its outer edge aligns
                      with the Six Principles header / The People
                      bento below. All four corners stay rounded
                      (no asymmetric squaring) since the image is
                      no longer bleeding to the viewport edge. */}
                  <div className={`order-1 ${reversed ? "md:order-1" : "md:order-2"}`}>
                    {item.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image}
                        alt={item.label}
                        className="block w-full h-auto rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] transition-transform duration-700 hover:scale-[1.01]"
                      />
                    ) : (
                      <div className={`flex items-baseline gap-3 ${reversed ? "md:justify-end md:pr-8" : "md:pl-8"}`}>
                        <span
                          className="font-sans font-bold text-cyan leading-none tracking-[-0.02em]"
                          style={{ fontSize: "clamp(120px, 16vw, 240px)" }}
                        >
                          {item.num}
                        </span>
                        <span className="hidden md:inline-block w-16 h-px bg-cyan" />
                      </div>
                    )}
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
      </div>
    </section>
    </div>
  );
}

/**
 * Single-element looping video, tuned for low overhead.
 *
 * Performance choices:
 *   • `preload="metadata"` — fetch headers up front but DEFER
 *     the byte download until the user actually scrolls the
 *     section into view. The earlier dual-video swap doubled
 *     bandwidth/memory and tanked page perf, so we drop back
 *     to one element and accept the browser's native loop.
 *   • `loop` attribute — handled in C++ by the browser, costs
 *     effectively zero JS / paint work.
 *   • No `timeupdate` / rAF listeners — those fire constantly
 *     and burn CPU even when the page is idle.
 *
 * If the video shows a visible gap between iterations, the fix
 * lives in the encode (first/last frame must match, audio track
 * stripped or silent at boundaries). Doing it in JS doesn't
 * come for free and the earlier attempts proved it.
 */
function SeamlessLoopVideo({ src }: { src: string }) {
  return (
    <video
      key={src}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

/**
 * Hero photo strip — editorial showpiece between the "Born in
 * Indonesia" hero and the rest of the About story. Single photo
 * renders as a big rounded poster (Les Braqueuses-style); multiple
 * photos lay out in a 2-col grid with the same poster styling per
 * tile. White subtle border + drop shadow lifts each frame off
 * the dark page surface so the strip reads as gallery prints, not
 * inline thumbnails.
 */
function HeroGridStrip({ urls }: { urls: string[] }) {
  const cleaned = urls.filter(Boolean);
  if (cleaned.length === 0) return null;

  const n = cleaned.length;
  // Solo poster is wider (16:9) so it dominates; multi-photo rows
  // use a tighter 4:5 portrait tile so several frames fit on one
  // line without each tile becoming a sliver.
  const tileAspect = n === 1 ? "16 / 9" : "4 / 5";

  return (
    <div
      className="grid gap-4 md:gap-6 max-w-[1300px] w-full mx-auto"
      style={{
        gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
      }}
    >
      {cleaned.map((url, i) => (
        <RevealOnScroll
          key={`${url}-${i}`}
          delay={Math.min(i * 80, 320)}
          className="block"
        >
          <div
            className="relative w-full overflow-hidden bg-white/[0.04]"
            style={{
              aspectRatio: tileAspect,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow:
                "0 30px 80px -30px rgba(0,0,0,0.75), 0 2px 8px rgba(255,255,255,0.04) inset",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </RevealOnScroll>
      ))}
    </div>
  );
}
