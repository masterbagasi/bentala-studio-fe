"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AbroadProductionTrip } from "@/lib/types";
import { trackEvent } from "@/lib/tracker";

interface Props {
  trips: AbroadProductionTrip[];
}

const SLIDE_INTERVAL_MS = 6000;

/**
 * Abroad Production — upcoming on-location shoots the studio is taking
 * bookings for. Rendered as a single landscape banner (matching the
 * page's horizontal padding so its left/right margins line up with
 * every other section). Auto-rotates through the published trips, and
 * clicking the banner opens that trip's configured link in a new tab.
 */
export default function AbroadProduction({ trips }: Props) {
  const router = useRouter();
  // `activeIndex` runs 0..trips.length (inclusive). The slot at
  // `trips.length` is a clone of the first slide so the leftward
  // animation can continue past the real last slide and visually
  // arrive back at the first — at which point we snap the track
  // back to index 0 without animation. This avoids the "rewind"
  // motion you'd otherwise see when wrapping back to start.
  const [activeIndex, setActiveIndex] = useState(0);
  const [animateTrack, setAnimateTrack] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  // Auto-advance. Pauses while the cursor is hovering the banner so
  // the visitor has time to read the caption; resumes once the cursor
  // leaves the area.
  useEffect(() => {
    if (trips.length <= 1) return;
    if (isHovered) return;
    const id = window.setInterval(() => {
      setAnimateTrack(true);
      setActiveIndex((i) => i + 1);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [trips.length, isHovered]);

  // When the track lands on the trailing clone of the first slide,
  // snap the track back to the real first slide on the next frame
  // (without animation) so subsequent ticks continue advancing left
  // from there. The end-user only sees continuous leftward motion.
  const handleTrackTransitionEnd = () => {
    if (activeIndex >= trips.length) {
      setAnimateTrack(false);
      setActiveIndex(0);
      // Restore animation on the frame after the snap so the next
      // scheduled tick animates correctly.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateTrack(true));
      });
    }
  };

  // Scroll-driven scale-down. As the visitor scrolls the banner section
  // out of the viewport (toward the Services section below), the banner
  // gradually shrinks and fades — so the hand-off into the next section
  // feels like a cinematic camera pull-back rather than an abrupt cut.
  useEffect(() => {
    const section = sectionRef.current;
    const banner = bannerRef.current;
    if (!section || !banner) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Progress = 0 while the section's top is at or below viewport top;
      // = 1 once the section's bottom has cleared the top of the viewport.
      // We only animate while the section is on-screen but starting to
      // leave; staying inside the viewport keeps the banner at full size.
      const raw = (-rect.top) / Math.max(1, rect.height - vh * 0.4);
      const progress = Math.min(1, Math.max(0, raw));
      // Tween scale 1 → 0.86 and opacity 1 → 0.55 over the section's
      // outbound scroll. CSS handles the smoothing via `will-change`.
      const scale = 1 - progress * 0.14;
      const opacity = 1 - progress * 0.45;
      banner.style.transform = `scale(${scale.toFixed(4)})`;
      banner.style.opacity = opacity.toFixed(3);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  if (!trips || trips.length === 0) return null;

  // `displayedTrips` is the source-of-truth for what the track renders:
  // the real trips + a trailing clone of the first one used as the
  // wrap-around landing point. The caption always reads from the *real*
  // trip (mod trips.length) so the clone slot still shows the right
  // text mid-animation.
  const displayedTrips = trips.length > 1 ? [...trips, trips[0]] : trips;
  const realIndex = trips.length > 0 ? activeIndex % trips.length : 0;
  const activeTrip = trips[realIndex] ?? trips[0];

  const handleOpen = (trip: AbroadProductionTrip) => {
    void trackEvent(
      "cta_click",
      `abroad_production_banner:${trip.country}`,
    );
    // Navigate to the internal detail page. Prefer the admin-set slug;
    // when missing (e.g. legacy row pre-migration) derive one from the
    // country name so the click never lands on a broken URL. Last
    // resort: skip the click entirely.
    const slug =
      trip.slug?.trim() ||
      trip.country
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    if (!slug) return;
    router.push(`/abroad-production/${slug}`);
  };

  return (
    <section
      ref={sectionRef}
      id="abroad-production"
      className="relative w-full md:min-h-screen flex items-center px-5 md:px-[52px] py-14 md:py-20"
    >
      {/* Banner shell — relative wrapper so the prev / next arrow nav
          buttons can overlap the rounded edges of the banner itself.
          w-full so the parent's `flex items-center` (vertical centering)
          still leaves the banner stretching the full content width.
          `will-change: transform` hints the browser to compositor-layer
          the banner so the scroll-driven scale stays at 60fps. */}
      <div
        ref={bannerRef}
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          willChange: "transform, opacity",
          transformOrigin: "center center",
          transition:
            "transform 200ms ease-out, opacity 200ms ease-out",
        }}
      >
      <button
        type="button"
        onClick={() => handleOpen(activeTrip)}
        aria-label={`Open trip detail: ${activeTrip.country}`}
        disabled={!activeTrip.country && !activeTrip.slug}
        className="group relative block w-full overflow-hidden rounded-2xl"
        style={{
          aspectRatio: "16 / 9",
          background: "rgba(8,9,13,1)",
          border: "none",
          padding: 0,
          cursor: (activeTrip.slug || activeTrip.country) ? "pointer" : "default",
        }}
      >
        {/* Slide track — all trips + a trailing clone of the first sit
            in a row. The track translates left by `activeIndex × slot%`
            so each auto-rotate moves the current image off to the left
            while the next one slides in from the right. When the track
            reaches the clone, `handleTrackTransitionEnd` snaps it back
            to index 0 without animation so the leftward motion never
            "rewinds". */}
        <div
          className="absolute inset-0 flex"
          onTransitionEnd={handleTrackTransitionEnd}
          style={{
            width: `${displayedTrips.length * 100}%`,
            transform: `translateX(-${activeIndex * (100 / displayedTrips.length)}%)`,
            transition: animateTrack
              ? "transform 900ms cubic-bezier(0.65, 0, 0.35, 1)"
              : "none",
          }}
        >
          {displayedTrips.map((trip, i) => (
            <div
              key={`${trip.id}-${i}`}
              aria-hidden={i !== activeIndex}
              className="relative flex-shrink-0 h-full"
              style={{ width: `${100 / displayedTrips.length}%` }}
            >
              <Image
                src={trip.image_url}
                alt={trip.country}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* Slide indicator dots — passive, only visible when more than
            one trip is published. The active pill reads from `realIndex`
            so it correctly reflects which *real* trip is on screen even
            when the track is mid-way through the wrap-around clone. */}
        {trips.length > 1 && (
          <div
            className="absolute bottom-5 md:bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none"
            aria-hidden
          >
            {trips.map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-500"
                style={{
                  width: i === realIndex ? 28 : 8,
                  height: 4,
                  background:
                    i === realIndex
                      ? "rgba(255,255,255,0.95)"
                      : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Prev / Next nav arrows — circular chevron buttons floating over
          the banner edges. Rendered only when there's more than one trip
          so a single-slot section stays clean. */}
      {trips.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => {
              setAnimateTrack(true);
              // Step back one slot. When stepping "back" from the first
              // slide, jump-without-animation to the trailing clone, then
              // animate from clone → previous-real-trip on the next frame.
              if (activeIndex === 0) {
                setAnimateTrack(false);
                setActiveIndex(trips.length);
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setAnimateTrack(true);
                    setActiveIndex(trips.length - 1);
                  });
                });
              } else {
                setActiveIndex((i) => i - 1);
              }
            }}
            aria-label="Previous trip"
            className="absolute top-1/2 -translate-y-1/2 left-3 md:left-5 flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-full transition-transform duration-200 hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.96)",
              color: "#08090d",
              border: "none",
              boxShadow:
                "0 14px 36px -8px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)",
              cursor: "pointer",
              zIndex: 5,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setAnimateTrack(true);
              setActiveIndex((i) => i + 1);
            }}
            aria-label="Next trip"
            className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-full transition-transform duration-200 hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.96)",
              color: "#08090d",
              border: "none",
              boxShadow:
                "0 14px 36px -8px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)",
              cursor: "pointer",
              zIndex: 5,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}
      </div>
    </section>
  );
}
