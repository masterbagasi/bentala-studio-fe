"use client";

import { useEffect, useMemo, useState } from "react";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { TeamGalleryPhoto, TeamGalleryRatio } from "@/lib/types";

interface Props {
  photos?: TeamGalleryPhoto[];
}

const MIN_COL_WIDTH = 380;
// Fullscreen layout — no gutter between tiles, no section padding.
// Photos tile edge-to-edge across the entire viewport so the
// gallery reads as one continuous mural rather than a card grid.
const GAP = 0;
const SECTION_PAD_MOBILE = 0;
const SECTION_PAD_DESKTOP = 0;
const MOBILE_BREAKPOINT = 768;

export type TileSize = "wide" | "tall" | "square";

// Auto-ratio cycle: photo at sort_order N starts in slot
// floor(N/10) of this cycle. Trailing-row rebuild may reshape
// the last 1-2 photos to fill the grid (same rule the portfolio
// bento uses) — admin runs the same packer to preview the final
// tile shape.
const RATIO_CYCLE: TeamGalleryRatio[] = [
  "16:9", "9:16", "4:5",
  "4:5",  "16:9", "4:5",
  "9:16", "4:5",  "4:5",
  "16:9",
];

export function autoRatioForIndex(i: number): TeamGalleryRatio {
  return RATIO_CYCLE[((i % RATIO_CYCLE.length) + RATIO_CYCLE.length) % RATIO_CYCLE.length];
}

export function autoRatioForSortOrder(sortOrder: number): TeamGalleryRatio {
  return autoRatioForIndex(Math.floor(sortOrder / 10));
}

export function tileSizeFor(ratio: TeamGalleryRatio): TileSize {
  if (ratio === "16:9") return "wide";
  if (ratio === "9:16") return "tall";
  return "square";
}

function effectiveTileSize(size: TileSize, colCount: number): TileSize {
  if (colCount <= 2 && size === "wide") return "square";
  return size;
}

function getSectionPaddingX(): number {
  if (typeof window === "undefined") return SECTION_PAD_DESKTOP;
  return window.innerWidth < MOBILE_BREAKPOINT
    ? SECTION_PAD_MOBILE
    : SECTION_PAD_DESKTOP;
}

function getColCount(): number {
  if (typeof window === "undefined") return 4;
  const total = window.innerWidth - getSectionPaddingX() * 2;
  return Math.max(2, Math.floor((total + GAP) / (MIN_COL_WIDTH + GAP)));
}

function getColWidth(colCount: number): number {
  if (typeof window === "undefined") return MIN_COL_WIDTH;
  const total = window.innerWidth - getSectionPaddingX() * 2;
  return Math.floor((total - (colCount - 1) * GAP) / colCount);
}

interface PackedTile {
  photo: TeamGalleryPhoto;
  size: TileSize;
  col: number;
  row: number;
}

/**
 * Shelf packer + trailing-row rebuild — same algorithm as
 * PortfolioMasonry. Mid-grid never has holes. The trailing row(s)
 * reshape the LAST handful of tiles (within wide/square — talls
 * straddling the boundary collapse to squares) so the grid tiles
 * cleanly to the bottom edge. Editors get a hint in admin about
 * any photo that's been reshaped (the admin runs this same packer
 * to predict the final tile shape).
 */
