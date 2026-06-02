"use client";

import { ReactNode } from "react";

interface Props {
  /** Tiny accent label above the headline. Optional. */
  eyebrow?: string;
  /** Big page heading. Accepts JSX so the caller can compose
   *  multi-line markup with <br>, <em>, etc. Optional — when
   *  omitted, the hero renders only the banner. */
  title?: ReactNode;
  /** Banner image rendered as a 16:3 cinematic strip at the very
   *  top of the hero. When null, the hero opens straight into the
   *  eyebrow + giant headline with no banner. */
  bannerImageUrl?: string | null;
}

/**
 * Editorial fashion-magazine hero — modeled on a Gauchère-style
 * cover spread, translated into Bentala's dark + electric-blue
 * tone:
 *
 *   • Massive condensed display headline ("OUR VISION") that
 *     spans the full container width and dominates the upper half
 *   • Editorial micro-annotations placed AROUND the headline at
 *     specific anchor points (top-right cover blurb, hanging
 *     captions left + bottom-right) — reads like a print spread
 *   • Brand wordmark centered as the "masthead" between the
 *     top nav strip and the giant headline
 *   • Lower spread: portrait B&W photo left, body paragraph in
 *     the centre, secondary smaller portrait far right
 *   • Oversized ghost year ("2024") behind the body, anchored
 *     bottom — same trick as the reference's "2012"
 */
export default function PageHero({
  eyebrow,
  title,
  bannerImageUrl,
}: Props) {

  return (
    <section className="relative bg-bg overflow-hidden pt-32 md:pt-40">
      {/* Subtle paper-texture scanline so the dark surface doesn't
          read as flat black — same trick as homepage hero, dialed
          way down. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)",
        }}
      />

      {/* ── Top banner — admin-uploaded image. Renders OUTSIDE
          the max-w container at full viewport width, scaled to
          its NATURAL aspect ratio so wide content (e.g. "WE WORK
          TOGETHER" headline) never gets cropped. Container height
          follows the image's intrinsic ratio — no forced 16:3
          frame, no object-cover side-clipping. */}
      {bannerImageUrl && (
        <div className="relative w-full opacity-0 animate-fade-up [animation-delay:0.15s]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImageUrl}
            alt="About banner"
            className="block w-full h-auto [filter:saturate(0.85)_brightness(0.92)]"
          />
          {/* Bottom fade — overlays at the lower portion of the
              image to bleed into the dark hero below. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: "30%",
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(8,9,13,0.7) 100%)",
            }}
          />
        </div>
      )}

      <div className="relative max-w-[1380px] mx-auto px-5 md:px-10">
        {/* ── Massive editorial headline with floating annotations.
            Only renders when `title` is provided — pages that just
            want the banner (e.g. About) can skip the headline by
            omitting the prop. */}
        {title && (
          <div className="relative opacity-0 animate-fade-up [animation-delay:0.3s]">
            {eyebrow && (
              <span className="absolute top-1 md:top-3 left-0 font-sans text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-cyan font-semibold">
                {eyebrow}
              </span>
            )}
            <h1
              className="font-sans uppercase font-black text-white tracking-[-0.04em] leading-[0.82]"
              style={{
                fontSize: "clamp(72px, 17vw, 280px)",
                fontStretch: "condensed",
              }}
            >
              {title}
            </h1>
            <span className="hidden md:block absolute font-sans text-[10px] tracking-[0.28em] uppercase text-cyan font-medium" style={{ left: "32%", top: "48%" }}>
              mixes subtly formal
            </span>
            <span className="hidden md:block absolute right-0 -bottom-2 font-sans text-[10px] tracking-[0.28em] uppercase text-[rgba(240,244,255,0.55)] max-w-[180px] text-right leading-[1.6]">
              and cinematic influences
            </span>
            <span className="hidden md:block absolute left-0 -bottom-7 font-sans text-[10px] tracking-[0.28em] uppercase text-[rgba(240,244,255,0.55)]">
              cinematic storytelling
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
