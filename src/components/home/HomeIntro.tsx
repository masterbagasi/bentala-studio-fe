"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import HeroSection from "./HeroSection";
import { HeroData, Service, SocialLink, PortfolioItem } from "@/lib/types";

// Cap how many portfolio items we render as DOM tiles. With cycle
// 10s and 60 tiles, that's a fresh spawn every ≈165ms (≈6/sec —
// constant spam, no perceptible gap). Each tile still drifts
// across the viewport over 4–8.5s so the disappear-fade stays
// slow and deliberate. Avg ≈22 tiles visible at any one moment.
const TEASER_COUNT = 60;
// Four discrete speed buckets — assigned to each tile via `i % 4`.
// `lifetimeFraction` is what portion of the tile's own cycle (1 unit
// of itemsT) it stays visible for; `fadeExp` shapes the sin-curve
// opacity so very-slow tiles linger with a long ghost-tail and fast
// tiles snap-fade. The lifecycle scales (drift / scale / position)
// reuse the same `t = phase / lifetimeFraction` so a slow tile also
// drifts more gradually — not just a longer fade.
const SPEED_TIERS = [
  { lifetimeFraction: 0.85, fadeExp: 0.55 },  // 0 — very slow, long ghost tail (≈25.5s)
  { lifetimeFraction: 0.65, fadeExp: 0.9 },   // 1 — slow (≈19.5s)
  { lifetimeFraction: 0.55, fadeExp: 1.1 },   // 2 — medium (≈16.5s)
  { lifetimeFraction: 0.40, fadeExp: 1.4 },   // 3 — fastest tier, but still gentle (≈12s)
];
// Eight sectors covering the viewport. Each tile is assigned a
// sector via `i % SECTORS.length`, and the order is arranged so
// consecutive tiles land in spatially OPPOSITE sectors — tile 0
// top-left, tile 1 bottom-right, tile 2 top-right, tile 3 bottom-
// left, etc. That guarantees back-to-back spawns never head in the
// same direction; the cascade reads as a scatter, not a stream.
// Within each sector a tile's exact x / y is randomised by
// pseudoRand so tiles don't pile on one anchor.
const SECTORS: Array<{ xRange: [number, number]; yRange: [number, number] }> = [
  { xRange: [8, 38],  yRange: [6, 32] },   // 0 — top-left
  { xRange: [62, 92], yRange: [68, 94] },  // 1 — bottom-right (opp of 0)
  { xRange: [62, 92], yRange: [6, 32] },   // 2 — top-right
  { xRange: [8, 38],  yRange: [68, 94] },  // 3 — bottom-left (opp of 2)
  { xRange: [38, 62], yRange: [4, 22] },   // 4 — top-centre
  { xRange: [38, 62], yRange: [78, 96] },  // 5 — bottom-centre (opp of 4)
  { xRange: [3, 25],  yRange: [38, 62] },  // 6 — mid-left
  { xRange: [75, 97], yRange: [38, 62] },  // 7 — mid-right (opp of 6)
];
// Total scroll height of the hero block. Hero is sticky for this
// entire range. After the BG fade phase (first BG_PHASE_VH),
// the user keeps scrolling and the *next* sibling section
// (ServicesSpotlight) rises into the viewport from below.
// Because that sibling sits in normal flow at pageY = SCROLL_HEIGHT_VH,
// keeping these two values equal means the services section
// reaches viewport-top exactly when the hero un-sticks — clean handoff.
//
// Mobile uses a shorter total scroll (~35% less) so reaching the
// next section doesn't feel like a marathon on small viewports —
// every phase below is scaled proportionally.
const DESKTOP_SCROLL_HEIGHT_VH = 200;
const MOBILE_SCROLL_HEIGHT_VH = 100;
const DESKTOP_BG_PHASE_VH = 100;
const MOBILE_BG_PHASE_VH = 25;

// Auto cadence — itemsT advances this many units per second. With
// per-tile cycles of length 1 and TEASER_COUNT=30, 0.10 → 10s per
// cycle. Tiles spread evenly = a fresh spawn every ≈330ms (≈3/sec).
// Individual tile lifetimes (4–8.5s) keep the drift slow without
// feeling glacial; the fastest tier still takes 4s to traverse.
const ITEMS_AUTO_SPEED = 0.1;
const ITEMS_SCROLL_ACCEL = 0.002;

