# Code Structure Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Bentala Studio codebase up to Next.js 14 App Router best practices: error/loading boundaries, `next/image` migration, caching directives, error logging, accessibility fix, and shared constants/utils.

**Architecture:** All fixes are additive or in-place replacements — no restructuring of routes or components. Error/loading files slot into the existing App Router hierarchy. The `<img>` → `<Image>` migration requires a small `PortfolioCard` sub-component to manage per-card loaded state cleanly.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase JS v2

---

## File Map

| Action   | File                                           | Purpose |
|----------|------------------------------------------------|---------|
| Create   | `src/app/error.tsx`                            | Global error boundary |
| Create   | `src/app/loading.tsx`                          | Global loading skeleton |
| Create   | `src/app/not-found.tsx`                        | Custom 404 page |
| Create   | `src/app/about/loading.tsx`                    | About page loading skeleton |
| Create   | `src/app/news/loading.tsx`                     | News page loading skeleton |
| Create   | `src/lib/constants.ts`                         | Shared numeric/string constants |
| Create   | `src/lib/utils.ts`                             | Shared utility functions |
| Modify   | `src/lib/supabase-browser.ts`                  | Remove unsafe non-null assertion |
| Modify   | `src/app/page.tsx`                             | Add revalidate + error logging |
| Modify   | `src/app/about/page.tsx`                       | Add revalidate + error logging |
| Modify   | `src/app/news/page.tsx`                        | Add revalidate + error logging |
| Modify   | `src/components/home/PortfolioMasonry.tsx`     | Replace `<img>` with `<Image>`, extract PortfolioCard |
| Modify   | `src/components/news/IgGrid.tsx`               | Replace `<img>` with `<Image>` |
| Modify   | `next.config.mjs`                              | Add missing image hostnames |
| Modify   | `src/components/home/HeroSection.tsx`          | Fix scroll indicator accessibility |

---

### Task 1: App Router boundary files (error, loading, not-found)

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/loading.tsx`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create `src/app/error.tsx`**

```tsx
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-cyan">
        Something went wrong
      </p>
      <h2 className="font-sans text-[clamp(28px,4vw,52px)] font-bold text-white leading-none">
        Unexpected Error
      </h2>
      <p className="text-[rgba(240,244,255,0.5)] text-sm max-w-sm">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="font-sans text-sm font-medium text-white border border-[rgba(240,244,255,0.2)] px-10 py-3 rounded-full transition-all hover:border-cyan hover:text-cyan"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-3.5">
      <div className="flex gap-[7px]">
        <div className="loader-dot" />
        <div className="loader-dot" style={{ animationDelay: "0.2s" }} />
        <div className="loader-dot" style={{ animationDelay: "0.4s" }} />
      </div>
      <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-dim">
        Loading...
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-cyan">
        404
      </p>
      <h2 className="font-sans text-[clamp(28px,4vw,52px)] font-bold text-white leading-none">
        Page Not Found
      </h2>
      <p className="text-[rgba(240,244,255,0.5)] text-sm max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="font-sans text-sm font-medium text-white border border-[rgba(240,244,255,0.2)] px-10 py-3 rounded-full transition-all hover:border-cyan hover:text-cyan"
      >
        Back to home
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:3001/nonexistent-page — should show the custom 404 UI matching the site's dark design.

- [ ] **Step 5: Commit**

```bash
git add src/app/error.tsx src/app/loading.tsx src/app/not-found.tsx
git commit -m "feat: add global error boundary, loading, and 404 pages"
```

---

### Task 2: Page-level loading skeletons

**Files:**
- Create: `src/app/about/loading.tsx`
- Create: `src/app/news/loading.tsx`

- [ ] **Step 1: Create `src/app/about/loading.tsx`**

```tsx
export default function AboutLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-3.5">
      <div className="flex gap-[7px]">
        <div className="loader-dot" />
        <div className="loader-dot" style={{ animationDelay: "0.2s" }} />
        <div className="loader-dot" style={{ animationDelay: "0.4s" }} />
      </div>
      <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-dim">
        Loading...
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/news/loading.tsx`**

Same content as `src/app/about/loading.tsx`:

```tsx
export default function NewsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-3.5">
      <div className="flex gap-[7px]">
        <div className="loader-dot" />
        <div className="loader-dot" style={{ animationDelay: "0.2s" }} />
        <div className="loader-dot" style={{ animationDelay: "0.4s" }} />
      </div>
      <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-dim">
        Loading...
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/about/loading.tsx src/app/news/loading.tsx
git commit -m "feat: add page-level loading skeletons for about and news"
```

