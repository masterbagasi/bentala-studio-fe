"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import RevealOnScroll from "@/components/shared/RevealOnScroll";

const PHOTOS = [
  {
    id: "1",
    src: "https://images.pexels.com/photos/66134/pexels-photo-66134.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Professional cinema camera setup",
    caption: "Cinema Setup",
  },
  {
    id: "2",
    src: "https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Production team filming on location",
    caption: "On Location",
  },
  {
    id: "3",
    src: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Production crew at work",
    caption: "Production Crew",
  },
  {
    id: "4",
    src: "https://images.pexels.com/photos/1647976/pexels-photo-1647976.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Cinematographer operating camera",
    caption: "Cinematography",
  },
  {
    id: "5",
    src: "https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Post-production editing suite",
    caption: "Post Production",
  },
  {
    id: "6",
    src: "https://images.pexels.com/photos/3862617/pexels-photo-3862617.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Video production behind the scenes",
    caption: "Behind The Scenes",
  },
  {
    id: "7",
    src: "https://images.pexels.com/photos/3379929/pexels-photo-3379929.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Documentary filming BTS",
    caption: "Documentary BTS",
  },
  {
    id: "8",
    src: "https://images.pexels.com/photos/2882509/pexels-photo-2882509.jpeg?auto=compress&cs=tinysrgb&w=800",
    alt: "Film set equipment and lighting",
    caption: "Studio Setup",
  },
];

export default function ProductionGallery() {
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
    <section className="py-24 bg-bg2" id="production">
      <div className="px-5 md:px-[52px] mb-10">
        <RevealOnScroll>
          <div className="font-sans text-[10px] tracking-[0.16em] uppercase text-cyan flex items-center gap-3.5 mb-5">
            <span className="w-7 h-px bg-cyan" />
            Behind The Work
          </div>
          <h2 className="font-sans text-[clamp(44px,5vw,72px)] tracking-[-0.01em] text-white">
            Behind <span className="text-cyan">The Lens</span>
          </h2>
        </RevealOnScroll>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto cursor-grab scrollbar-hide select-none"
      >
        <div className="flex gap-3 px-5 md:px-[52px] w-max py-1">
          {PHOTOS.map((photo) => (
            <div
              key={photo.id}
              className="flex-none w-[300px] md:w-[380px] relative overflow-hidden rounded-lg group"
              style={{ aspectRatio: "16/9" }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="380px"
                className="object-cover [filter:saturate(0.6)_brightness(0.82)] group-hover:[filter:saturate(1)_brightness(0.9)] group-hover:scale-[1.04] transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,8,22,0.92)] via-[rgba(4,8,22,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                <span className="font-sans text-[9px] tracking-[0.24em] uppercase text-cyan">{photo.caption}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
