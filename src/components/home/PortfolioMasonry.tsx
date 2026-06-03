"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { PortfolioItem } from "@/lib/types";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import PortfolioLightbox from "@/components/portfolio/PortfolioLightbox";
import {
  PORTFOLIO_MIN_COL_WIDTH,
  PORTFOLIO_GAP,
  PORTFOLIO_BATCH_SIZE_MULTIPLIER,
} from "@/lib/constants";

interface Props {
  items: PortfolioItem[];
  // Landscape header image URL — uploaded via admin and stored on
  // bsi_hero.portfolio_header_image_url. Falls back to the file
  // sitting in /public when the column is empty.
  headerImageUrl?: string | null;
  /** Pin the category filter to a single value (e.g. "intl" on the
   *  Abroad Production detail page) and hide the filter pills. The
   *  banner and "All / Video / Photo / …" tabs are skipped entirely;
   *  the masonry shows the matching items only. */
  lockedFilter?: string;
  /** Hide the sticky header banner (uploaded landscape image + filter
   *  pills slab). Useful when the masonry is reused outside the home
   *  page and the host route already provides its own hero. */
  hideHeader?: boolean;
}

const PORTFOLIO_HEADER_FALLBACK = "/portfolio-header.png";

// Horizontal gutter for the entire Portfolio section. Matches the
// Navbar gutter (`px-5 md:px-[52px]`) so the banner, filter tabs,
// and bento grid all sit on the same alignment line as the rest of
// the page chrome.
const SECTION_PAD_MOBILE = 20;
const SECTION_PAD_DESKTOP = 52;
const MOBILE_BREAKPOINT = 768;

function getSectionPaddingX(): number {
  if (typeof window === "undefined") return SECTION_PAD_DESKTOP;
  return window.innerWidth < MOBILE_BREAKPOINT
    ? SECTION_PAD_MOBILE
    : SECTION_PAD_DESKTOP;
}

interface PackedTile {
  item: PortfolioItem;
  col: number;
  row: number;
  /** Columns the tile spans. Usually 1 (square) or 2 (wide); the final row's
   *  tiles may stretch wider to close the last gap with no holes. */
  colSpan: number;
  /** Rows the tile spans. 1 (square/wide) or 2 (tall/portrait). */
  rowSpan: number;
}

/**
 * Three tile classes:
 *
 *   wide   → 2 cols × 1 row   (landscape)
 *   square → 1 col  × 1 row
 *   tall   → 1 col  × 2 rows  (portrait)
 */
type TileSize = "wide" | "tall" | "square";

/**
 * Auto-assign a tile size to every item for visual variety, IGNORING the
 * stored `aspect_ratio`. This keeps the bento balanced no matter what gets
 * uploaded — even when every source is portrait 9:16 — so the grid never
 * collapses into a single uniform shape.
 *
 * Rules:
 *   • Videos → wide. A video reads as landscape footage, so it anchors the
 *     2-col tiles. (Collapsed to the tall/square stream on ≤2-col layouts,
 *     where a wide tile would span the whole row.)
 *   • Everything else alternates tall / square toward a ~55% tall share,
 *     spread evenly (never streaked) via an integer accumulator.
 *
 * The assignment is a pure function of each item's POSITION in the
 * (newest-first) stream and its media_type — never of the running total —
 * so appending more items during infinite scroll never resizes the tiles
 * already on screen (no reflow / flicker).
 */
const TALL_SHARE = 0.55;

function assignSizes(
  items: PortfolioItem[],
  colCount: number,
): { item: PortfolioItem; size: TileSize }[] {
  const allowWide = colCount > 2;
  let nv = 0; // running index within the non-wide stream — stable per item
  return items.map((item) => {
    if (item.media_type === "video" && allowWide) {
      return { item, size: "wide" as TileSize };
    }
    const isTall =
      Math.floor((nv + 1) * TALL_SHARE) - Math.floor(nv * TALL_SHARE) === 1;
    nv++;
    return { item, size: (isTall ? "tall" : "square") as TileSize };
  });
}

