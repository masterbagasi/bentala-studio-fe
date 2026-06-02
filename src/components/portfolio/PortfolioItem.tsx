"use client";

import Image from "next/image";
import { useState } from "react";

export type PortfolioItem = {
  id: string;
  src: string;
  alt: string;
  aspectRatio: "1/1" | "3/4" | "2/3" | "4/5" | "4/3" | "3/2" | "16/9";
  title?: string;
  category?: string;
};

interface Props {
  item: PortfolioItem;
  priority?: boolean;
  colIndex?: number;
  rowIndex?: number;
}

export default function PortfolioItemCard({
  item,
  priority = false,
  colIndex = 0,
  rowIndex = 0,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  // First row: stagger left→right (0ms, 50ms, 100ms …). Rows below start after the first row settles.
  const delay = rowIndex === 0 ? colIndex * 50 : 220 + rowIndex * 70 + colIndex * 25;

  return (
    <article
      tabIndex={0}
      aria-label={item.title ?? item.alt}
      className="relative group card-enter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3DE7]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d]"
      style={{ animationDelay: `${Math.min(delay, 900)}ms` }}
    >
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ aspectRatio: item.aspectRatio }}
      >
        {/* Shimmer skeleton — fades out on image load */}
        <div
          className={`absolute inset-0 shimmer rounded-lg transition-opacity duration-500 ${
            loaded ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />

        <Image
          src={item.src}
          alt={item.alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 16.67vw, (max-width: 1920px) 14.28vw, 12.5vw"
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </div>
    </article>
  );
}