---

### Task 3: Create `src/lib/constants.ts` and `src/lib/utils.ts`

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/lib/utils.ts`
- Modify: `src/components/home/PortfolioMasonry.tsx` (remove local constants/utils — done in Task 6)
- Modify: `src/components/news/IgGrid.tsx` (remove local BATCH constant — done in Task 5)

- [ ] **Step 1: Create `src/lib/constants.ts`**

```ts
export const WHATSAPP_URL = "https://wa.me/6281284731599";

// PortfolioMasonry
export const PORTFOLIO_MIN_COL_WIDTH = 220;
export const PORTFOLIO_GAP = 8;
export const PORTFOLIO_BATCH_SIZE_MULTIPLIER = 3;

// IgGrid
export const IG_GRID_BATCH = 12;
```

- [ ] **Step 2: Create `src/lib/utils.ts`**

```ts
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function aspectRatioClass(ratio: string): string {
  const map: Record<string, string> = {
    "16:9": "aspect-[16/9]",
    "4:5": "aspect-[4/5]",
    "1:1": "aspect-square",
    "4:3": "aspect-[4/3]",
    "3:4": "aspect-[3/4]",
  };
  return map[ratio] ?? "aspect-[4/3]";
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts src/lib/utils.ts
git commit -m "feat: add shared constants and utility functions"
```

---

### Task 4: Fix `src/lib/supabase-browser.ts`

**Files:**
- Modify: `src/lib/supabase-browser.ts`

- [ ] **Step 1: Replace unsafe non-null assertions with guarded pattern**

Current file:
```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);
```

Replace with:
```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseBrowserConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabaseBrowser = isSupabaseBrowserConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase-browser.ts
git commit -m "fix: guard supabase-browser client against missing env vars"
```

---

### Task 5: Add `revalidate` and error logging to server pages

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/news/page.tsx`

- [ ] **Step 1: Add revalidate + error logging to `src/app/page.tsx`**

Add after the imports at the top of the file (before the fallback constants):
```ts
export const revalidate = 3600;
```

Replace the catch block in `getData()`:
```ts
// Before:
  } catch {
    return { hero: fallbackHero, services: fallbackServices, socialLinks: fallbackSocials, collabs: fallbackCollabs, portfolio: fallbackPortfolio };
  }

// After:
  } catch (err) {
    console.error("[HomePage] Failed to fetch data from Supabase:", err);
    return { hero: fallbackHero, services: fallbackServices, socialLinks: fallbackSocials, collabs: fallbackCollabs, portfolio: fallbackPortfolio };
  }
```

- [ ] **Step 2: Add revalidate + error logging to `src/app/about/page.tsx`**

Add after imports:
```ts
export const revalidate = 3600;
```

Replace catch blocks:
```ts
// In generateMetadata catch:
    } catch (err) {
      console.error("[AboutPage] Failed to fetch SEO data:", err);
    }

// In getData catch:
  } catch (err) {
    console.error("[AboutPage] Failed to fetch page data:", err);
    return { about: fallbackAbout, team: [] as TeamMember[] };
  }
```

- [ ] **Step 3: Add revalidate + error logging to `src/app/news/page.tsx`**

Add after imports:
```ts
export const revalidate = 3600;
```

Replace catch blocks:
```ts
// In generateMetadata catch:
    } catch (err) {
      console.error("[NewsPage] Failed to fetch SEO data:", err);
    }

// In getData catch:
  } catch (err) {
    console.error("[NewsPage] Failed to fetch posts:", err);
    return fallbackPosts;
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/app/about/page.tsx src/app/news/page.tsx
git commit -m "feat: add ISR revalidation and error logging to server pages"
```

---

### Task 6: Migrate `PortfolioMasonry.tsx` from `<img>` to `<Image>`

**Files:**
- Modify: `src/components/home/PortfolioMasonry.tsx`

The opacity-fade + shimmer effect requires per-card loaded state. Extract a `PortfolioCard` component inside the file to hold this state cleanly.

- [ ] **Step 1: Update `src/components/home/PortfolioMasonry.tsx`**