const ITEMS_TRIGGER_BG = 0.3;
const ITEMS_PRECHARGE_AT_BG_DONE = 0.3;

// "Dip to blur until it disappears" — driven by raw scroll distance
// inside the HomeIntro container, so the dip can straddle the bg
// fade phase (0–100vh) and the early services rise phase (100vh+)
// independently. Two things ramp in lockstep over the dip range:
//   • backdrop-filter: blur(...) — intensifying blur on the hero
//   • background-color rgba(8,9,13, alpha) — alpha → 1 makes the
//     layer fully opaque dark so the blurred hero disappears
// Tuning: peak (hero fully gone) lines up with the moment services
// has risen ~30% of the way into the viewport — that's the user's
// reference point for "this is where hero should already be gone".
const DESKTOP_DIP_PHASE_START_VH = 130;
const DESKTOP_DIP_PHASE_END_VH = 195;
const MOBILE_DIP_PHASE_START_VH = 5;
const MOBILE_DIP_PHASE_END_VH = 30;
const DIP_BLUR_MAX_PX = 24;


// Hero "safe zone" — the centered rectangle where the headline
// ("CREATE STORIES / BEYOND BORDERS") and the Start Collaboration
// CTA live. Tiles passing through this zone get a small lifecycle
// boost so they zip past the copy instead of lingering over it.
// Sized tight to the actual text + button bounds; feather kept
// generous so entry/exit ramps the boost smoothly.
const HERO_SAFE_ZONE = {
  cx: 50,
  cy: 50,
  halfW: 22, // covers ~ x: 28%..72% (headline + CTA width)
  halfH: 24, // covers ~ y: 26%..74% (headline top to CTA bottom)
  feather: 8, // wide feather → gradual boost ramp, no visible snap
};

/**
 * Returns 0..1 — how much to KILL the tile's opacity at (cx, cy).
 *   0 → no masking (outside safe zone)
 *   1 → fully masked (inside the core safe-zone rectangle)
 * The `feather` band turns the rectangle's edges into a soft
 * gradient so tiles smoothly fade as they cross into the zone
 * instead of popping invisible. Cheap per-tile per-frame math —
 * just two abs() + two ramps.
 */
function heroSafeZoneMask(cx: number, cy: number): number {
  const dx = Math.abs(cx - HERO_SAFE_ZONE.cx);
  const dy = Math.abs(cy - HERO_SAFE_ZONE.cy);
  const innerW = HERO_SAFE_ZONE.halfW - HERO_SAFE_ZONE.feather;
  const innerH = HERO_SAFE_ZONE.halfH - HERO_SAFE_ZONE.feather;
  const xMask =
    dx <= innerW
      ? 1
      : dx >= HERO_SAFE_ZONE.halfW
        ? 0
        : (HERO_SAFE_ZONE.halfW - dx) / HERO_SAFE_ZONE.feather;
  const yMask =
    dy <= innerH
      ? 1
      : dy >= HERO_SAFE_ZONE.halfH
        ? 0
        : (HERO_SAFE_ZONE.halfH - dy) / HERO_SAFE_ZONE.feather;
  return Math.min(xMask, yMask);
}

// Deterministic 0..1 pseudo-random keyed by (i, salt). Used to give
// each tile its own jitter / lifetime variation without introducing
// runtime randomness — same `i` always produces the same output, so
// SSR / hydrate stays consistent.
function pseudoRand(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt) * 43758.5453;
  return x - Math.floor(x);
}

interface Props {
  hero: HeroData;
  services: Service[];
  socialLinks: SocialLink[];
  portfolioItems: PortfolioItem[];
}

/**
 * The hero intro animation works by direct DOM mutation in a rAF
 * loop — no React state churn. React renders this component ONCE
 * on mount; the rAF then keeps writing `transform` / `opacity` to
 * each ref'd element. This keeps the per-frame cost in the browser
 * compositor instead of in React reconciliation.
 */
