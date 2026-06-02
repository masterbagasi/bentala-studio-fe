"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TermItem {
  /** Short clause title shown in the list card (the click target). */
  title: string;
  /** Optional long-form body shown in the popup. Empty for legacy
   *  single-line entries — the popup still opens, just shows the
   *  title without an extra paragraph. */
  body: string;
}

interface Props {
  /** Intro paragraph rendered in the LEFT column. Falls back to a
   *  default Bentala message when null/empty so the section always
   *  has something to anchor the heading. */
  description?: string | null;
  /** Structured clause list — preferred source. When non-empty,
   *  `legacyText` is ignored. */
  items?: TermItem[];
  /** Legacy free-form T&C text from `bsi_abroad_settings.terms_conditions`
   *  (or the per-trip column). Parsed by `parseTerms()` only when
   *  `items` is empty so old data keeps rendering. */
  legacyText?: string | null;
}

const DEFAULT_DESCRIPTION =
  "Kami percaya kerja sama yang baik dimulai dari pemahaman yang jelas. Semua ketentuan dirancang untuk melindungi kedua belah pihak dan memastikan proyek berjalan lancar.";

/**
 * Parse the admin's free-form T&C textarea into structured clauses.
 *   • Modern format (preferred): items separated by a blank line;
 *     within each item the FIRST line is the title, subsequent
 *     lines are the body.
 *   • Legacy format: each line is its own title-only clause (no
 *     popup body). Detected automatically when no blank line exists.
 * Leading "1.", "2)" numbering is stripped from titles so the
 * public-facing numbering (rendered separately in the row) doesn't
 * double up.
 */
function parseTerms(raw: string): TermItem[] {
  const text = raw.trim();
  if (!text) return [];

  // Modern multi-line format — blank line separates items.
  if (/\n\s*\n/.test(text)) {
    return text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        const title = (lines[0] ?? "").replace(/^\s*\d+[.)]\s+/, "");
        const body = lines.slice(1).join(" ").trim();
        return { title, body };
      })
      .filter((item) => item.title.length > 0);
  }

  // Legacy single-line format — each line is a title-only clause.
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => ({
      title: l.replace(/^\s*\d+[.)]\s+/, ""),
      body: "",
    }));
}

/**
 * Terms & Conditions section — editorial 2-column spread.
 *   LEFT  : heading + admin-customisable intro description.
 *   RIGHT : card with numbered list. Each row shows only the
 *           clause TITLE and is clickable; clicking opens a popup
 *           with the full body text.
 *
 * Data sources, in priority order:
 *   1. `items` prop (structured clauses from the admin's new editor)
 *   2. `parseTerms(legacyText)` (best-effort parse of the old free-
 *      form `terms_conditions` text so existing data keeps working)
 */
