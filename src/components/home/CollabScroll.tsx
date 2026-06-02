"use client";

import { useEffect, useRef } from "react";
import { Collaboration } from "@/lib/types";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { SectionHeading } from "@/components/shared/Typography";

interface Props {
  collabs: Collaboration[];
}

/**
 * Detect raster logos uploaded via the admin's PNG/JPG flow. Those are
 * stored as <svg><image href="..."/></svg> wrappers; pull the URL out so
 * the public site can render an <img> that covers the full card without
 * the padding & desaturate filter intended for vector brand marks.
 */
function extractRasterUrl(svg: string): string | null {
  if (!svg) return null;
  const m = svg.match(/<image\b[^>]*\shref=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export default function CollabScroll({ collabs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let lastX = 0;
    let velX = 0;
    let animId = 0;

    const momentum = () => {
      if (Math.abs(velX) < 0.5) return;
      scroller.scrollLeft += velX;
      velX *= 0.92;
      animId = requestAnimationFrame(momentum);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      cancelAnimationFrame(animId);
      scroller.style.cursor = "grabbing";
      startX = e.pageX - scroller.offsetLeft;
      scrollLeft = scroller.scrollLeft;
      lastX = e.pageX;
      velX = 0;
    };

    const onMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      scroller.style.cursor = "grab";
      requestAnimationFrame(momentum);
    };

    const onMouseUp = () => {
      isDown = false;
      scroller.style.cursor = "grab";
      requestAnimationFrame(momentum);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      velX = (lastX - e.pageX) * 1.5;
      lastX = e.pageX;
      const x = e.pageX - scroller.offsetLeft;
      scroller.scrollLeft = scrollLeft + (startX - x) * 1.2;
    };

    let touchStartX = 0;
    let touchScrollLeft = 0;

    const onTouchStart = (e: TouchEvent) => {
      cancelAnimationFrame(animId);
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = scroller.scrollLeft;
      lastX = touchStartX;
      velX = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      velX = (lastX - e.touches[0].pageX) * 1.5;
      lastX = e.touches[0].pageX;
      scroller.scrollLeft = touchScrollLeft + (touchStartX - lastX);
    };

    const onTouchEnd = () => requestAnimationFrame(momentum);

    scroller.addEventListener("mousedown", onMouseDown);
    scroller.addEventListener("mouseleave", onMouseLeave);
    scroller.addEventListener("mouseup", onMouseUp);
    scroller.addEventListener("mousemove", onMouseMove);
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      scroller.removeEventListener("mousedown", onMouseDown);
      scroller.removeEventListener("mouseleave", onMouseLeave);
      scroller.removeEventListener("mouseup", onMouseUp);
      scroller.removeEventListener("mousemove", onMouseMove);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section className="py-10 bg-bg" id="collabs">
      <RevealOnScroll className="px-6 mb-5">
        <SectionHeading>Collaborations</SectionHeading>
      </RevealOnScroll>

      <div
        ref={scrollRef}
        className="overflow-x-auto cursor-grab scrollbar-hide select-none"
      >
        <div className="flex gap-[6px] px-6 w-max py-1">
          {collabs.map((c) => {
            const rasterUrl = extractRasterUrl(c.logo_svg);
            return (
              <div
                key={c.id}
                title={c.brand_name}
                className="flex-none w-[120px] h-[120px] relative overflow-hidden cursor-pointer border border-white/[0.05] rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.10] hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)] group"
                style={{ background: "#0c0f1e" }}
              >
                {/* Brand tint glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[1]"
                  style={{ background: `radial-gradient(ellipse at 50% 50%, ${c.tint_color}28 0%, transparent 72%)` }}
                />

                {rasterUrl ? (
                  /* Uploaded photo / raster: fill the entire card, no padding,
                     no desaturate filter — the user's image already has its
                     own composition. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rasterUrl}
                    alt={c.brand_name}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-[20px]">
                    <div
                      className="w-full h-full flex items-center justify-center transition-all duration-300 [filter:saturate(0.3)_brightness(0.65)] group-hover:[filter:saturate(1)_brightness(1.05)] group-hover:scale-[1.08] [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: c.logo_svg }}
                    />
                  </div>
                )}

                {/* Top accent line — brand colour */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 rounded-t-xl z-[2]"
                  style={{ background: c.tint_color }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