export function packBento(
  items: TeamGalleryPhoto[],
  colCount: number,
): PackedTile[] {
  if (colCount <= 0) return [];

  const grid: boolean[][] = [];
  const isOccupied = (r: number, c: number) => grid[r]?.[c] === true;
  const markOccupied = (r: number, c: number) => {
    while (grid.length <= r) grid.push(new Array(colCount).fill(false));
    grid[r][c] = true;
  };

  const span = (size: TileSize) => {
    if (size === "wide") return { cols: 2, rows: 1 };
    if (size === "tall") return { cols: 1, rows: 2 };
    return { cols: 1, rows: 1 };
  };

  const fits = (
    r: number,
    c: number,
    s: { cols: number; rows: number },
  ) => {
    if (c + s.cols > colCount) return false;
    for (let dr = 0; dr < s.rows; dr++) {
      for (let dc = 0; dc < s.cols; dc++) {
        if (isOccupied(r + dr, c + dc)) return false;
      }
    }
    return true;
  };

  const place = (
    r: number,
    c: number,
    s: { cols: number; rows: number },
  ) => {
    for (let dr = 0; dr < s.rows; dr++) {
      for (let dc = 0; dc < s.cols; dc++) markOccupied(r + dr, c + dc);
    }
  };

  const queueRaw = items.map((photo) => ({
    photo,
    size: effectiveTileSize(
      tileSizeFor(autoRatioForSortOrder(photo.sort_order)),
      colCount,
    ),
  }));
  const buckets: Record<TileSize, typeof queueRaw> = {
    wide: queueRaw.filter((q) => q.size === "wide"),
    square: queueRaw.filter((q) => q.size === "square"),
    tall: queueRaw.filter((q) => q.size === "tall"),
  };
  const order: TileSize[] = ["wide", "square", "tall"];
  const queue: typeof queueRaw = [];
  while (buckets.wide.length || buckets.square.length || buckets.tall.length) {
    for (const t of order) {
      if (buckets[t].length > 0) queue.push(buckets[t].shift()!);
    }
  }

  const placed: PackedTile[] = [];
  let row = 0;
  let col = 0;

  const fillCell = (r: number, c: number): boolean => {
    for (let k = 0; k < queue.length; k++) {
      if (queue[k].size === "tall") continue;
      if (fits(r, c, span(queue[k].size))) {
        const partner = queue[k];
        place(r, c, span(partner.size));
        placed.push({ ...partner, col: c, row: r });
        queue.splice(k, 1);
        return true;
      }
    }
    return false;
  };

  while (queue.length > 0) {
    while (isOccupied(row, col)) {
      col++;
      if (col >= colCount) {
        col = 0;
        row++;
      }
    }

    let pickedIdx = -1;
    for (let i = 0; i < queue.length; i++) {
      if (fits(row, col, span(queue[i].size))) {
        pickedIdx = i;
        break;
      }
    }

    if (pickedIdx === -1) {
      col++;
      if (col >= colCount) {
        col = 0;
        row++;
      }
      continue;
    }

    const tile = queue[pickedIdx];
    place(row, col, span(tile.size));
    placed.push({ ...tile, col, row });
    queue.splice(pickedIdx, 1);

    if (tile.size === "tall" && col + 1 < colCount) {
      let pairIdx = -1;
      for (let k = 0; k < queue.length; k++) {
        if (queue[k].size === "tall" && fits(row, col + 1, span("tall"))) {
          pairIdx = k;
          break;
        }
      }
      if (pairIdx >= 0) {
        const pair = queue[pairIdx];
        place(row, col + 1, span("tall"));
        placed.push({ ...pair, col: col + 1, row });
        queue.splice(pairIdx, 1);
      }
    }

    if (tile.size === "tall") {
      const partnerRow = row + 1;
      for (let j = 0; j < colCount; j++) {
        if (isOccupied(partnerRow, j)) continue;
        fillCell(partnerRow, j);
      }
    }
  }

  // Trailing-row rebuild — no-empty-cells policy.
  if (placed.length > 0) {
    const rowSpan = (s: TileSize) => (s === "tall" ? 2 : 1);
    const colSpan = (s: TileSize) => (s === "wide" ? 2 : 1);

    const totalRows = placed.reduce(
      (max, t) => Math.max(max, t.row + rowSpan(t.size)),
      0,
    );

    let firstIncompleteRow = -1;
    for (let r = 0; r < totalRows; r++) {
      let occupied = 0;
      for (const t of placed) {
        if (t.row <= r && r < t.row + rowSpan(t.size)) {
          occupied += colSpan(t.size);
        }
      }
      if (occupied < colCount) {
        firstIncompleteRow = r;
        break;
      }
    }

    if (firstIncompleteRow >= 0) {
      for (const t of placed) {
        if (
          t.size === "tall" &&
          t.row < firstIncompleteRow &&
          t.row + 2 > firstIncompleteRow
        ) {
          t.size = "square";
        }
      }

      const trailing = placed
        .filter((t) => t.row >= firstIncompleteRow)
        .sort((a, b) => a.row - b.row || a.col - b.col);
      for (let i = placed.length - 1; i >= 0; i--) {
        if (placed[i].row >= firstIncompleteRow) placed.splice(i, 1);
      }

      const K = trailing.length;
      if (K > 0) {
        const R = Math.max(1, Math.ceil(K / colCount));
        const base = Math.floor(K / R);
        const extra = K % R;
        const itemsPerRow: number[] = [];
        for (let i = 0; i < R; i++) {
          itemsPerRow.push(base + (i < extra ? 1 : 0));
        }
        const canTile = itemsPerRow.every(
          (k) => k * 2 >= colCount && k <= colCount,
        );

        let idx = 0;
        if (canTile) {
          for (let r = 0; r < R; r++) {
            const k = itemsPerRow[r];
            const xWide = colCount - k;
            let wideCount = 0;
            let c = 0;
            for (let i = 0; i < k; i++) {
              const target = Math.round(((i + 1) * xWide) / k);
              const t = trailing[idx++];
              if (wideCount < target) {
                t.size = "wide";
                wideCount++;
              } else {
                t.size = "square";
              }
              t.row = firstIncompleteRow + r;
              t.col = c;
              c += colSpan(t.size);
              placed.push(t);
            }
          }
        } else {
          const startCol = Math.floor((colCount - K) / 2);
          for (let i = 0; i < K; i++) {
            const t = trailing[i];
            t.size = "square";
            t.row = firstIncompleteRow;
            t.col = startCol + i;
            placed.push(t);
          }
        }
      }
    }
  }

  return placed;
}

