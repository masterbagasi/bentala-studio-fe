"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PortfolioItem } from "@/lib/types";

// Platforms that support raw <video> playback once we extract og:video
// from the post HTML. YouTube + Vimeo serve adaptive streams (HLS/DASH)
// that browsers can't play natively, so they stay on the iframe path
// (handled via `getEmbedUrl`).
function isSocialVideoUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  return (
    /(^|\.)(instagram\.com|instagr\.am)$/.test(host) ||
    /(^|\.)tiktok\.com$/.test(host) ||
    /(^|\.)facebook\.com$/.test(host) ||
    host === "fb.watch"
  );
}

interface Props {
  item: PortfolioItem | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/**
 * Resolve an iframe-embeddable player URL for platforms that serve adaptive
 * streams we can't play natively (YouTube HLS, Vimeo DRM). Returns null for
 * Instagram / TikTok / Facebook — those are handled by extracting og:video
 * and rendering a raw <video> tag, so the visitor sees only the video
 * itself with no surrounding post UI.
 */
function getEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    if (id)
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      const v = parsed.searchParams.get("v");
      if (v)
        return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0&modestbranding=1`;
    }
    const m = parsed.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
    if (m)
      return `https://www.youtube.com/embed/${m[2]}?autoplay=1&rel=0&modestbranding=1`;
  }

  if (host === "vimeo.com") {
    const id = parsed.pathname.match(/^\/(\d+)/)?.[1];
    if (id) return `https://player.vimeo.com/video/${id}?autoplay=1`;
  }

  return null;
}

/**
 * Full-screen popup preview for a portfolio item. Renders the
 * media (image or video) at its natural aspect ratio, capped to
 * the viewport with breathing room around the edge. Backdrop
 * blur + dark scrim keeps focus on the media.
 *
 * Closes via:
 *   • backdrop click
 *   • Esc key
 *   • × button (top-right)
 *
 * Optional prev/next nav (← / →) when caller passes the handlers.
 */