function getColCount(): number {
  const total = window.innerWidth - getSectionPaddingX() * 2;
  return Math.max(2, Math.floor((total + PORTFOLIO_GAP) / (PORTFOLIO_MIN_COL_WIDTH + PORTFOLIO_GAP)));
}

function getColWidth(colCount: number): number {
  if (typeof window === "undefined") return PORTFOLIO_MIN_COL_WIDTH;
  const total = window.innerWidth - getSectionPaddingX() * 2;
  return Math.floor((total - (colCount - 1) * PORTFOLIO_GAP) / colCount);
}

/**
 * In-order, reading-order packer — guarantees a hole-free bento.
 *
 * Items arrive newest-first and are placed in exactly that order, cell by
 * cell, left→right then top→bottom: the newest piece lands top-left and age
 * grows toward the bottom-right. No type-interleaving, no forward-pulling —
 * the visible sequence equals the fetch order.
 *
 * Sizes come from assignSizes(). Hole-free is guaranteed by four rules:
 *   • Every free cell of a row is filled before moving on, so mid-grid gaps
 *     cannot occur.
 *   • A `wide` that can't fit two cells (row end / occupied neighbour) is
 *     shrunk to a square in place — order is never disturbed.
 *   • A `tall` is only started while more than one row of items remains, so
 *     the final row never carries downward overhang it can't close.
 *   • The final row's leftover columns are absorbed by widening that row's
 *     own tiles to tile it exactly (see the closing pass below).
 */
function packBento(items: PortfolioItem[], colCount: number): PackedTile[] {
  if (colCount <= 0) return [];

  const sized = assignSizes(items, colCount);

  const grid: boolean[][] = [];
  const isOccupied = (r: number, c: number) => grid[r]?.[c] === true;
  const markOccupied = (r: number, c: number) => {
    while (grid.length <= r) grid.push(new Array(colCount).fill(false));
    grid[r][c] = true;
  };

  const placed: PackedTile[] = [];
  let qi = 0;
  let row = 0;

  while (qi < sized.length) {
    for (let col = 0; col < colCount && qi < sized.length; col++) {
      if (isOccupied(row, col)) continue;
      const { item } = sized[qi];
      let size = sized[qi].size;
      const remaining = sized.length - qi; // items still to place, incl. this

      // Keep the final row free of downward overhang so it can always be
      // closed: only start a tall while more than one row of items remains.
      if (size === "tall" && remaining <= colCount) size = "square";
      // A wide needs two free cells in this row; otherwise shrink in place
      // so the reading order is never broken.
      if (size === "wide" && (col + 1 >= colCount || isOccupied(row, col + 1))) {
        size = "square";
      }

      const colSpan = size === "wide" ? 2 : 1;
      const rowSpan = size === "tall" ? 2 : 1;
      for (let dc = 0; dc < colSpan; dc++) markOccupied(row, col + dc);
      if (rowSpan === 2) markOccupied(row + 1, col);

      placed.push({ item, col, row, colSpan, rowSpan });
      qi++;
    }
    row++;
  }

  // ── Close the final row, no holes ──────────────────────────
  // After the in-order pass every row but the last is full. The last row may
  // have leftover columns on the right of each contiguous free segment
  // (segments are split only by talls overhanging from the row above). We
  // absorb each segment's leftover by widening that segment's own tiles to
  // tile it exactly — so the row is full, never centred-with-gaps.
  if (placed.length > 0) {
    const lastRow = placed.reduce((m, t) => Math.max(m, t.row), 0);
    const rowTiles = placed
      .filter((t) => t.row === lastRow)
      .sort((a, b) => a.col - b.col);

    // Snapshot overhang columns (occupied by a tall from lastRow-1, i.e. not
    // owned by any tile that starts on this row) before mutating spans.
    const overhang: boolean[] = [];
    for (let cc = 0; cc < colCount; cc++) {
      overhang[cc] =
        isOccupied(lastRow, cc) &&
        !rowTiles.some((t) => t.col <= cc && cc < t.col + t.colSpan);
    }

    // Walk the row in contiguous non-overhang segments and re-tile each so
    // its own tiles fill it exactly, left-to-right.
    let c = 0;
    while (c < colCount) {
      if (overhang[c]) {
        c++;
        continue;
      }
      const segStart = c;
      while (c < colCount && !overhang[c]) c++;
      const segWidth = c - segStart;
      const segTiles = rowTiles
        .filter((t) => t.col >= segStart && t.col < segStart + segWidth)
        .sort((a, b) => a.col - b.col);
      if (segTiles.length === 0) continue;

      const base = Math.floor(segWidth / segTiles.length);
      const extra = segWidth % segTiles.length;
      let cur = segStart;
      segTiles.forEach((t, i) => {
        const w = base + (i < extra ? 1 : 0);
        t.col = cur;
        t.colSpan = w;
        cur += w;
      });
    }
  }

  return placed;
}