Replace the entire file contents with:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { PortfolioItem } from "@/lib/types";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { shuffleArray, aspectRatioClass } from "@/lib/utils";
import {
  PORTFOLIO_MIN_COL_WIDTH,
  PORTFOLIO_GAP,
  PORTFOLIO_BATCH_SIZE_MULTIPLIER,
  WHATSAPP_URL,
} from "@/lib/constants";

interface Props {
  items: PortfolioItem[];
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="break-inside-avoid mb-2 relative cursor-pointer rounded-2xl overflow-hidden bg-bg3 group transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(0,212,255,0.2)]">
      <div
        className={`relative overflow-hidden rounded-2xl ${!loaded ? "shimmer" : ""} ${aspectRatioClass(item.aspect_ratio)}`}
      >
        <Image
          src={item.media_url}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover rounded-2xl [filter:saturate(0.75)_brightness(0.88)] transition-all duration-500 group-hover:[filter:saturate(1)_brightness(0.55)] group-hover:scale-[1.04] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transition: "opacity 0.4s ease" }}
          onLoad={() => setLoaded(true)}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[rgba(5,10,28,0.96)] via-[rgba(5,10,28,0.55)] to-[rgba(5,10,28,0.1)] opacity-0 transition-opacity duration-[350ms] group-hover:opacity-100 pointer-events-none" />

        {/* Pin info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 translate-y-2.5 opacity-0 transition-all duration-[350ms] group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none">
          <div className="font-sans text-[9px] tracking-[0.22em] uppercase text-cyan mb-1.5">
            {item.tag}
          </div>
          <div className="font-sans text-xl tracking-[0.05em] text-white leading-[1.1]">
            {item.title}
          </div>
        </div>

        {/* Arrow button */}
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