export default function HomeIntro({
  hero,
  services,
  socialLinks,
  portfolioItems,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgWrapperRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<Array<HTMLDivElement | null>>([]);

  const teaserItems = portfolioItems.slice(0, TEASER_COUNT);
  const N = teaserItems.length;

  // Per-tile config — built once and shared between render (for
  // size / aspect-ratio of each DOM tile) and the rAF loop (for
  // anchor x/y, sliceStart, lifetime, fadeExp). Random anchors
  // across the whole viewport mean tiles bunch up and overlap freely — the "bertumpuk"
  // density the brief asks for.
  const tileConfigs = useMemo(() => {
    // Spread tile sliceStart evenly across the cycle (i / N) plus a
    // small deterministic jitter. With TEASER_COUNT=30 the inter-
    // tile stride is 1/30 of the cycle ≈ 220ms — short enough that
    // spawns feel continuous (no perceptible "jeda" between content)
    // while each tile still owns its own slot.
    const stride = 1 / N;
    const ARS = ["3/4", "4/5", "1/1", "4/5", "3/4", "1/1", "16/9"];
    return Array.from({ length: N }, (_, i) => {
      const tier = SPEED_TIERS[i % SPEED_TIERS.length];
      const jitterRand = pseudoRand(i, 1.314);
      const xRand = pseudoRand(i, 5.111);
      const yRand = pseudoRand(i, 9.222);
      const sizeRand = pseudoRand(i, 13.7);
      const arRand = pseudoRand(i, 17.9);
      const sliceJitter = (jitterRand - 0.5) * 0.6 * stride;
      // Sector-based anchor — guarantees consecutive spawns end up
      // in spatially opposite sectors (top-left ↔ bottom-right,
      // etc.). Within the assigned sector, the exact x / y is
      // randomised by pseudoRand so tiles don't pile on one spot.
      const sector = SECTORS[i % SECTORS.length];
      const anchorX =
        sector.xRange[0] +
        xRand * (sector.xRange[1] - sector.xRange[0]);
      const anchorY =
        sector.yRange[0] +
        yRand * (sector.yRange[1] - sector.yRange[0]);
      // Sizes biased toward medium-large so each of the few tiles
      // on screen at once reads as a substantial frame: 25% extra-
      // large feature tile (22vw), 40% medium-large (17vw), 25%
      // medium (13vw), 10% small (10vw).
      const w =
        sizeRand < 0.25
          ? 22
          : sizeRand < 0.65
            ? 17
            : sizeRand < 0.9
              ? 13
              : 10;
      const ar = ARS[Math.floor(arRand * ARS.length)];
      return {
        sliceStart: i * stride + sliceJitter,
        tileLifetime: tier.lifetimeFraction,
        fadeExp: tier.fadeExp,
        anchor: { x: anchorX, y: anchorY, w, ar },
      };
    });
  }, [N]);

  // Mobile uses a shorter scroll height + tighter phase windows so
  // the user reaches the next section faster on small viewports.
  // SSR initial render assumes desktop (false); a client effect
  // updates on mount and on viewport resize.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const SCROLL_HEIGHT_VH = isMobile
    ? MOBILE_SCROLL_HEIGHT_VH
    : DESKTOP_SCROLL_HEIGHT_VH;
  const BG_PHASE_VH = isMobile ? MOBILE_BG_PHASE_VH : DESKTOP_BG_PHASE_VH;
  const SERVICES_PHASE_START_VH = BG_PHASE_VH;
  const SERVICES_PHASE_VH = SCROLL_HEIGHT_VH - BG_PHASE_VH;
  const DIP_PHASE_START_VH = isMobile
    ? MOBILE_DIP_PHASE_START_VH
    : DESKTOP_DIP_PHASE_START_VH;
  const DIP_PHASE_END_VH = isMobile
    ? MOBILE_DIP_PHASE_END_VH
    : DESKTOP_DIP_PHASE_END_VH;

  useEffect(() => {
    const container = containerRef.current;
    const bgWrapper = bgWrapperRef.current;
    if (!container || !bgWrapper) return;

    // tileConfigs is built once at component scope (useMemo) so
    // both render (size / aspect-ratio of each DOM tile) and this
    // rAF loop (anchor x/y, sliceStart, lifetime, fadeExp) share
    // exactly the same per-tile values.

    let bgP = 0;
    let dipP = 0;
    let itemsT = 0;
    let lastScrollY = window.scrollY;
    let lastFrameTime = performance.now();
    let rafId = 0;
    let inView = true;

    // Per-tile extra lifecycle progress accumulated while the tile
    // is inside the hero safe zone — pushes the tile further along
    // its drift curve so it visually "zips past" the headline + CTA
    // instead of lingering over them. Resets on re-spawn (phase
    // wrap) so each fresh cycle starts boost-free.
    const extraT = new Array(N).fill(0);
    const lastPhase = new Array(N).fill(0);
    // How aggressively the boost accumulates. Natural `t` advances
    // at ~0.04–0.08/s. A 0.5/s boost at full mask adds ~8–12× that
    // rate — noticeable speed-up while crossing the text, but small
    // enough per frame (≈0.008/frame at 60fps) that the position
    // delta stays smooth instead of teleporting.
    const SAFE_ZONE_BOOST_RATE = 0.5;

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    io.observe(container);

    // bg, services, and dip all derive from the same source — distance
    // the container has scrolled past the viewport top — but each
    // measures a different phase. bgP advances over BG_PHASE_VH
    // (zoom/fade), servicesP over SERVICES_PHASE_VH (rise progress),
    // and dipP over DIP_PHASE_START_VH→DIP_PHASE_END_VH (decoupled so
    // the disappearance can be tuned independently of bg/services).
    const computePhases = () => {
      const rect = container.getBoundingClientRect();
      const innerH = window.innerHeight;
      const bgPhaseDist = (BG_PHASE_VH / 100) * innerH;
      const servicesPhaseDist = (SERVICES_PHASE_VH / 100) * innerH;
      const servicesPhaseStart = (SERVICES_PHASE_START_VH / 100) * innerH;
      const dipPhaseStart = (DIP_PHASE_START_VH / 100) * innerH;
      const dipPhaseDist =
        ((DIP_PHASE_END_VH - DIP_PHASE_START_VH) / 100) * innerH;
      const scrolled = -rect.top;
      const bg = bgPhaseDist <= 0
        ? scrolled > 0 ? 1 : 0
        : Math.max(0, Math.min(1, scrolled / bgPhaseDist));
      const services = servicesPhaseDist <= 0
        ? 0
        : Math.max(
            0,
            Math.min(1, (scrolled - servicesPhaseStart) / servicesPhaseDist),
          );
      const dip = dipPhaseDist <= 0
        ? scrolled > dipPhaseStart ? 1 : 0
        : Math.max(0, Math.min(1, (scrolled - dipPhaseStart) / dipPhaseDist));
      return { bg, services, dip };
    };

    const applyStyles = (dtSec: number) => {
      // Bg layer — only reachable via the wrapper div we render below.
      // The wrapper is the parent of HeroSection's bg image; setting
      // transform on the wrapper effectively scales the hero bg.
      const bgEased = bgP * bgP;
      const bgScale = 1 + bgEased * 1.6;
      const bgOpacity = 1 - bgEased;
      bgWrapper.style.setProperty("--bg-scale", String(bgScale));
      bgWrapper.style.setProperty("--bg-opacity", String(bgOpacity));

      // Hero "dip to blur until it disappears" — dipP is computed
      // in computePhases from raw scroll distance, so the dip range
      // is decoupled from bgP / servicesP and can be tuned via the
      // DIP_PHASE_*_VH constants alone.
      bgWrapper.style.setProperty("--dip-blur", `${dipP * DIP_BLUR_MAX_PX}px`);
      bgWrapper.style.setProperty("--dip-bg-alpha", String(dipP));

      // `fadeFactor` is driven by bg progress: 1 when bg is fully
      // gone (items at full lifecycle), 0 when bg is back in place
      // (items collapsed to spawn state at centre). Multiplying the
      // tile's drift offset, scale, and opacity by this factor
      // makes the tiles smoothly shrink back toward the centre
      // they spawned from as the user scrolls up — mirroring the
      // emerge-from-centre animation in reverse.
      let fadeFactor: number;
      if (bgP <= ITEMS_TRIGGER_BG) {
        fadeFactor = 0;
      } else if (bgP >= 1) {
        fadeFactor = 1;
      } else {
        const p = (bgP - ITEMS_TRIGGER_BG) / (1 - ITEMS_TRIGGER_BG);
        fadeFactor = 1 - Math.pow(1 - p, 2); // ease-out
      }

      // Tile layer — each tile cycles independently on its own
      // 1-unit (in itemsT space) timeline. Phase wraps via mod 1 so
      // the cycle never "ends" globally; new spawns happen across
      // the cycle continuously, which reads as constant spam.
      for (let i = 0; i < N; i++) {
        const tile = tilesRef.current[i];
        if (!tile) continue;
        const cfg = tileConfigs[i];
        // Phase ∈ [0, 1) within this tile's own cycle.
        const phaseRaw = itemsT - cfg.sliceStart;
        const phase = ((phaseRaw % 1) + 1) % 1;

        // Reset boost on re-spawn — when phase wraps back to near 0
        // we're starting a fresh cycle, so any accumulated boost
        // from the previous traversal of the safe zone resets too.
        if (phase < lastPhase[i]) {
          extraT[i] = 0;
        }
        lastPhase[i] = phase;

        if (phase >= cfg.tileLifetime) {
          // Past the visible portion of own cycle — wait for re-spawn.
          tile.style.opacity = "0";
          tile.style.transform = "translate(-50%, -50%) scale(0)";
          continue;
        }

        // Normalised lifecycle progress (0 = just spawned, 1 = about
        // to vanish). Same shape as before; the per-tile lifetime
        // simply rescales how long the tile takes to traverse it,
        // and `fadeExp` warps the opacity sine curve. `extraT` is
        // a per-tile accumulator that pushes `t` forward whenever
        // the tile is inside the hero safe zone (added below after
        // we compute the tile's current position).
        const t = Math.min(1, phase / cfg.tileLifetime + extraT[i]);
        const anchor = cfg.anchor;

        // Continuous motion — tiles fly outward from centre, past
        // their anchor, then off the edge. Position and scale are
        // always changing.
        //   driftFrac: 0 → 1 (at anchor) → 2.6 (past edge)
        //   scale:     0 → 1 (at anchor) → 3
        //   opacity:   plateau-shaped — quick fade-in over the
        //              first 10% of life, fully opaque (1.0) in
        //              the middle, quick fade-out over the last
        //              10%. fadeExp shapes only the tail so we
        //              still get per-tile variety where it counts
        //              (snappy vs ghost-trail) without ever making
        //              the body of the tile semi-transparent and
        //              causing ugly see-through overlaps.
        const driftFrac = 1.4 * t + 1.2 * t * t;
        const scale = t + 2 * t * t;
        const FADE_EDGE = 0.1;
        let opacity: number;
        if (t < FADE_EDGE) {
          opacity = t / FADE_EDGE;
        } else if (t < 1 - FADE_EDGE) {
          opacity = 1;
        } else {
          opacity = Math.pow((1 - t) / FADE_EDGE, cfg.fadeExp);
        }

        // fadeFactor reverses the cascade when the user scrolls
        // back up — every tile collapses toward (50%, 50%) where it
        // spawned, shrinks to 0, fades to invisible.
        const cx = 50 + (anchor.x - 50) * driftFrac * fadeFactor;
        const cy = 50 + (anchor.y - 50) * driftFrac * fadeFactor;

        // Hero safe-zone speed boost — if this tile is currently
        // overlapping the headline + CTA rectangle, advance its
        // lifecycle forward this frame. Boost is proportional to
        // the feathered mask, so a tile drifting toward the edge of
        // the zone accelerates GENTLY as it enters, peaks while
        // deepest inside, and tapers off as it exits. Visually:
        // tiles appear from centre as before, then "zip past" the
        // text instead of lingering over it.
        const safeMask = heroSafeZoneMask(cx, cy);
        if (safeMask > 0 && fadeFactor > 0) {
          // Square the mask so the boost ramps up smoothly through
          // the feather band (gentle at the edges, full strength
          // only deep inside the zone). Combined with the small
          // boost rate this keeps the position delta sub-pixel per
          // frame at the borders — no snap.
          extraT[i] += dtSec * SAFE_ZONE_BOOST_RATE * safeMask * safeMask;
        }

        // Single GPU-composited transform — no `left/top` writes per
        // frame because each one triggers a full layout reflow and
        // is the #1 cause of jank when 20+ tiles animate at once.
        // The tile's render keeps `left:50%, top:50%` (static) so
        // translate3d(...vw, ...vh) moves it by viewport-percent
        // offsets without touching layout. translate(-50%, -50%)
        // centres on its own size; scale() resizes around that
        // centre. Order: rightmost transform applies first (scale
        // → centre-shift → vw/vh offset).
        const tx = cx - 50;
        const ty = cy - 50;
        const s = scale * fadeFactor;
        tile.style.opacity = String(opacity * fadeFactor);
        tile.style.transform = `translate3d(${tx}vw, ${ty}vh, 0) translate(-50%, -50%) scale(${s})`;
      }
    };

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);

      if (!inView) {
        lastFrameTime = now;
        return;
      }

      // Cap dt at 50ms (≈ 20fps) so a tab-blur / GC pause / first
      // frame doesn't suddenly leap the lifecycle forward and cause
      // visible jumps. On a healthy 60fps tab dt sits around 16ms,
      // well under the cap.
      const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      const phases = computePhases();
      const newBg = phases.bg;
      bgP = newBg;
      dipP = phases.dip;

      if (newBg < ITEMS_TRIGGER_BG) {
        itemsT = 0;
      } else {
        // Items active. Apply the linear "pre-charge" floor only
        // while bg is still mid-fade — guarantees first tiles
        // appear in sync with bg fade-out.
        if (newBg < 1) {
          const overlapP =
            (newBg - ITEMS_TRIGGER_BG) / (1 - ITEMS_TRIGGER_BG);
          const linearItemsT = overlapP * ITEMS_PRECHARGE_AT_BG_DONE;
          if (linearItemsT > itemsT) itemsT = linearItemsT;
        }
        // Always auto-advance over time as long as items are active.
        // Critical: the cascade keeps cycling when idle, regardless
        // of exact bg progress (so floating-point edge cases like
        // bgP = 0.999 don't freeze the animation).
        itemsT += dt * ITEMS_AUTO_SPEED;
      }

      applyStyles(dt);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollY;
      lastScrollY = y;

      if (bgP >= 1 && dy > 0) {
        itemsT += dy * ITEMS_SCROLL_ACCEL;
      }
    };

    // Prime the styles once before the rAF loop kicks in.
    applyStyles(0);
    rafId = requestAnimationFrame(tick);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
    // isMobile flips the phase constants captured by closure above —
    // re-run the effect on breakpoint change so scroll math matches
    // the new container height.
  }, [
    N,
    tileConfigs,
    BG_PHASE_VH,
    SERVICES_PHASE_VH,
    SERVICES_PHASE_START_VH,
    DIP_PHASE_START_VH,
    DIP_PHASE_END_VH,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative bg-bg"
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
    >
      {/* On md+ the hero is `position: fixed` — locked to the
          viewport so the headline / CTA stay perfectly still while
          the rAF loop drives bg + dip progress over the 200vh
          container. ServicesSpotlight (z-10) paints over the still-
          fixed hero on handoff.
          On mobile the hero is just `relative h-screen` (in normal
          flow). The user's scroll moves hero up naturally and the
          following ServicesSpotlight section follows immediately
          underneath — no rising-from-bottom rise, no blank-black
          dipped band, no scroll-to-top wait. */}
      <div className="relative h-screen w-full md:fixed md:top-0 md:left-0 md:right-0 md:overflow-hidden md:z-0">
        {/* Wrapper that owns the --bg-scale / --bg-opacity custom
            properties. HeroSection's bg picks them up via bgStyle. */}
        <div
          ref={bgWrapperRef}
          className="contents"
          style={
            {
              "--bg-scale": "1",
              "--bg-opacity": "1",
              "--dip-blur": "0px",
              "--dip-bg-alpha": "0",
            } as React.CSSProperties
          }
        >
          <HeroSection
            hero={hero}
            services={services}
            socialLinks={socialLinks}
            bgStyle={{
              transform: "scale(var(--bg-scale, 1))",
              opacity: "var(--bg-opacity, 1)" as unknown as number,
              transformOrigin: "center center",
              willChange: "transform, opacity",
            }}
            dipOverlayStyle={{
              backgroundColor: "rgba(8, 9, 13, var(--dip-bg-alpha, 0))",
              backdropFilter: "blur(var(--dip-blur, 0px))",
              WebkitBackdropFilter: "blur(var(--dip-blur, 0px))",
              willChange: "background-color, backdrop-filter",
            }}
          >
            {teaserItems.map((item, i) => {
              const anchor = tileConfigs[i].anchor;
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    tilesRef.current[i] = el;
                  }}
                  className="absolute rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: `${anchor.w}vw`,
                    aspectRatio: anchor.ar,
                    opacity: 0,
                    transform: "translate(-50%, -50%) scale(0)",
                    transformOrigin: "center center",
                    zIndex: i,
                    willChange: "transform, opacity",
                  }}
                >
                  <Image
                    src={item.thumbnail_url ?? item.media_url}
                    alt={item.title}
                    fill
                    sizes={`${anchor.w}vw`}
                    className="object-cover"
                  />
                </div>
              );
            })}
          </HeroSection>
        </div>
      </div>
    </div>
  );
}
