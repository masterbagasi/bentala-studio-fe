# Portfolio Skeleton Placeholder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 visual bugs in PortfolioMasonry — inconsistent gaps, misaligned top row, and holes when loading new batch — by replacing the whole-card opacity-0 approach with a skeleton placeholder pattern.

**Architecture:** The `PortfolioCard` component is modified so the outer div is always visible. A skeleton shimmer div (using the existing `.shimmer` CSS class) sits inside the aspect-ratio container and fades out when the image loads. The image fades in simultaneously. The `globals.css` already has the `.shimmer` class — no CSS changes needed.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, `next/image`

---

## File Structure

| File | Change |
|------|--------|
| `src/components/home/PortfolioMasonry.tsx` | Modify `PortfolioCard` component only (lines 19–63) |
| `src/app/globals.css` | No changes — `.shimmer` class already exists |

---

### Task 1: Update PortfolioCard to use skeleton placeholder

**Files:**
- Modify: `src/components/home/PortfolioMasonry.tsx:19-63`

- [ ] **Step 1: Verify the current broken behavior**

  Open browser at `http://localhost:3000` (run `npm run dev` if not running).
  Scroll to Portfolio section and observe:
  - Some cards at top are invisible while loading (dark empty space)
  - Gaps appear inconsistent between cards
  - When scrolling to load more, dark holes appear mid-grid

- [ ] **Step 2: Verify `.shimmer` class exists in globals.css**

  Run:
  ```bash
  grep -n "shimmer" src/app/globals.css
  ```
  Expected output includes:
  ```
  .shimmer {
    background: linear-gradient(90deg, #0d0f18 25%, #111420 50%, #0d0f18 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  ```
  If missing, do NOT proceed — the `.shimmer` class must exist before this task.

- [ ] **Step 3: Replace the PortfolioCard component**

  In `src/components/home/PortfolioMasonry.tsx`, replace lines 19–63 (the entire `PortfolioCard` function) with:

  ```tsx
  function PortfolioCard({ item, priority = false }: { item: PortfolioItem; priority?: boolean }) {
    const [loaded, setLoaded] = useState(false);

    return (
      <div className="relative cursor-pointer rounded-lg overflow-hidden group hover:shadow-[0_8px_40px_rgba(0,212,255,0.2)]">
        <div className={`relative overflow-hidden rounded-lg ${aspectRatioClass(item.aspect_ratio)}`}>
          <div
            className={`absolute inset-0 shimmer transition-opacity duration-500 ${
              loaded ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />

          <Image
            src={item.thumbnail_url ?? item.media_url}
            alt={item.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover rounded-lg [filter:saturate(0.75)_brightness(0.88)] transition-all duration-500 group-hover:[filter:saturate(1)_brightness(0.55)] group-hover:scale-[1.04] ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />

          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-[rgba(5,10,28,0.96)] via-[rgba(5,10,28,0.55)] to-[rgba(5,10,28,0.1)] opacity-0 transition-opacity duration-[350ms] group-hover:opacity-100 pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 translate-y-2.5 opacity-0 transition-all duration-[350ms] group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none">
            <div className="font-sans text-[9px] tracking-[0.22em] uppercase text-cyan mb-1.5">
              {item.tag}
            </div>
            <div className="font-sans text-xl tracking-[0.05em] text-white leading-[1.1]">
              {item.title}
            </div>
          </div>

          <a
            href={`${WHATSAPP_URL}?text=Hi!%20Interested%20in:%20${encodeURIComponent(item.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Inquire about ${item.title}`}
            className="absolute top-2.5 right-2.5 w-9 h-9 bg-cyan rounded-full flex items-center justify-center opacity-0 scale-75 -translate-y-1 transition-all duration-300 delay-150 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 text-bg text-sm font-bold z-10 hover:bg-blue4 hover:shadow-[0_0_20px_rgba(0,212,255,0.6)]"
          >
            &#x2197;
          </a>
        </div>
      </div>
    );
  }
  ```

  **What changed vs before:**
  - Outer div: removed `transition-opacity duration-500` and `${loaded ? "opacity-100" : "opacity-0"}` — card is always fully visible
  - Added skeleton `<div>` with `shimmer` class that fades OUT when loaded
  - Image className: added `${loaded ? "opacity-100" : "opacity-0"}` — image fades IN when loaded
  - `pointer-events-none` on skeleton div when loaded prevents it from blocking hover

- [ ] **Step 4: Type-check**

  Run:
  ```bash
  npx tsc --noEmit
  ```
  Expected: no output (zero errors)

- [ ] **Step 5: Visual verification in browser**

  Hard-refresh `http://localhost:3000` (Cmd+Shift+R).
  Check all 3 fixes:
  - [ ] Top row: all columns show shimmer animation immediately at the same height — no invisible gaps at top
  - [ ] Gaps: 4px dark gap is consistently visible between all cards (horizontal and vertical)
  - [ ] Scroll to bottom to trigger infinite scroll load — new cards appear as shimmer skeletons, not dark holes

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/home/PortfolioMasonry.tsx
  git commit -m "fix: replace opacity-0 cards with skeleton shimmer in PortfolioMasonry"
  ```
