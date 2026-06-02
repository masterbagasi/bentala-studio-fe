# Design System — Typography Tokens & Components

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize all typography so changing one value in `tailwind.config.ts` or `Typography.tsx` updates every component site-wide.

**Architecture:** Add a `fontSize` token block to `tailwind.config.ts`, update `Typography.tsx` to use those tokens, then migrate all 10 remaining components to use `<Eyebrow>`, `<SectionHeading>`, `<Body>`, etc. instead of hardcoded sizes.

**Tech Stack:** Next.js 14, Tailwind CSS v3, TypeScript

---

## File Map

| File | Action | What changes |
|---|---|---|
| `tailwind.config.ts` | Modify | Add complete `fontSize` token block |
| `src/components/shared/Typography.tsx` | Modify | Replace `text-[Npx]` → token classes |
| `src/components/about/PageHero.tsx` | Modify | h1 → `<PageHeading>`, p → `<Body>` |
| `src/components/about/StatsBanner.tsx` | Modify | Eyebrow div → `<Eyebrow>`, label → `text-meta` |
| `src/components/about/ValuesGrid.tsx` | Modify | Eyebrow + h2 → Typography, desc → `<BodySmall>` |
| `src/components/about/TeamGallery.tsx` | Modify | Eyebrow + h2 → Typography |
| `src/components/about/CtaBand.tsx` | Modify | h2 → `text-cta`, p → `<Body>` |
| `src/components/home/HeroSection.tsx` | Modify | h1 → `text-hero`, p → `<Body>` |
| `src/components/home/CollabScroll.tsx` | Modify | h2 → `text-collab` |
| `src/components/home/PortfolioMasonry.tsx` | Modify | h2 → `<SectionHeading>`, captions → `<Caption>` |
| `src/components/layout/Navbar.tsx` | Modify | nav links → `text-nav` |

---

## Task 1: Add fontSize tokens to tailwind.config.ts

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Open `tailwind.config.ts` and add the `fontSize` block inside `theme.extend`**

Replace the existing config with:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#08090d",
        bg2: "#0d0f18",
        bg3: "#111420",
        blue1: "#0f3a7a",
        blue2: "#1757c2",
        blue3: "#3b87f5",
        blue4: "#6fb3ff",
        cyan: "#00d4ff",
        white: "#f0f4ff",
        dim: "rgba(240,244,255,0.55)",
        ghost: "rgba(240,244,255,0.1)",
      },
      fontFamily: {
        sans: ["Open Sauce Sans", "sans-serif"],
      },
      fontSize: {
        // ── Labels & metadata (letterSpacing handled per-component)
        "label":      ["9px",  { lineHeight: "1.2" }],
        "meta":       ["10px", { lineHeight: "1.2" }],
        "tag":        ["11px", { lineHeight: "1.2" }],
        "nav":        ["13px", { lineHeight: "1.2" }],
        // ── Body text
        "body-sm":    ["15px", { lineHeight: "1.75" }],
        "body":       ["17px", { lineHeight: "1.9"  }],
        "body-lg":    ["19px", { lineHeight: "1.85" }],
        // ── Display (large non-responsive numbers / names)
        "display-sm": ["32px", { lineHeight: "1"    }],
        "stat":       ["64px", { lineHeight: "1"    }],
        // ── Headings (responsive clamp)
        "collab":     ["clamp(22px,2.5vw,34px)",  { lineHeight: "1"    }],
        "story":      ["clamp(40px,4.5vw,64px)",  { lineHeight: "0.95" }],
        "section":    ["clamp(44px,5vw,72px)",    { lineHeight: "1.05" }],
        "cta":        ["clamp(48px,6vw,88px)",    { lineHeight: "0.95" }],
        "hero":       ["clamp(56px,8vw,110px)",   { lineHeight: "0.92" }],
        "page":       ["clamp(64px,9vw,130px)",   { lineHeight: "0.88" }],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add typography fontSize tokens to tailwind config"
```

---

## Task 2: Update Typography.tsx to use token classes

**Files:**
- Modify: `src/components/shared/Typography.tsx`

- [ ] **Step 1: Replace all arbitrary size classes with tokens**

Full file replacement:

```tsx
import { ReactNode, HTMLAttributes } from "react";

function cx(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Eyebrow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "font-sans text-meta tracking-[0.16em] uppercase text-cyan flex items-center gap-3.5",
        className
      )}
      {...props}
    >
      <span className="w-7 h-px bg-cyan flex-shrink-0" />
      {children}
    </div>
  );
}