export default function TeamGallery({ photos = [] }: Props) {
  const [colCount, setColCount] = useState(0);
  const [rowHeight, setRowHeight] = useState(MIN_COL_WIDTH);

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

  const items: TeamGalleryPhoto[] = photos.length
    ? photos
    : RATIO_CYCLE.map((_, i) => ({
        id: `placeholder-${i}`,
        image_url: "",
        caption: "",
        alt_text: "",
        sort_order: i * 10,
        is_published: true,
        display_ratio: null,
        focal_x: 50,
        focal_y: 50,
        zoom: 1,
      }));

  const packedTiles = useMemo(
    () => packBento(items, colCount),
    [items, colCount],
  );

  return (
    <section className="bg-bg2">
      {colCount > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
            gridAutoRows: `${rowHeight}px`,
            gap: `${GAP}px`,
            padding: `0 ${getSectionPaddingX()}px`,
          }}
        >
          {packedTiles.map((tile, index) => (
            <GalleryCell
              key={tile.photo.id}
              tile={tile}
              rowHeight={rowHeight}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function GalleryCell({
  tile,
  rowHeight,
  index,
}: {
  tile: PackedTile;
  rowHeight: number;
  index: number;
}) {
  const { photo, size, col, row } = tile;
  const colSpan = size === "wide" ? 2 : 1;
  const rowSpanCount = size === "tall" ? 2 : 1;
  const cellHeight =
    size === "tall" ? rowHeight * 2 + GAP : rowHeight;

  const focalX = photo.focal_x ?? 50;
  const focalY = photo.focal_y ?? 50;
  const zoom = photo.zoom ?? 1;

  return (
    <RevealOnScroll
      className="block"
      delay={Math.min(index * 50, 500)}
      style={{
        gridColumnStart: col + 1,
        gridColumnEnd: `span ${colSpan}`,
        gridRowStart: row + 1,
        gridRowEnd: `span ${rowSpanCount}`,
        height: cellHeight,
      }}
    >
      <div className="relative w-full h-full overflow-hidden bg-white/[0.04]">
        {photo.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.image_url}
            alt={photo.alt_text || photo.caption || "Bentala team"}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: `${focalX}% ${focalY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${focalX}% ${focalY}%`,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs tracking-[0.22em] uppercase font-semibold text-white/45">
              {size === "wide" ? "16:9" : size === "tall" ? "9:16" : "4:5"}
            </span>
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
}