export default function PortfolioLightbox({
  item,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Derive media-source flags from the current item. When `item` is null
  // these stay at their default values so the hooks below run in the same
  // order on every render (Rules of Hooks — never branch hooks behind an
  // early return).
  const mediaUrl = item?.media_url ?? "";
  const isDirectMedia =
    /\.(jpg|jpeg|png|webp|gif|avif|mp4|webm|mov)(\?|$)/i.test(mediaUrl) ||
    /\.supabase\.co\//.test(mediaUrl) ||
    /(^|\.)ytimg\.com\//.test(mediaUrl);
  const embedUrl = item ? getEmbedUrl(item.media_url) : null;
  const shouldResolveSocialVideo =
    !!item && !isDirectMedia && !embedUrl && isSocialVideoUrl(mediaUrl);

  // For Instagram / TikTok / Facebook posts, ask the server to extract the
  // post's raw video URL (og:video) so we can render it in a plain <video>
  // tag — no platform UI, just the video.
  const [socialResolved, setSocialResolved] = useState<{
    videoUrl: string | null;
    posterUrl: string | null;
    state: "loading" | "ready" | "failed";
  }>(() => ({ videoUrl: null, posterUrl: null, state: "loading" }));

  useEffect(() => {
    if (!item) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasNext && onNext) onNext();
      else if (e.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
    }

    document.addEventListener("keydown", handleKey);
    // Lock body scroll while the lightbox is open so the page
    // behind doesn't bounce when the user hits the edge of a
    // long video clip.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose, onNext, onPrev, hasNext, hasPrev]);

  useEffect(() => {
    if (!shouldResolveSocialVideo || !mediaUrl) return;
    let cancelled = false;
    setSocialResolved({ videoUrl: null, posterUrl: null, state: "loading" });
    fetch(`/api/social-video?url=${encodeURIComponent(mediaUrl)}`)
      .then((r) => r.json())
      .then((data: { video_url?: string; poster_url?: string }) => {
        if (cancelled) return;
        const videoUrl = data.video_url
          ? `/api/media-proxy?url=${encodeURIComponent(data.video_url)}`
          : null;
        setSocialResolved({
          videoUrl,
          posterUrl: data.poster_url
            ? `/api/media-proxy?url=${encodeURIComponent(data.poster_url)}`
            : null,
          state: videoUrl ? "ready" : "failed",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSocialResolved({
          videoUrl: null,
          posterUrl: null,
          state: "failed",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [mediaUrl, shouldResolveSocialVideo]);

  // Bail out AFTER all hooks have run — keeps the hook order stable across
  // open/close cycles.
  if (!item) return null;

  const isVideo =
    item.media_type === "video" ||
    /\.(mp4|webm|mov)(\?|$)/i.test(item.media_url);
  const aspectRatio = item.aspect_ratio?.replace(":", " / ") || "16 / 9";

  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Portal directly to <body> so the lightbox escapes any ancestor stacking
  // context (the masonry section sits behind a navbar with `z-[999]` and a
  // backdrop-blur that creates its own context — without portal-escape the
  // navbar would still appear over the overlay).
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8 md:px-10 md:py-12"
      style={{
        background: "rgba(8, 9, 13, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        animation: "portfolioLightboxFadeIn 0.25s ease-out forwards",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* Close button — fixed to viewport corner so it's always
          reachable regardless of media size. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="fixed top-5 right-5 md:top-7 md:right-7 z-10 flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full text-white transition-all duration-200 hover:scale-110"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>

      {/* Prev / Next navigation — show only when handlers + items
          are available. Arrows sit at the screen edge so they
          don't overlap the media. */}
      {hasPrev && onPrev && (
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous"
          className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full text-white transition-all duration-200 hover:scale-110"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {hasNext && onNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label="Next"
          className="hidden md:flex fixed right-5 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full text-white transition-all duration-200 hover:scale-110"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Media container — sizes to the media's intrinsic aspect ratio.
          No surrounding dark wrapper, so a portrait reel doesn't leave
          dark bars on its left and right inside the lightbox. */}
      <div
        ref={dialogRef}
        className="relative max-w-full max-h-full flex flex-col items-center justify-center"
        style={{
          animation: "portfolioLightboxScaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          opacity: 0,
        }}
      >
        <div className="relative inline-flex flex-col items-center">
          {shouldResolveSocialVideo ? (
            socialResolved.state === "ready" && socialResolved.videoUrl ? (
              <video
                key={item.id}
                src={socialResolved.videoUrl}
                poster={socialResolved.posterUrl ?? undefined}
                controls
                autoPlay
                loop
                playsInline
                className="block rounded-xl"
                style={{
                  maxWidth: "min(100vw, 1280px)",
                  maxHeight: "calc(100vh - 180px)",
                  width: "auto",
                  height: "auto",
                }}
              />
            ) : socialResolved.state === "failed" ? (
              <ExternalMediaCard item={item} aspectRatio={aspectRatio} />
            ) : (
              <div
                className="relative rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  height: "min(calc(100vh - 180px), 78vh)",
                  aspectRatio,
                  maxWidth: "100vw",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div
                  className="animate-spin"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    border: "2px solid rgba(255,255,255,0.25)",
                    borderTopColor: "rgba(255,255,255,0.95)",
                  }}
                />
              </div>
            )
          ) : embedUrl ? (
            // YouTube / Vimeo serve adaptive streams that <video> can't play
            // natively, so they keep the iframe path with hidden chrome.
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                height: "min(calc(100vh - 180px), 78vh)",
                aspectRatio,
                maxWidth: "100vw",
              }}
            >
              <iframe
                key={item.id}
                src={embedUrl}
                title={item.title}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write; web-share"
                allowFullScreen
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
              />
            </div>
          ) : isVideo && isDirectMedia ? (
            <video
              key={item.id}
              src={item.media_url}
              controls
              autoPlay
              loop
              playsInline
              className="block rounded-xl"
              style={{
                maxWidth: "min(100vw, 1280px)",
                maxHeight: "calc(100vh - 180px)",
                width: "auto",
                height: "auto",
              }}
            />
          ) : !isVideo && isDirectMedia ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.media_url}
              alt={item.title}
              className="block rounded-xl"
              style={{
                maxWidth: "min(100vw, 1280px)",
                maxHeight: "calc(100vh - 180px)",
                width: "auto",
                height: "auto",
              }}
            />
          ) : (
            // Unrecognized external URL, no embed match — surface a clear
            // click-to-open card with the saved cover (if any) so the
            // visitor isn't staring at a broken-media icon.
            <ExternalMediaCard item={item} aspectRatio={aspectRatio} />
          )}
        </div>
      </div>

      {/* Local keyframes — keeps motion contained to the lightbox
          without polluting global CSS. Using a <style> tag is
          fine here because the modal is mounted/unmounted as a
          single subtree. */}
      <style jsx>{`
        @keyframes portfolioLightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes portfolioLightboxScaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body,
  );
}

/**
 * Fallback view when we can't render media directly (URL isn't an embeddable
 * platform AND isn't a direct media file). Shows the saved cover (if any)
 * plus a "Open original" button so visitors can still watch the content.
 */
function ExternalMediaCard({
  item,
  aspectRatio,
}: {
  item: PortfolioItem;
  aspectRatio: string;
}) {
  const cover = item.thumbnail_url;
  return (
    <div
      className="relative w-full mx-auto overflow-hidden rounded-xl"
      style={{
        aspectRatio,
        maxWidth: "min(100%, calc((100vh - 180px) * (16 / 9)))",
        maxHeight: "calc(100vh - 180px)",
        background:
          "linear-gradient(135deg, rgba(28,32,46,0.95), rgba(8,9,13,0.95))",
      }}
    >
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      )}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,9,13,0.2) 0%, rgba(8,9,13,0.85) 100%)",
        }}
      >
        <span className="font-sans uppercase text-[11px] tracking-[0.28em] text-cyan">
          External Media
        </span>
        <p className="font-sans text-white/85 text-sm md:text-base max-w-md leading-relaxed">
          This post lives on an external platform. Open the original to view
          it.
        </p>
        <a
          href={item.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans font-semibold text-sm bg-white text-[#08090d] hover:bg-[#e5e7eb] transition-colors"
        >
          Open original
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>
    </div>
  );
}