export default function TripTermsConditions({
  description,
  items: itemsProp,
  legacyText,
}: Props) {
  const items =
    itemsProp && itemsProp.length > 0
      ? itemsProp
      : parseTerms(legacyText ?? "");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (items.length === 0) return null;

  const descriptionText = description?.trim() || DEFAULT_DESCRIPTION;

  return (
    <section className="px-5 md:px-[52px] pt-16 md:pt-36 pb-16 md:pb-36">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] gap-10 lg:gap-16 items-start">
        {/* LEFT — heading + intro stacked naturally near the top of
            the column so the eye reads heading → description in one
            beat. The earlier `justify-between` pushed the paragraph
            all the way to the bottom of the column, leaving an
            awkward void between heading and copy. With the grid now
            on `items-start` both columns simply start at the top and
            the description sits right below the heading where it
            belongs. */}
        <div className="flex flex-col gap-5 md:gap-6 py-2 md:py-3 items-center text-center lg:items-start lg:text-left">
          <h2
            className="font-sans uppercase font-bold text-white leading-[0.98] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4.4vw, 56px)" }}
          >
            Terms <span className="text-cyan">&</span> Conditions
          </h2>
          <p
            className="font-sans text-white/70 leading-[1.6] max-w-[48ch] whitespace-pre-line"
            style={{ fontSize: "clamp(17px, 1.4vw, 22px)" }}
          >
            {descriptionText}
          </p>
        </div>

        {/* RIGHT — discrete clickable cards. Outer wrapper dropped:
            with each clause now its own card, an additional bounding
            frame felt like nested boxes. 2-column grid at lg+ when
            there are 4+ clauses, single column for short lists. */}
        <ol className="grid grid-cols-2 gap-2.5 md:gap-4">
          {items.map((item, i) => (
            <TermRow
              key={i}
              num={String(i + 1).padStart(2, "0")}
              title={item.title}
              index={i}
              onClick={() => setOpenIdx(i)}
            />
          ))}
        </ol>
      </div>

      {openIdx !== null && (
        <TermPopup
          items={items}
          initialIdx={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </section>
  );
}

function TermRow({
  num,
  title,
  index,
  onClick,
}: {
  num: string;
  title: string;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
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

  return (
    <li
      ref={ref}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(10px)",
        transitionDelay: revealed ? `${index * 60}ms` : undefined,
        transition:
          "opacity 600ms cubic-bezier(0.22, 1, 0.36, 1), transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full relative grid grid-cols-[auto_1fr] gap-3 md:gap-5 items-center text-left transition-all duration-200"
        style={{
          padding: "16px 14px 16px 16px",
          borderRadius: 18,
          background: hovered
            ? "linear-gradient(180deg, rgba(11,61,231,0.14) 0%, rgba(20,22,32,0.85) 100%)"
            : "linear-gradient(180deg, rgba(20,22,32,0.92) 0%, rgba(11,13,20,0.86) 100%)",
          border: `1px solid ${
            hovered ? "rgba(11,61,231,0.4)" : "rgba(255,255,255,0.07)"
          }`,
          boxShadow: hovered
            ? "0 18px 40px -18px rgba(11,61,231,0.45), 0 0 0 1px rgba(11,61,231,0.18) inset"
            : "0 14px 32px -20px rgba(0,0,0,0.55)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          cursor: "pointer",
        }}
      >
        <span
          className="font-sans font-bold text-cyan tabular-nums leading-none select-none"
          style={{ fontSize: "clamp(20px, 1.8vw, 28px)" }}
        >
          {num}
        </span>

        <span
          className="font-sans font-semibold leading-[1.4]"
          style={{
            fontSize: "clamp(14.5px, 1.15vw, 17px)",
            color: hovered ? "#ffffff" : "rgba(255,255,255,0.92)",
            transition: "color 200ms",
          }}
        >
          {title}
        </span>

      </button>
    </li>
  );
}

/**
 * Modal carousel popup. Opens with a scale-up + fade entrance,
 * then shows ALL T&C clauses as a slideable strip — the active
 * one fills the viewport area, dots below show position (filled
 * circle = active, outlined = others). Visitor can navigate via:
 *   • Click a dot to jump
 *   • Click ←/→ arrow buttons
 *   • Swipe horizontally on touch devices
 *   • Keyboard arrow keys
 * Portal-mounted to <body> so the modal escapes any ancestor
 * stacking context. ESC + backdrop click close.
 */
/**
 * Number of copies of the items array rendered side-by-side inside
 * the coverflow strip. Setting it to 5 gives ±12 raw distance headroom
 * (centre copy + 2 on each side × items.length), so the user can fire
 * Prev/Next many times in succession before any silent recenter has
 * to kick in.
 */
const POPUP_REPEATS = 5;
const POPUP_CENTER_COPY = Math.floor(POPUP_REPEATS / 2);
/** Duration of the slide transition. Recenter scheduled just after. */
const POPUP_TRANSITION_MS = 520;

function TermPopup({
  items,
  initialIdx,
  onClose,
}: {
  items: TermItem[];
  initialIdx: number;
  onClose: () => void;
}) {
  const total = items.length;
  // `renderActiveIdx` lives in the EXPANDED render space (0 …
  // total*REPEATS-1). Prev/Next just decrement / increment this raw
  // number, so going prev from the "first" item smoothly slides the
  // deck LEFT into the previous copy's last item instead of cutting
  // to the far-right card. The actual item shown is derived via
  // modulo so dots / external API stay 0-based.
  const [renderActiveIdx, setRenderActiveIdx] = useState(
    POPUP_CENTER_COPY * total + initialIdx,
  );
  const [transitionsEnabled, setTransitionsEnabled] = useState(true);
  const activeIdx = ((renderActiveIdx % total) + total) % total;

  const stripRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const goPrev = useCallback(() => setRenderActiveIdx((p) => p - 1), []);
  const goNext = useCallback(() => setRenderActiveIdx((p) => p + 1), []);
  /** Jump to a specific item by index — picks the closest render
   *  position so the slide animates the shortest distance. */
  const goToItem = useCallback(
    (j: number) => {
      setRenderActiveIdx((p) => {
        const k = Math.round((p - j) / total);
        return j + k * total;
      });
    },
    [total],
  );

  // After each navigation the slide animates for ~520ms; once it
  // finishes, silently snap `renderActiveIdx` back to the centre copy
  // (transitions off, single rAF tick) so the user can keep stepping
  // in either direction indefinitely without the deck wandering off
  // toward the render-array boundaries.
  useEffect(() => {
    const middleCenter = POPUP_CENTER_COPY * total + activeIdx;
    if (renderActiveIdx === middleCenter) return;
    const timer = setTimeout(() => {
      setTransitionsEnabled(false);
      setRenderActiveIdx(middleCenter);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionsEnabled(true));
      });
    }, POPUP_TRANSITION_MS + 40);
    return () => clearTimeout(timer);
  }, [renderActiveIdx, activeIdx, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, items.length, goPrev, goNext]);

  // Touch swipe — drag horizontally past ~60px threshold to advance
  // / retreat. Below threshold the strip springs back to active.
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const dx = touchDeltaX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="term-popup-title"
    >
      {/* Backdrop fades in independently from the card so the layered
          entrance reads cleanly. */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm tnc-fade-in"
        onClick={onClose}
      />

      {/* Prev / Next arrows pinned to the SCREEN edges (not the strip
          edges) so they're always clickable — with the deck spreading
          wide across the viewport, putting the arrows inside the
          ~500px strip would bury them under the side cards. Bright
          Bentala-blue fill + outer glow makes them read instantly as
          primary CTAs against the dark backdrop. They sit above every
          card via z-50. */}
      {items.length > 1 && (
        <>
          <NavArrow
            direction="prev"
            onClick={goPrev}
            ariaLabel="Previous clause"
          />
          <NavArrow
            direction="next"
            onClick={goNext}
            ariaLabel="Next clause"
          />
        </>
      )}

      {/* Coverflow layout — arrow row on top, pagination dots BELOW
          (outside the card chrome) so they don't compete with the
          card's body content. Wrapping in a flex-column keeps both
          parts centred under each other. */}
      <div
        className="relative flex flex-col items-center gap-6 sm:gap-7 tnc-fade-in"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
      {/* Carousel stage — strip stays at the previous compact size,
          but the items array is rendered 3× so a deep stack of cards
          fans out behind the active sheet (each subsequent card a
          touch smaller and more offset). Arrows are absolute-
          positioned over the strip's left/right edges so they don't
          steal width from the card. */}
      <div
        className="relative tnc-pop-in"
        style={{
          width: "min(86vw, 500px)",
          height: "clamp(220px, 36vh, 340px)",
        }}
      >
        {/* Coverflow stage — the items list is rendered 3× so a deep
            stack of cards fans out behind the active sheet. The middle
            copy hosts the "active" slot. Each visual slot maps back to
            a real item via `slotIdx % items.length`, so clicks on side
            cards still navigate to the original item index. */}
        <div ref={stripRef} className="absolute inset-0">
          {(() => {
            const slots: number[] = Array.from(
              { length: total * POPUP_REPEATS },
              (_, idx) => idx,
            );
            return slots.map((renderIdx) => {
              const sourceIdx = renderIdx % total;
              const item = items[sourceIdx];
              const distance = renderIdx - renderActiveIdx;
              const absDist = Math.abs(distance);
              const isActive = absDist === 0;

              // Wide sweep — each subsequent card slides further out
              // so the deck spreads across the full viewport, with the
              // furthest cards crossing beyond the screen edges. ±5
              // cards stay visible; beyond that they fade to 0.
              const offsetPercent = distance * 70;
              const scale = isActive
                ? 1
                : Math.max(0.5, 0.92 - (absDist - 1) * 0.06);
              const blur = isActive
                ? 0
                : Math.min(7, 1.5 + (absDist - 1) * 1.1);
              const opacity = isActive
                ? 1
                : absDist > 5
                  ? 0
                  : Math.max(0.35, 1 - (absDist - 1) * 0.14);

              const num = String(sourceIdx + 1).padStart(2, "0");

              return (
                <div
                  key={renderIdx}
                  role={isActive ? undefined : "button"}
                  onClick={
                    isActive ? undefined : () => setRenderActiveIdx(renderIdx)
                  }
                  aria-hidden={!isActive}
                  className="absolute inset-0 rounded-[20px] border overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(20,22,32,0.98) 0%, rgba(11,13,20,0.98) 100%)",
                    borderColor: isActive
                      ? "rgba(11,61,231,0.55)"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: isActive
                      ? "0 0 0 1px rgba(11,61,231,0.35), 0 0 32px rgba(11,61,231,0.28), 0 24px 60px -16px rgba(0,0,0,0.7)"
                      : "0 12px 40px -16px rgba(0,0,0,0.55)",
                    transform: `translateX(${offsetPercent}%) scale(${scale})`,
                    filter: `blur(${blur}px)`,
                    opacity,
                    zIndex: 40 - absDist,
                    pointerEvents: absDist > 5 ? "none" : "auto",
                    cursor: isActive ? "default" : "pointer",
                    transition: transitionsEnabled
                      ? "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), filter 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), border-color 320ms ease, box-shadow 320ms ease"
                      : "none",
                  }}
                >
                  {/* Close button — only on the active card (side
                      cards are decorative previews + jump-targets). */}
                  {isActive && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full text-white/55 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
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
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}

                  <div className="h-full flex flex-col px-6 sm:px-7 py-6 sm:py-7">
                    <div className="flex items-baseline gap-3 mb-4">
                      <span
                        className="font-sans font-bold text-cyan tabular-nums leading-none select-none"
                        style={{ fontSize: "clamp(22px, 2vw, 30px)" }}
                      >
                        {num}
                      </span>
                      <h3
                        id={isActive ? "term-popup-title" : undefined}
                        className="font-sans font-bold text-white leading-[1.2] tracking-[-0.01em]"
                        style={{ fontSize: "clamp(18px, 1.6vw, 24px)" }}
                      >
                        {item.title}
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1">
                      {item.body ? (
                        <p
                          className="font-sans text-white/80 leading-[1.65] whitespace-pre-line"
                          style={{ fontSize: "clamp(15px, 1.25vw, 18px)" }}
                        >
                          {item.body}
                        </p>
                      ) : (
                        <p
                          className="font-sans text-white/55 leading-[1.65] italic"
                          style={{ fontSize: "clamp(15px, 1.25vw, 18px)" }}
                        >
                          Tidak ada keterangan lanjutan untuk klausul ini.
                        </p>
                      )}
                    </div>

                  </div>
                </div>
              );
            });
          })()}
        </div>

      </div>

      {/* Pagination dots — OUTSIDE the card row, sitting below the
          coverflow. No divider line above; the dots themselves
          provide the rhythm. */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2.5">
          {items.map((_, j) => {
            const dotActive = j === activeIdx;
            return (
              <button
                key={j}
                type="button"
                onClick={() => goToItem(j)}
                aria-label={`Go to clause ${j + 1}`}
                aria-current={dotActive ? "true" : undefined}
                className="rounded-full transition-all duration-300"
                style={{
                  width: dotActive ? 12 : 8,
                  height: dotActive ? 12 : 8,
                  background: dotActive ? "#0B3DE7" : "transparent",
                  border: `1.5px solid ${
                    dotActive ? "#0B3DE7" : "rgba(255,255,255,0.32)"
                  }`,
                  boxShadow: dotActive
                    ? "0 0 12px rgba(11,61,231,0.6)"
                    : "none",
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>
      )}
      </div>

      <style jsx>{`
        @keyframes tncFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes tncPopIn {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        :global(.tnc-fade-in) {
          animation: tncFadeIn 260ms ease-out both;
        }
        :global(.tnc-pop-in) {
          animation: tncPopIn 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: center center;
        }
      `}</style>
    </div>,
    document.body,
  );
}

/**
 * Bright Bentala-blue circular arrow button used to navigate the
 * T&C carousel popup. Pinned to the viewport edge, with a strong
 * outer glow + inner highlight so it reads instantly as the primary
 * CTA against the dark backdrop and the dim card stack behind it.
 * Hover lifts + intensifies the glow; active press tucks back in.
 */
function NavArrow({
  direction,
  onClick,
  ariaLabel,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  ariaLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isPrev = direction === "prev";
  const sideClass = isPrev
    ? "left-4 sm:left-8 md:left-10"
    : "right-4 sm:right-8 md:right-10";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      aria-label={ariaLabel}
      className={`absolute top-1/2 ${sideClass} z-50 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full text-white tnc-fade-in`}
      style={{
        transform: `translateY(-50%) translateX(${
          pressed ? 0 : hovered ? (isPrev ? -3 : 3) : 0
        }px) scale(${pressed ? 0.94 : hovered ? 1.05 : 1})`,
        background:
          "linear-gradient(135deg, #0B3DE7 0%, #1849F0 55%, #2D5DF5 100%)",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: hovered
          ? "0 0 0 1px rgba(255,255,255,0.12) inset, 0 0 32px rgba(11,61,231,0.7), 0 18px 44px -10px rgba(11,61,231,0.7), 0 6px 18px rgba(0,0,0,0.4)"
          : "0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 18px rgba(11,61,231,0.42), 0 14px 36px -12px rgba(11,61,231,0.55), 0 4px 12px rgba(0,0,0,0.4)",
        transition:
          "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease",
      }}
    >
      {/* Subtle outer halo ring — sits behind the button face, softly
          pulsing on hover so the eye is drawn to the affordance. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(11,61,231,0.35) 0%, rgba(11,61,231,0) 75%)",
          opacity: hovered ? 1 : 0.55,
          transition: "opacity 240ms ease",
        }}
      />
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: "relative", zIndex: 1 }}
      >
        {isPrev ? (
          <path d="M15 18l-6-6 6-6" />
        ) : (
          <path d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
}
