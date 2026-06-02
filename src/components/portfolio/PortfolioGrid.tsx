"use client";

import { useMemo } from "react";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import PortfolioItemCard, { type PortfolioItem } from "./PortfolioItem";

// Normalised height unit for each aspect ratio (h / w)
const ASPECT_H: Record<PortfolioItem["aspectRatio"], number> = {
  "1/1":  1,
  "3/4":  4 / 3,
  "2/3":  3 / 2,
  "4/5":  5 / 4,
  "4/3":  3 / 4,
  "3/2":  2 / 3,
  "16/9": 9 / 16,
};

// Shortest-column-first masonry distribution.
// Items 0…colCount-1 always land in columns 0…colCount-1 (all heights 0) → top row stays flush.
function distribute(items: PortfolioItem[], colCount: number): PortfolioItem[][] {
  const cols: PortfolioItem[][] = Array.from({ length: colCount }, () => []);
  const heights = Array<number>(colCount).fill(0);
  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(item);
    heights[shortest] += ASPECT_H[item.aspectRatio] ?? 0.75;
  }
  return cols;
}

const GAP = 16; // px — maps to Tailwind gap-4

interface Props {
  items: PortfolioItem[];
}

export default function PortfolioGrid({ items }: Props) {
  const colCount = useResponsiveColumns();
  const columns = useMemo(() => distribute(items, colCount), [items, colCount]);

  return (
    <section
      aria-label="Portfolio"
      className="w-full"
      style={{ padding: `0 ${GAP}px` }}
    >
      <div
        className="flex items-start"
        style={{ gap: `${GAP}px` }}
      >
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="flex-1 flex flex-col min-w-0"
            style={{ gap: `${GAP}px` }}
          >
            {col.map((item, ri) => (
              <PortfolioItemCard
                key={item.id}
                item={item}
                priority={ri === 0}
                colIndex={ci}
                rowIndex={ri}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