export default function PortfolioMasonry({ items }: Props) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [displayedItems, setDisplayedItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<PortfolioItem[]>([]);
  const batchIndexRef = useRef(0);

  const getColCount = useCallback(() => {
    const total = window.innerWidth - PORTFOLIO_GAP * 2;
    return Math.max(2, Math.floor((total + PORTFOLIO_GAP) / (PORTFOLIO_MIN_COL_WIDTH + PORTFOLIO_GAP)));
  }, []);

  const getFiltered = useCallback(
    (filter: string) =>
      filter === "all" ? items : items.filter((i) => i.category === filter),
    [items]
  );

  const loadBatch = useCallback(() => {
    const colCount = getColCount();
    const batchSize = colCount * PORTFOLIO_BATCH_SIZE_MULTIPLIER;
    const start = batchIndexRef.current * batchSize;
    const batch = poolRef.current.slice(start, start + batchSize);
    if (batch.length === 0) return;
    batchIndexRef.current++;
    setDisplayedItems((prev) => [...prev, ...batch]);
  }, [getColCount]);

  useEffect(() => {
    const filtered = getFiltered(activeFilter);
    poolRef.current = shuffleArray(filtered);
    batchIndexRef.current = 0;
    setDisplayedItems([]);
    setTimeout(() => {
      loadBatch();
    }, 100);
  }, [activeFilter, getFiltered, loadBatch]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setLoading(true);
          setTimeout(() => {
            loadBatch();
            setLoading(false);
          }, 400);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [loading, loadBatch]);

  const filters = [
    { key: "all", label: "All" },
    { key: "video", label: "Video" },
    { key: "social", label: "Social" },
    { key: "design", label: "Design" },
    { key: "intl", label: "International" },
  ];

  const [colCount, setColCount] = useState(0);

  useEffect(() => {
    setColCount(getColCount());
    const onResize = () => setColCount(getColCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getColCount]);

  return (
    <section className="pt-14 bg-bg" id="portfolio">
      <RevealOnScroll className="flex flex-wrap items-end justify-between mb-7 px-6">
        <h2 className="font-sans text-[clamp(22px,2.5vw,34px)] font-bold tracking-[0.02em] text-white leading-none">
          Portfolio
        </h2>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              aria-pressed={activeFilter === f.key}
              className={`font-sans text-[10px] tracking-[0.03em] capitalize px-5 py-2.5 border rounded-full cursor-pointer transition-all duration-250 ${
                activeFilter === f.key
                  ? "bg-cyan text-bg border-cyan font-semibold"
                  : "bg-transparent text-dim border-ghost hover:bg-cyan hover:text-bg hover:border-cyan hover:font-semibold"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </RevealOnScroll>

      <div
        className="px-2"
        style={
          colCount > 0
            ? { columnCount: colCount, columnGap: `${PORTFOLIO_GAP}px` }
            : undefined
        }
      >
        {displayedItems.map((item, i) => (
          <PortfolioCard key={`${item.id}-${i}`} item={item} />
        ))}
      </div>

      <div
        ref={loaderRef}
        className="flex items-center justify-center gap-3.5 py-16 pb-20 opacity-50"
      >
        <div className="flex gap-[7px]">
          <div className="loader-dot" />
          <div className="loader-dot" style={{ animationDelay: "0.2s" }} />
          <div className="loader-dot" style={{ animationDelay: "0.4s" }} />
        </div>
        <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-dim">
          Loading more
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify masonry renders correctly**

Open http://localhost:3001 — scroll to Portfolio section. Images should load with shimmer → fade-in effect. Hover should show overlay + arrow button. Filter buttons should work.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PortfolioMasonry.tsx
git commit -m "refactor: migrate PortfolioMasonry to next/image, extract PortfolioCard, use shared constants/utils"
```

---

### Task 7: Migrate `IgGrid.tsx` from `<img>` to `<Image>` + fix `next.config.mjs`

**Files:**
- Modify: `src/components/news/IgGrid.tsx`
- Modify: `next.config.mjs`

- [ ] **Step 1: Update `next.config.mjs` to add missing image hostnames**

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Replace `<img>` with `<Image>` in `src/components/news/IgGrid.tsx`**

Add `import Image from "next/image";` after `import { useState, useEffect, useCallback } from "react";`.

Add `import { IG_GRID_BATCH } from "@/lib/constants";`.

Replace `const BATCH = 12;` — delete this line (now imported from constants).

Replace:
```tsx
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media_url}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover block transition-transform duration-400 group-hover:scale-[1.04]"
            />
```

With:
```tsx
            <Image
              src={post.media_url}
              alt={post.caption.slice(0, 80)}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
            />
```

Replace all `BATCH` references with `IG_GRID_BATCH`:
- `const [visibleCount, setVisibleCount] = useState(IG_GRID_BATCH);`
- `setVisibleCount(IG_GRID_BATCH);`

- [ ] **Step 3: Verify news page renders correctly**

Open http://localhost:3001/news — grid should load, images should show in correct aspect ratio with hover overlay and like/comment counts.

- [ ] **Step 4: Commit**

```bash
git add src/components/news/IgGrid.tsx next.config.mjs
git commit -m "refactor: migrate IgGrid to next/image, add missing image hostnames to next.config"
```

---

### Task 8: Fix scroll indicator accessibility in `HeroSection.tsx`

**Files:**
- Modify: `src/components/home/HeroSection.tsx`

- [ ] **Step 1: Replace scroll indicator `<div>` with `<button>` in `HeroSection.tsx`**

Find this block (lines 154–171):
```tsx
        <div
          className="flex flex-col items-center gap-1.5 cursor-pointer opacity-40 transition-opacity hover:opacity-80"
          onClick={() =>
            document.getElementById("collabs")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="w-5 h-5 text-white animate-scroll-bounce"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
```

Replace with:
```tsx
        <button
          type="button"
          aria-label="Scroll to next section"
          className="flex flex-col items-center gap-1.5 cursor-pointer opacity-40 transition-opacity hover:opacity-80 bg-transparent border-none p-0"
          onClick={() =>
            document.getElementById("collabs")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
            className="w-5 h-5 text-white animate-scroll-bounce"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
```

- [ ] **Step 2: Verify hero renders and scroll button works**

Open http://localhost:3001 — the chevron should still animate and clicking it should scroll to the collabs section.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HeroSection.tsx
git commit -m "fix: replace scroll indicator div with accessible button element"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 8 fix categories covered: boundaries (T1–T2), constants/utils (T3), supabase guard (T4), caching + logging (T5), next/image PortfolioMasonry (T6), next/image IgGrid + config (T7), accessibility (T8)
- [x] **No placeholders:** All code blocks are complete and runnable
- [x] **Type consistency:** `aspectRatioClass` defined in T3/utils, used in T6. `WHATSAPP_URL`, `IG_GRID_BATCH`, `PORTFOLIO_*` defined in T3/constants, used in T6/T7. All names consistent across tasks
- [x] **Note:** No test framework exists in this project. Browser verification steps replace automated tests for each task