export function PageHeading({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cx(
        "font-sans text-page tracking-[0.02em] text-white",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cx(
        "font-sans text-section tracking-[-0.01em] text-white",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function StoryHeading({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cx(
        "font-sans text-story tracking-[-0.01em] text-white",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function Body({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx("text-body font-light text-dim", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function BodySmall({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx("text-body-sm font-light text-dim", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Caption({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "font-sans text-label tracking-[0.24em] uppercase text-cyan",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function MetaLabel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        "font-sans text-meta tracking-[0.15em] uppercase text-dim",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/Typography.tsx
git commit -m "feat: update Typography components to use tailwind token classes"
```

---

## Task 3: Migrate PageHero.tsx

**Files:**
- Modify: `src/components/about/PageHero.tsx`

- [ ] **Step 1: Replace hardcoded sizes with Typography components**

```tsx
import Image from "next/image";
import { PageHeading, Body } from "@/components/shared/Typography";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
}

export default function PageHero({ eyebrow, title, subtitle }: Props) {
  return (
    <section className="relative pt-40 pb-24 px-5 md:px-[52px] overflow-hidden min-h-[70vh] flex items-end">
      <Image
        src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1920"
        alt="Bentala Studio team"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center [filter:saturate(0.5)_brightness(0.35)]"
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,8,22,0.55) 0%, rgba(4,8,22,0.35) 40%, rgba(4,8,22,0.82) 80%, #040816 100%)",
        }}
      />
      <div className="absolute w-[600px] h-[400px] rounded-full [filter:blur(140px)] pointer-events-none bg-[rgba(0,212,255,0.07)] -top-[60px] right-0 z-[1]" />

      <div className="relative z-10 w-full">
        {eyebrow && (
          <div className="font-sans text-meta tracking-[0.16em] uppercase text-cyan flex items-center gap-3.5 mb-6 opacity-0 animate-fade-up [animation-delay:0.2s]">
            <span className="w-7 h-px bg-cyan" />
            {eyebrow}
          </div>
        )}
        <PageHeading className="opacity-0 animate-fade-up [animation-delay:0.4s]">
          {title}
        </PageHeading>
        <Body className="max-w-[600px] mt-7 leading-[1.75] opacity-0 animate-fade-up [animation-delay:0.7s]">
          {subtitle}
        </Body>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/about/PageHero.tsx
git commit -m "feat: migrate PageHero to Typography components"
```

---

## Task 4: Migrate StatsBanner.tsx

**Files:**
- Modify: `src/components/about/StatsBanner.tsx`

- [ ] **Step 1: Replace `text-[64px]` and `text-[10px]` with tokens**

```tsx
import RevealOnScroll from "@/components/shared/RevealOnScroll";

interface Props {
  stats: { num: string; label: string }[];
}

export default function StatsBanner({ stats }: Props) {
  return (
    <RevealOnScroll>
      <div className="py-20 px-5 md:px-[52px] bg-bg2 border-t-[0.5px] border-b-[0.5px] border-[rgba(0,212,255,0.1)]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`text-center px-6 ${
                i < stats.length - 1
                  ? "border-r-[0.5px] border-[rgba(240,244,255,0.08)] max-md:border-r-0 max-md:border-b-[0.5px] max-md:pb-6"
                  : ""
              }`}
            >
              <div className="font-sans text-stat text-white leading-none">
                {stat.num.includes("+") || stat.num.includes("∞") ? (
                  <>
                    {stat.num.replace(/[+∞]/g, "")}
                    <span className="text-cyan">
                      {stat.num.includes("+") ? "+" : "∞"}
                    </span>
                  </>
                ) : stat.num === "∞" ? (
                  <span className="text-white">∞</span>
                ) : (
                  stat.num
                )}
              </div>
              <div className="font-sans text-meta tracking-[0.18em] uppercase text-dim mt-1.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/about/StatsBanner.tsx
git commit -m "feat: migrate StatsBanner to typography tokens"
```

---

## Task 5: Migrate ValuesGrid.tsx

**Files:**
- Modify: `src/components/about/ValuesGrid.tsx`

- [ ] **Step 1: Replace Eyebrow div, h2, and text sizes with Typography components and tokens**

```tsx
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { Eyebrow, SectionHeading, BodySmall } from "@/components/shared/Typography";

interface Value {
  name: string;
  desc: string;
  icon: string;
}

interface Props {
  values: Value[];
}

const iconMap: Record<string, React.ReactNode> = {
  globe: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 text-cyan mb-5">
      <path d="M20 4C11.16 4 4 11.16 4 20s7.16 16 16 16 16-7.16 16-16S28.84 4 20 4z" />
      <path d="M4 20h32M20 4c-4 5-6 9-6 14s2 9 6 14M20 4c4 5 6 9 6 14s-2 9-6 14" />
    </svg>
  ),
  film: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 text-cyan mb-5">
      <path d="M8 32l6-6 5 5 8-10 6 8" />
      <rect x="4" y="4" width="32" height="32" rx="2" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 text-cyan mb-5">
      <path d="M20 6l3.5 7 7.5 1-5.5 5.3 1.3 7.7L20 24l-6.8 3 1.3-7.7L9 16l7.5-1z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 text-cyan mb-5">
      <circle cx="14" cy="14" r="8" />
      <circle cx="26" cy="26" r="8" />
      <path d="M20 8l8 8M12 24l8 8" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 text-cyan mb-5">
      <path d="M6 20l8 8L34 12" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 text-cyan mb-5">
      <path d="M20 4v8M20 28v8M4 20h8M28 20h8" />
      <circle cx="20" cy="20" r="8" />
    </svg>
  ),
};

export default function ValuesGrid({ values }: Props) {
  return (
    <section className="py-24 px-5 md:px-[52px] bg-bg">
      <div>
        <RevealOnScroll className="mb-16">
          <Eyebrow className="mb-5">What We Stand For</Eyebrow>
          <SectionHeading>
            Our <span className="text-cyan">Values</span>
          </SectionHeading>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[3px] bg-[rgba(240,244,255,0.04)]">
          {values.map((val, i) => (
            <RevealOnScroll key={val.name} delay={i % 3 * 100}>
              <div className="bg-bg p-11 border-t-2 border-transparent transition-all duration-300 hover:bg-bg2 hover:border-cyan">
                <div className="font-sans text-meta tracking-[0.2em] text-[rgba(59,135,245,0.5)] mb-6">
                  {String(i + 1).padStart(2, "0")}
                </div>
                {iconMap[val.icon] || iconMap.globe}
                <div className="font-sans text-display-sm tracking-[-0.01em] text-white mb-3.5">
                  {val.name}
                </div>
                <BodySmall>{val.desc}</BodySmall>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/about/ValuesGrid.tsx
git commit -m "feat: migrate ValuesGrid to Typography components"
```

---

## Task 6: Migrate TeamGallery.tsx

**Files:**
- Modify: `src/components/about/TeamGallery.tsx`

- [ ] **Step 1: Replace Eyebrow div, h2, and caption spans with Typography components**

In `TeamGallery.tsx`, find and replace these three patterns:

**Pattern A — Eyebrow div (lines ~71–74):**
```tsx
// BEFORE
<div className="font-sans text-[10px] tracking-[0.16em] uppercase text-cyan flex items-center gap-3.5 mb-5">
  <span className="w-7 h-px bg-cyan" />
  Inside Bentala
</div>

// AFTER
<Eyebrow className="mb-5">Inside Bentala</Eyebrow>
```

**Pattern B — Section heading (line ~75):**
```tsx
// BEFORE
<h2 className="font-sans text-[clamp(44px,5vw,72px)] tracking-[-0.01em] text-white">
  The <span className="text-cyan">People</span>
</h2>

// AFTER
<SectionHeading>
  The <span className="text-cyan">People</span>
</SectionHeading>
```

**Pattern C — Caption span in PhotoCard (line ~61):**
```tsx
// BEFORE
<span className="font-sans text-[9px] tracking-[0.24em] uppercase text-cyan">{caption}</span>

// AFTER
<Caption>{caption}</Caption>
```

**Pattern D — Caption span in mobile grid (line ~94):**
```tsx
// BEFORE
<span className="font-sans text-[8px] tracking-[0.2em] uppercase text-cyan">{p.caption}</span>

// AFTER
<Caption className="text-[8px]">{p.caption}</Caption>
```

Add the import at the top:
```tsx
import { Eyebrow, SectionHeading, Caption } from "@/components/shared/Typography";
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/about/TeamGallery.tsx
git commit -m "feat: migrate TeamGallery to Typography components"
```

---

## Task 7: Migrate CtaBand.tsx

**Files:**
- Modify: `src/components/about/CtaBand.tsx`

- [ ] **Step 1: Replace h2 and p with token class and Body component**

```tsx
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { Body } from "@/components/shared/Typography";
import { WHATSAPP_URL } from "@/lib/constants";

export default function CtaBand() {
  return (
    <section className="py-24 px-5 md:px-[52px] bg-bg2 text-center relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 70%)",
        }}
      />
      <RevealOnScroll className="relative z-[2]">
        <h2 className="font-sans text-cta tracking-[0.03em] text-white leading-[0.95] mb-5">
          READY TO <span className="text-stroke-cyan">CREATE</span>
          <br />
          SOMETHING GREAT?
        </h2>
        <Body className="max-w-[480px] mx-auto mb-10 leading-[1.75]">
          Tell us about your brand and let&apos;s build content that takes you
          places — literally.
        </Body>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href={`${WHATSAPP_URL}?text=Hi%20Bentala%20Studio!`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-tag tracking-[0.15em] uppercase bg-cyan text-bg px-9 py-4 no-underline font-bold transition-all hover:bg-blue4 hover:shadow-[0_0_36px_rgba(0,212,255,0.4)] hover:-translate-y-0.5"
          >
            Chat on WhatsApp
          </a>
          <a
            href="/#portfolio"
            className="font-sans text-tag tracking-[0.15em] uppercase text-white border border-ghost px-9 py-4 no-underline transition-all hover:border-blue3 hover:text-blue4"
          >
            View Portfolio
          </a>
        </div>
      </RevealOnScroll>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/about/CtaBand.tsx
git commit -m "feat: migrate CtaBand to typography tokens"
```

---

## Task 8: Migrate HeroSection.tsx

**Files:**
- Modify: `src/components/home/HeroSection.tsx`

- [ ] **Step 1: Replace h1 and subtitle p with token classes**

Find and replace two elements in `HeroSection.tsx`:

**h1 (around line 95):**
```tsx
// BEFORE
<h1 className="font-sans text-[clamp(56px,8vw,110px)] leading-[0.92] tracking-[-0.01em] text-white animate-fade-up animate-fade-up-delay-1 [text-shadow:0_2px_32px_rgba(0,0,0,0.9),0_0_80px_rgba(0,0,0,0.6)]">

// AFTER
<h1 className="font-sans text-hero tracking-[-0.01em] text-white animate-fade-up animate-fade-up-delay-1 [text-shadow:0_2px_32px_rgba(0,0,0,0.9),0_0_80px_rgba(0,0,0,0.6)]">
```

**Subtitle p (around line 109):**
```tsx
// BEFORE
<p className="text-lg font-normal text-[rgba(240,244,255,0.92)] max-w-[560px] mx-auto mt-6 mb-10 leading-[1.75] animate-fade-up animate-fade-up-delay-2 [text-shadow:0_1px_20px_rgba(0,0,0,1),0_0_40px_rgba(0,0,0,0.8)]">

// AFTER
<p className="text-body-lg font-normal text-[rgba(240,244,255,0.92)] max-w-[560px] mx-auto mt-6 mb-10 leading-[1.75] animate-fade-up animate-fade-up-delay-2 [text-shadow:0_1px_20px_rgba(0,0,0,1),0_0_40px_rgba(0,0,0,0.8)]">
```

**CTA button (around line 116):**
```tsx
// BEFORE
className="font-sans text-sm tracking-[0.04em] ...

// AFTER
className="font-sans text-body-sm tracking-[0.04em] ...
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HeroSection.tsx
git commit -m "feat: migrate HeroSection to typography tokens"
```

---

## Task 9: Migrate CollabScroll.tsx

**Files:**
- Modify: `src/components/home/CollabScroll.tsx`

- [ ] **Step 1: Replace the h2 heading with token class**

Find the heading in the return JSX (around line 106):

```tsx
// BEFORE
<h2 className="font-sans text-[clamp(22px,2.5vw,34px)] font-bold tracking-[0.02em] text-white leading-none">
  Collaborations
</h2>

// AFTER
<h2 className="font-sans text-collab font-bold tracking-[0.02em] text-white">
  Collaborations
</h2>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/CollabScroll.tsx
git commit -m "feat: migrate CollabScroll to typography tokens"
```

---

## Task 10: Migrate PortfolioMasonry.tsx

**Files:**
- Modify: `src/components/home/PortfolioMasonry.tsx`

- [ ] **Step 1: Add Typography imports and replace heading and caption patterns**

Add import at the top of the file:
```tsx
import { SectionHeading, Caption } from "@/components/shared/Typography";
```

Find the section heading (search for `clamp` or `Portfolio`):
```tsx
// BEFORE — any pattern like:
<h2 className="font-sans text-[clamp(44px,5vw,72px)] ...">
  <span className="text-cyan">Portfolio</span>
</h2>

// AFTER
<SectionHeading>
  <span className="text-cyan">Portfolio</span>
</SectionHeading>
```

Find any caption spans (search for `text-\[9px\]` or `text-\[8px\]`):
```tsx
// BEFORE
<span className="font-sans text-[9px] tracking-[0.24em] uppercase text-cyan">

// AFTER — use Caption component
<Caption>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PortfolioMasonry.tsx
git commit -m "feat: migrate PortfolioMasonry to Typography components"
```

---

## Task 11: Migrate Navbar.tsx

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] **Step 1: Replace `text-[13px]` with `text-nav` on both nav links**

Find both Link elements (around lines 44 and 57):

```tsx
// BEFORE
className={`font-sans text-[13px] font-medium no-underline ...`}

// AFTER
className={`font-sans text-nav font-medium no-underline ...`}
```

Apply to both the "About Us" and "News" links.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && npx tsc --noEmit
```

- [ ] **Step 3: Final commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: migrate Navbar to typography tokens"
```

---

## Verification Checklist

After all tasks are done, run this grep to confirm no arbitrary font sizes remain:

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio" && grep -r 'text-\[[0-9]' src/components/ src/app/ --include="*.tsx" | grep -v "node_modules"
```

Expected: zero results (or only non-font-size arbitrary values like `text-[rgba(...)]`).
