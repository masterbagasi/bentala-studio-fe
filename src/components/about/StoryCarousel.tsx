"use client";

import { useEffect, useState } from "react";

interface Props {
  images: string[];
  /** Optional logo URL. Falls back to the bundled `/logo.png`. */
  logoUrl?: string | null;
}

/**
 * Image-Logo flipping grid.
 *
 * A full-screen 4×2 grid of cards. Each card shows an admin-
 * uploaded image on the front and the Bentala logo on the back.
 * Cards flip 180° around their Y axis on a continuous cycle with
 * staggered timing — the row reads as a wave of flipping panels
 * rippling left-to-right, top-to-bottom.
 *
 * Reference brief from user:
 *   • Grid/carousel of images (each with a logo on the flip side)
 *   • 3D flip animation
 *   • Full-screen layout
 */
export default function StoryCarousel({ images, logoUrl }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!images || images.length === 0) return null;

  // 4 cols × 2 rows = 8 panels fills a full-screen-feeling grid.
  // If the admin uploaded fewer than 8 images, they cycle through
  // the panel positions (each image appears more than once).
  const PANEL_COUNT = 8;
  const slots = Array.from({ length: PANEL_COUNT }, (_, i) => ({
    image: images[i % images.length],
  }));

  const resolvedLogo = logoUrl && logoUrl.trim() !== "" ? logoUrl : "/logo.png";

  return (
    <div className="flip-stage" suppressHydrationWarning>
      {mounted &&
        slots.map((slot, i) => (
          <FlipPanel
            key={i}
            image={slot.image}
            logo={resolvedLogo}
            index={i}
            total={PANEL_COUNT}
          />
        ))}

      <style jsx>{`
        .flip-stage {
          /* Always exactly viewport-wide, centred regardless of
             parent layout — full-screen presence. */
          position: relative;
          width: 100vw;
          left: calc((100% - 100vw) / 2);
          /* 4 × 2 grid with generous padding for the section
             chrome to breathe. Stage height computed so each
             cell stays close to a 4:5 portrait poster ratio. */
          padding: 24px clamp(16px, 4vw, 60px);
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-rows: repeat(2, 1fr);
          gap: clamp(12px, 1.6vw, 28px);
          height: clamp(560px, 80vh, 900px);
        }

        /* Tablet → 3-up grid */
        @media (max-width: 1024px) {
          .flip-stage {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-template-rows: repeat(3, 1fr);
            height: clamp(700px, 92vh, 1100px);
          }
        }
        /* Mobile → 2-up grid */
        @media (max-width: 600px) {
          .flip-stage {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: repeat(4, 1fr);
            height: clamp(720px, 110vh, 1200px);
          }
        }
      `}</style>
    </div>
  );
}

function FlipPanel({
  image,
  logo,
  index,
  total,
}: {
  image: string;
  logo: string;
  index: number;
  total: number;
}) {
  const [flipped, setFlipped] = useState(false);

  // Stagger the auto-flip cycle so the grid ripples instead of
  // all panels flipping at the same moment. Each panel gets its
  // own (cycleMs / total) offset.
  useEffect(() => {
    const cycleMs = 5000;
    const stagger = (index / total) * cycleMs;

    let intervalId: ReturnType<typeof setInterval>;

    const timeoutId = setTimeout(() => {
      setFlipped((f) => !f);
      intervalId = setInterval(() => {
        setFlipped((f) => !f);
      }, cycleMs);
    }, stagger);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [index, total]);

  return (
    <div
      className="flip-panel"
      onMouseEnter={() => setFlipped((f) => !f)}
    >
      <div className={`flip-inner${flipped ? " flipped" : ""}`}>
        <div className="flip-face flip-face-front">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" loading="lazy" />
        </div>
        <div className="flip-face flip-face-back">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="Bentala" />
        </div>
      </div>

      <style jsx>{`
        .flip-panel {
          width: 100%;
          height: 100%;
          perspective: 1400px;
          cursor: pointer;
        }
        .flip-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 850ms cubic-bezier(0.65, 0, 0.35, 1);
        }
        .flip-inner.flipped {
          transform: rotateY(180deg);
        }
        .flip-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 10px;
          overflow: hidden;
          background: #0d1018;
          box-shadow:
            0 24px 60px -20px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(255, 255, 255, 0.06);
        }
        .flip-face-back {
          transform: rotateY(180deg);
          /* Subtle blue brand tint behind the logo so the back
             feels like a Bentala statement, not just an image. */
          background:
            radial-gradient(
              circle at 50% 50%,
              rgba(11, 61, 231, 0.22) 0%,
              rgba(8, 9, 13, 0.95) 70%
            ),
            #0d1018;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flip-face-front img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          pointer-events: none;
        }
        .flip-face-back img {
          width: 60%;
          height: 60%;
          object-fit: contain;
          display: block;
          opacity: 0.95;
          pointer-events: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .flip-inner {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
