# Portfolio Masonry — Skeleton Placeholder Fix

**Goal:** Fix 3 visual bugs on the homepage portfolio grid: inconsistent gaps, misaligned top row, and empty holes when new batch loads via infinite scroll.

**Architecture:** Replace the current `opacity-0` card approach (whole card invisible until image loads) with a skeleton placeholder pattern — cards are always visually present as a shimmer animation, and the image fades in on top when ready.

**Tech Stack:** Next.js 14, React, Tailwind CSS, `next/image`

---

## Root Cause Analysis

| Bug | Cause |
|-----|-------|
| Gap inconsistency | Cards start `opacity-0`, making invisible cards create visual ambiguity between real gaps and empty space |
| Top not aligned | `opacity-0` cards in first row load at different speeds, so columns appear to start at different heights |
| Holes on scroll | New batch items are `opacity-0` until loaded, appearing as transparent voids in the middle of the grid |

All 3 bugs share the same root cause: **cards are invisible while loading**, making them indistinguishable from empty space.

---

## Design

### PortfolioCard — New Layer Structure

```
<outer div>               ← always visible, no opacity change
  <aspect-ratio div>      ← preserves correct height immediately
    <skeleton div>        ← shimmer bg, fades OUT when loaded
    <Image>               ← opacity-0 → opacity-100 on onLoad
    <gradient overlay>    ← hover effect (unchanged)
    <text overlay>        ← hover text (unchanged)
    <WA button>           ← hover CTA (unchanged)
  </aspect-ratio div>
</outer div>
```

**Key change:** The `loaded` state no longer controls the outer card's opacity. Instead:
- Skeleton div: `opacity-100` when not loaded → `opacity-0` when loaded (500ms transition)
- Image: `opacity-0` when not loaded → `opacity-100` when loaded (500ms transition)
- Both transitions fire simultaneously on `onLoad`/`onError`

### Skeleton Shimmer Animation

Add to `src/app/globals.css`:

```css
@keyframes skeleton-sweep {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, #0c1220 25%, #182035 50%, #0c1220 75%);
  background-size: 400% 100%;
  animation: skeleton-sweep 1.8s ease-in-out infinite;
}
```

### Files to Change

- **`src/components/home/PortfolioMasonry.tsx`** — update `PortfolioCard` component only
- **`src/app/globals.css`** — add `skeleton-sweep` keyframe + `.skeleton-shimmer` class

### No Changes Needed

- Pinterest column algorithm — unchanged
- Infinite scroll logic — unchanged
- Gap values (`PORTFOLIO_GAP = 4`) — unchanged, already correct
- Hover effects — unchanged
- Filter buttons — unchanged