function PortfolioCard({
  tile,
  rowHeight,
  priority = false,
  index,
  onOpen,
}: {
  tile: PackedTile;
  rowHeight: number;
  priority?: boolean;
  index: number;
  onOpen: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const delay = Math.min(index * 35, 600);
  const { item, col, row, colSpan, rowSpan } = tile;

  const cellHeight =
    rowSpan === 2 ? rowHeight * 2 + PORTFOLIO_GAP : rowHeight;

  // If neither thumbnail nor media_url points at something next/image can
  // actually render (e.g. an Instagram post URL with no cover saved), skip
  // the broken-image attempt and show a styled placeholder instead.
  const tileSrc = item.thumbnail_url ?? item.media_url;
  const tileSrcLikelyRenderable =
    /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/i.test(tileSrc) ||
    /\.supabase\.co\//.test(tileSrc) ||
    /(^|\.)ytimg\.com\//.test(tileSrc);
  const showFallback = imageFailed || !tileSrcLikelyRenderable;
  // Skip the shimmer when we're about to render the static fallback —
  // there's no image load to wait on.
  useEffect(() => {
    if (showFallback) setLoaded(true);
  }, [showFallback]);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${item.title}`}
      className="relative rounded-lg overflow-hidden group card-enter cursor-pointer text-left"
      style={{
        gridColumnStart: col + 1,
        gridColumnEnd: `span ${colSpan}`,
        gridRowStart: row + 1,
        gridRowEnd: `span ${rowSpan}`,
        height: cellHeight,
        animationDelay: `${delay}ms`,
        // Reset native button chrome — borderless, no default focus
        // outline (custom focus-visible ring below).
        background: "transparent",
        border: "none",
        padding: 0,
      }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <div
          className={`absolute inset-0 shimmer rounded-lg transition-opacity duration-500 ${
            loaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />

        {showFallback ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-lg px-4 text-center"
            style={{
              background:
                "linear-gradient(135deg, #1a1d28 0%, #0f1118 60%, #080a10 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span
              aria-hidden
              className="font-display text-[clamp(28px,5vw,56px)] leading-none text-white/15 select-none"
            >
              {item.title.charAt(0).toUpperCase()}
            </span>
            <span className="font-sans uppercase text-[10px] tracking-[0.24em] text-cyan mt-3">
              {item.media_type === "video" ? "Tap to play" : item.tag || "View"}
            </span>
          </div>
        ) : (
          <Image
            src={tileSrc}
            alt={item.title}
            fill
            priority={priority}
            sizes={
              colSpan >= 2
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            }
            className={`object-cover rounded-lg transition-transform duration-500 ease-out
              group-hover:scale-[1.05]
              ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setLoaded(true);
              setImageFailed(true);
            }}
          />
        )}

        {/* Hover overlay — dark scrim + caption + view-icon. Fades
            in only on hover so the grid surface stays clean. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,9,13,0) 30%, rgba(8,9,13,0.78) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none"
        >
          <div className="min-w-0">
            {item.tag && (
              <span className="block font-sans text-[9px] md:text-[10px] tracking-[0.22em] uppercase text-cyan mb-1">
                {item.tag}
              </span>
            )}
            <span className="block font-sans uppercase font-semibold text-white text-sm md:text-base leading-tight tracking-tight truncate">
              {item.title}
            </span>
          </div>
          <span
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full text-white"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(6px)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7M3 3v7M3 3l7 7" />
              <path d="M21 21h-7M21 21v-7M21 21l-7-7" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  );
}

export default function PortfolioMasonry({
  items,
  headerImageUrl,
  lockedFilter,
  hideHeader,
}: Props) {
  const [activeFilter, setActiveFilter] = useState(lockedFilter ?? "all");
  const [displayedItems, setDisplayedItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [colCount, setColCount] = useState(0);
  const [rowHeight, setRowHeight] = useState(PORTFOLIO_MIN_COL_WIDTH);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // Compact mode: once the sticky portfolio header is pinned at the very
  // top of the viewport, shrink the banner and pull the filter pills up
  // so there's more room to browse the grid.
  const [compact, setCompact] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<PortfolioItem[]>([]);
  const batchIndexRef = useRef(0);

  // Resolve effective categories per item. Newer rows have a
  // `categories` array (an item can live under multiple filter
  // tabs); legacy rows still on the single-`category` schema fall
  // back to `[category]` so they render under their original tab.
  const getFiltered = useCallback(
    (filter: string) =>
      filter === "all"
        ? items
        : items.filter((i) => {
            const cats =
              i.categories && i.categories.length > 0 ? i.categories : [i.category];
            return cats.includes(filter);
          }),
    [items]
  );

  const loadBatch = useCallback(() => {
    const cols = typeof window !== "undefined" ? getColCount() : 4;
    const batchSize = cols * PORTFOLIO_BATCH_SIZE_MULTIPLIER;
    const start = batchIndexRef.current * batchSize;
    const batch = poolRef.current.slice(start, start + batchSize);
    if (batch.length === 0) {
      setHasMore(false);
      return;
    }
    batchIndexRef.current++;
    setDisplayedItems((prev) => [...prev, ...batch]);
    if (batchIndexRef.current * batchSize >= poolRef.current.length) setHasMore(false);
  }, []);

  // Filter change → atomic swap.
  //
  // Earlier this routine ran `setDisplayedItems([])` and then loaded
  // the first batch on a 80ms timeout. That intermediate empty
  // state collapsed the bento grid to zero height for one frame,
  // which dropped the total page height enough that the browser
  // clamped the user's scrollY — effectively scrolling them to
  // the top, well above the portfolio section.
  //
  // Doing a single direct swap keeps the grid populated at all
  // times, so page height stays stable and the user remains
  // anchored at the portfolio section (the sticky filter pills
  // stay where they were).
  useEffect(() => {
    const filtered = getFiltered(activeFilter);
    poolRef.current = filtered;

    const cols = typeof window !== "undefined" ? getColCount() : 4;
    const batchSize = cols * PORTFOLIO_BATCH_SIZE_MULTIPLIER;
    const firstBatch = filtered.slice(0, batchSize);

    batchIndexRef.current = 1;
    setDisplayedItems(firstBatch);
    setHasMore(filtered.length > batchSize);
  }, [activeFilter, getFiltered]);

  // Infinite scroll
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setLoading(true);
          setTimeout(() => {
            loadBatch();
            setLoading(false);
          }, 350);
        }
      },
      { rootMargin: "500px" }
    );
    observer.observe(loader);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadBatch, hasMore]);

  // Responsive grid metrics
  useEffect(() => {
    const recalc = () => {
      const cols = getColCount();
      setColCount(cols);
      setRowHeight(getColWidth(cols));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const packedTiles = useMemo(
    () => packBento(displayedItems, colCount),
    [displayedItems, colCount],
  );

  // Auto-snap the Portfolio section to the top of the viewport
  // when the user scrolls past the last service block (KOL
  // Specialist). Tight trigger zone + cooldown + far re-arm
  // boundary prevent the snap from re-firing on small scroll
  // jitter or wheel oscillation.
  const portfolioSnapRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let raf = 0;
    let snapAnimRaf = 0;
    let lastY = window.scrollY;
    let snapping = false;
    let armed = true;
    let lastSnapTime = 0;

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
      const section = portfolioSnapRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      const scrollingDown = window.scrollY > lastY;
      const now = performance.now();

      // Tight snap zone — only fire when section's top is in the
      // 15%-70% band of the viewport from the top. Outside that
      // the user is either still inside services (top > 70%) or
      // already committed past portfolio header (top < 15%).
      const inSnapZone =
        rect.top > viewportH * 0.15 && rect.top < viewportH * 0.7;

      // Cooldown — once a snap fires, ignore re-triggers for
      // 1500ms so wheel momentum + minor up-down jitter can't
      // re-pull the section. This is the single biggest source
      // of bug reports with snap UX.
      const cooledDown = now - lastSnapTime > 1500;

      if (
        scrollingDown &&
        armed &&
        !snapping &&
        cooledDown &&
        inSnapZone
      ) {
        armed = false;
        lastSnapTime = now;
        animateScrollTo(window.scrollY + rect.top, 450);
      }

      // Re-arm only after the user has clearly left the snap zone.
      // The "clearly" buffer (10% of viewport on each side) keeps
      // jitter at the boundary from flipping armed on/off and
      // triggering repeated snaps.
      const clearlyOutOfZone =
        rect.top < -viewportH * 0.1 || rect.top > viewportH * 0.95;
      if (!armed && !snapping && clearlyOutOfZone) {
        armed = true;
      }
      lastY = window.scrollY;
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    }

    const onWheel = (e: WheelEvent) => {
      if (snapping) e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (snapping) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
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

  // Drive compact mode from scroll position. Anchored to the section's
  // `offsetTop` (the banner lives INSIDE the section, so shrinking it
  // never changes offsetTop) rather than getBoundingClientRect — that
  // decoupling is what kills the jitter: the trigger point can't move
  // when the banner resizes, so it never flip-flops. rAF throttles and
  // an 80px hysteresis band keeps the toggle from chattering at the
  // boundary. When the page is too short to ever pin the header (few
  // The banner always STARTS at full size and only shrinks once the
  // user scrolls the header up to the top. The section carries a
  // min-height (below) so even a short grid has enough scroll room to
  // reach this trigger — so it shrinks "in any condition" without ever
  // starting small.
  useEffect(() => {
    const section = portfolioSnapRef.current;
    if (!section || hideHeader) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // The header pins at the top once scrollY reaches `pin`
      // (section.offsetTop). The banner stays FULL at that moment and
      // only collapses after the user keeps scrolling past it: engage
      // 160px beyond the pin, release at 40px — the gap is a hysteresis
      // band that stops the toggle from chattering.
      const pin = section.offsetTop;
      setCompact((prev) =>
        prev ? window.scrollY >= pin + 40 : window.scrollY >= pin + 160,
      );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hideHeader]);

  const filters = [
    { key: "all", label: "All" },
    { key: "video", label: "Video" },
    { key: "photo", label: "Photo" },
    { key: "design", label: "Design" },
    { key: "intl", label: "International" },
  ];

  const heroHeader = headerImageUrl ?? PORTFOLIO_HEADER_FALLBACK;

  return (
    <section
      ref={portfolioSnapRef}
      className="bg-bg"
      id="portfolio"
      // Guarantee enough scroll room PAST the pin point so the banner
      // can first arrive full-size and then collapse on further scroll,
      // even when the grid is short (few items). Extra 240px covers the
      // post-pin engage distance + a little headroom.
      style={hideHeader ? undefined : { minHeight: "calc(100svh + 240px)" }}
    >
      {/* Header — banner with auto-focus on the actual object inside
          the uploaded image. PortfolioBanner scans the file to find
          the bounding box of non-transparent / non-white pixels,
          then positions the bg so that bounding box exactly fills
          the container — zero whitespace, no matter how much
          padding the source PNG has. */}
      {/* Sticky portfolio header — slab pins at top-0 so its solid
          bg-bg actually extends UP UNDER the navbar (z-999 paints
          over). That extension is what stops portfolio tiles from
          bleeding through the navbar's backdrop-blur: the blur
          sees the slab's solid color, not the grid.
          pt-[124px] = 108px navbar height (64px logo + 22px×2
          padding) + 16px breathing room. The banner sits right
          below the navbar instead of leaving a wide gap, so the
          sticky resting position reads tighter to the top.
          pb-8 md:pb-12 keeps the bottom gap between filter pills
          and the grid as part of the pinned slab. */}
      {!hideHeader && (
        <div
          className={`sticky top-0 z-40 bg-bg pt-[124px] transition-[padding] duration-500 ease-out ${
            compact ? "pb-4 md:pb-5" : "pb-8 md:pb-12"
          }`}
        >
          <RevealOnScroll className="block">
            <div className="px-5 md:px-[52px]">
              {/* Banner shrinks (and centers) once the header is pinned;
                  height follows its aspect ratio, so the filter row below
                  rises with it. */}
              <div
                className="mx-auto transition-[max-width] duration-500 ease-out"
                // Compact banner stays noticeably WIDER than the filter
                // bar (max-w-3xl = 768px) so it still reads as the hero,
                // just smaller. Full width until the scroll trigger.
                style={{ maxWidth: compact ? "min(80%, 1080px)" : "100%" }}
              >
                <PortfolioBanner src={heroHeader} />
              </div>
            </div>
          </RevealOnScroll>
          {!lockedFilter && (
            <RevealOnScroll className="block" delay={180}>
              <div
                className={`cinematic-reveal px-5 md:px-[52px] transition-[margin] duration-500 ease-out ${
                  compact ? "mt-3 md:mt-4" : "mt-8 md:mt-12"
                }`}
              >
                <div className="slate-cta-group flex items-stretch gap-1 p-1.5 rounded-full border border-white/[0.12] bg-white/[0.02] max-w-3xl mx-auto">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      aria-pressed={activeFilter === f.key}
                      className={`flex-1 font-sans text-body-sm tracking-[0.03em] capitalize px-3 py-2.5 rounded-full cursor-pointer transition-all duration-200 ${
                        activeFilter === f.key
                          ? "bg-cyan text-white font-bold shadow-[0_4px_24px_rgba(11,61,231,0.25)]"
                          : "bg-transparent text-dim hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          )}
        </div>
      )}

      {/* Bento — fixed sizes per ratio class. Packer defers tall tiles
          when they'd strand row partners, so any unfilled cells end up
          at the trailing edge of the gallery rather than mid-grid. */}
      {colCount > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
            gridAutoRows: `${rowHeight}px`,
            gap: `${PORTFOLIO_GAP}px`,
            padding: `0 ${getSectionPaddingX()}px`,
          }}
        >
          {packedTiles.map((tile, index) => (
            <PortfolioCard
              key={tile.item.id}
              tile={tile}
              rowHeight={rowHeight}
              priority={index < 4}
              index={index}
              onOpen={() => {
                // The lightbox indexes into displayedItems (the
                // master list), not packedTiles (which has the
                // same items in the same order). Find by id to
                // stay correct if the packer ever reorders.
                const i = displayedItems.findIndex(
                  (it) => it.id === tile.item.id,
                );
                if (i >= 0) setPreviewIndex(i);
              }}
            />
          ))}
        </div>
      )}

      <div ref={loaderRef} className="pb-4">
        {hasMore && (
          <div className="flex items-center justify-center gap-3 py-14 opacity-40">
            <div className="flex gap-[6px]">
              <div className="loader-dot" />
              <div className="loader-dot" style={{ animationDelay: "0.2s" }} />
              <div className="loader-dot" style={{ animationDelay: "0.4s" }} />
            </div>
            <span className="font-sans text-meta tracking-[0.12em] uppercase text-dim">
              Loading more
            </span>
          </div>
        )}
      </div>

      <PortfolioLightbox
        item={previewIndex !== null ? displayedItems[previewIndex] ?? null : null}
        onClose={() => setPreviewIndex(null)}
        hasPrev={previewIndex !== null && previewIndex > 0}
        hasNext={
          previewIndex !== null && previewIndex < displayedItems.length - 1
        }
        onPrev={() =>
          setPreviewIndex((i) => (i !== null && i > 0 ? i - 1 : i))
        }
        onNext={() =>
          setPreviewIndex((i) =>
            i !== null && i < displayedItems.length - 1 ? i + 1 : i,
          )
        }
      />
    </section>
  );
}

/**
 * Auto-focus banner. Loads the source image on mount, scans the
 * pixels to find the bounding box of actual content (non-transparent
 * AND non-near-white), then positions the image as a CSS background
 * so that bounding box exactly fills the container — zero
 * whitespace around the object regardless of how much padding the
 * source PNG has.
 *
 * If the image fails CORS or the scan finds nothing, falls back to
 * a plain `background-size: cover` render.
 */
function PortfolioBanner({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<{
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    w: number;
    h: number;
  } | null>(null);

  const [bgStyle, setBgStyle] = useState<React.CSSProperties>({
    backgroundImage: `url(${src})`,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    aspectRatio: "16 / 3",
  });

  // Recompute bg-size, bg-position AND aspectRatio from current
  // bounds. Container's aspect ratio is set to match the detected
  // bounds aspect, so the image's content rectangle fills the
  // container exactly — no crop, no whitespace. Stable identity
  // (ref'd) so it can be reused from both the image-load callback
  // and the resize observer.
  const recalc = useRef(() => {
    const bounds = boundsRef.current;
    if (!bounds) return;
    const { minX, minY, maxX, maxY, w, h } = bounds;
    const boundsW = maxX - minX;
    const boundsH = maxY - minY;
    if (boundsW <= 0 || boundsH <= 0) return;

    // Image scaled so bounds rectangle fills the container
    // perfectly. Because we set the container's aspect ratio to
    // match the bounds aspect ratio (boundsW / boundsH), this is
    // a single uniform scale — no cover/contain trade-off.
    //   bg-size width-percent  = (w / boundsW) * 100
    //   bg-size height-percent = (h / boundsH) * 100
    //   bg-position x-percent  = minX / (w - boundsW) * 100
    //   bg-position y-percent  = minY / (h - boundsH) * 100
    const bgSizeW = (w / boundsW) * 100;
    const bgSizeH = (h / boundsH) * 100;
    const bgPosX = w === boundsW ? 50 : (minX / (w - boundsW)) * 100;
    const bgPosY = h === boundsH ? 50 : (minY / (h - boundsH)) * 100;

    setBgStyle({
      backgroundImage: `url(${src})`,
      backgroundSize: `${bgSizeW}% ${bgSizeH}%`,
      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
      backgroundRepeat: "no-repeat",
      // Container takes on the bounds' own aspect ratio so the
      // image fills end-to-end without distortion or cropping.
      aspectRatio: `${boundsW} / ${boundsH}`,
    });
  });

  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      if (naturalW === 0 || naturalH === 0) return;

      const canvas = document.createElement("canvas");
      canvas.width = naturalW;
      canvas.height = naturalH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let data: ImageData;
      try {
        ctx.drawImage(img, 0, 0);
        data = ctx.getImageData(0, 0, naturalW, naturalH);
      } catch {
        // Cross-origin taint — skip the optimisation, leave the
        // cover fallback in place.
        return;
      }

      const isContent = (i: number) => {
        const r = data.data[i];
        const g = data.data[i + 1];
        const b = data.data[i + 2];
        const a = data.data[i + 3];
        // Treat near-white as background too (covers JPEGs without
        // alpha as well as PNGs with transparent padding).
        return a > 20 && (r < 240 || g < 240 || b < 240);
      };

      let minX = naturalW;
      let minY = naturalH;
      let maxX = 0;
      let maxY = 0;
      // STEP=2 keeps the scan reasonably fast for huge files (a
      // 6000×3375 image is ~5M iterations — under 200ms typically).
      const STEP = 2;
      for (let y = 0; y < naturalH; y += STEP) {
        for (let x = 0; x < naturalW; x += STEP) {
          if (isContent((y * naturalW + x) * 4)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX >= maxX || minY >= maxY) return; // no content found

      // Exact bounds — the leftmost/rightmost content pixels sit
      // flush against the container edges so the banner's content
      // line aligns precisely with the bento grid's leftmost and
      // rightmost tile edges below it.
      boundsRef.current = {
        minX,
        minY,
        maxX,
        maxY,
        w: naturalW,
        h: naturalH,
      };
      recalc.current();
    };

    img.onerror = () => {
      // keep fallback
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Recompute on container resize so the focus stays correct across
  // viewport changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => recalc.current());
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={bgStyle}
      role="img"
      aria-label="Portfolio"
    />
  );
}
