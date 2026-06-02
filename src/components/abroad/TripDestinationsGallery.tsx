"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { TripLocation } from "@/lib/types";

interface Props {
  locations: TripLocation[];
}

/**
 * "Places We'll Visit" gallery — image-bleed cards with a frosted
 * glass insert at the bottom for the title + description. Cards
 * alternate vertical offset on the desktop layout so the row reads
 * like a staggered editorial spread rather than a flat 4-up grid.
 * Inspired by the Leonardo AI reference: bold media first, copy
 * tucked into a translucent panel inside the same card.
 */
export default function TripDestinationsGallery({ locations }: Props) {
  if (!locations || locations.length === 0) return null;

  return (
    <section className="px-5 md:px-[52px] pt-16 md:pt-36 pb-16 md:pb-36">
      <div className="mb-10 md:mb-14 flex flex-col items-center text-center">
        <h2
          className="font-sans uppercase font-bold text-white leading-[0.98] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 4.4vw, 56px)" }}
        >
          Places We&apos;ll Visit
        </h2>
      </div>

      {/* Responsive grid — collapses to fewer columns at each smaller
          breakpoint so cards don't get crushed on mobile. The desktop
          "all destinations in one row" layout (column count tracks
          the destination count) only kicks in at lg+. Below that we
          step down progressively: 3 cols at md, 2 cols at sm, 1 col
          on phones. */}
      <div className="trip-dest-grid grid gap-4 md:gap-6 lg:gap-8">
        {locations.map((loc, i) => (
          <DestinationCard
            key={`${loc.name}-${i}`}
            location={loc}
            index={i}
            revealDelay={i * 90}
            totalCount={locations.length}
          />
        ))}
      </div>
      <style jsx>{`
        .trip-dest-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .trip-dest-grid {
            grid-template-columns: repeat(
              ${Math.min(2, locations.length)},
              minmax(0, 1fr)
            );
          }
        }
        @media (min-width: 768px) {
          .trip-dest-grid {
            grid-template-columns: repeat(
              ${Math.min(3, locations.length)},
              minmax(0, 1fr)
            );
          }
        }
        @media (min-width: 1024px) {
          .trip-dest-grid {
            grid-template-columns: repeat(
              ${locations.length},
              minmax(0, 1fr)
            );
          }
        }
      `}</style>
    </section>
  );
}

function DestinationCard({
  location,
  index,
  revealDelay,
  totalCount,
}: {
  location: TripLocation;
  index: number;
  revealDelay: number;
  totalCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

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
      { threshold: 0.18 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Stagger only kicks in when there are 3+ cards in the row — 1-2
  // cards stay flush so their top + bottom edges line up. With more
  // cards the offset distance scales down so it doesn't dominate.
  const isOffset = index % 2 === 1;
  const offsetClass =
    totalCount <= 2
      ? "lg:mt-0"
      : totalCount === 3
        ? isOffset
          ? "lg:mt-12 xl:mt-16"
          : "lg:mt-0"
        : isOffset
          ? "lg:mt-6 xl:mt-10"
          : "lg:mt-0";

  // Typography scales inversely with card width — wider cards (low
  // count) get a bigger title, narrower cards (high count) shrink
  // the title to keep it readable. Sizes track the page's unified
  // type scale (Title-L / Title-M / Title-S / Body-S) so the row's
  // typography stays in lockstep with the rest of the page.
  const titleSize =
    totalCount <= 2
      ? "clamp(20px, 1.8vw, 28px)"
      : totalCount === 3
        ? "clamp(17px, 1.5vw, 22px)"
        : totalCount === 4
          ? "clamp(15px, 1.2vw, 19px)"
          : "clamp(13px, 1vw, 15px)";

  return (
    <div
      ref={ref}
      className={`group relative w-full ${offsetClass}`}
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(28px)",
        transitionDelay: revealed ? `${revealDelay}ms` : undefined,
        transition:
          "transform 800ms cubic-bezier(0.22, 1, 0.36, 1), opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        className="relative w-full overflow-hidden rounded-[28px]"
        style={{
          // 1-2 destinations read as landscape banners (cinematic
          // pairing); 3+ collapse to portrait so the row's rhythm
          // and density stay readable.
          aspectRatio: totalCount <= 2 ? "16 / 9" : "3 / 4",
          background: "rgba(20, 22, 32, 0.9)",
          boxShadow:
            "0 20px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <Image
          src={location.image_url}
          alt={location.name}
          fill
          sizes={
            totalCount <= 2
              ? "(max-width: 768px) 100vw, 50vw"
              : totalCount === 3
                ? "(max-width: 768px) 100vw, 33vw"
                : "(max-width: 768px) 100vw, 25vw"
          }
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        />
        {/* Bottom darken so the glass insert reads even on bright
            images. Pointer-events-none so the user can still click
            anywhere on the card if we wire that later. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,9,13,0) 35%, rgba(8,9,13,0.45) 75%, rgba(8,9,13,0.78) 100%)",
          }}
        />

        {/* Glass copy panel — sits in the lower portion of the card.
            Padding scales with card density so narrow cards aren't
            crammed by oversized insets. */}
        <div
          className={`absolute rounded-2xl ${
            totalCount >= 5
              ? "left-2.5 right-2.5 bottom-2.5 px-3 py-3"
              : totalCount === 4
                ? "left-3 right-3 bottom-3 px-3.5 py-3.5 md:px-4 md:py-4"
                : "left-4 right-4 bottom-4 px-5 py-5 md:px-6 md:py-6"
          }`}
          style={{
            background: "rgba(15, 18, 28, 0.55)",
            backdropFilter: "blur(18px) saturate(160%)",
            WebkitBackdropFilter: "blur(18px) saturate(160%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 10px 30px -12px rgba(0,0,0,0.45)",
          }}
        >
          <h3
            className="font-sans font-bold text-white leading-tight tracking-[-0.005em]"
            style={{ fontSize: titleSize }}
          >
            {location.name}
          </h3>
        </div>
      </div>
    </div>
  );
}
