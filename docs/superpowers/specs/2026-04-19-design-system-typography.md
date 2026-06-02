# Design System — Typography Tokens & Components

## Goal

Centralize all typography decisions so changing one value in one file updates every component across the site. Uses Tailwind config as the token layer and `Typography.tsx` as the pattern layer.

---

## Architecture

Two files own the entire typography system:

1. **`tailwind.config.ts`** — defines named font-size tokens. Changing a value here propagates to every component using that class.
2. **`src/components/shared/Typography.tsx`** — defines compound UI patterns (Eyebrow, headings, body). Changing a pattern here updates every component that uses it.

All other components become consumers — they import from `Typography.tsx` and use Tailwind token classes. They own zero typography decisions of their own.

---

## Token Definitions (`tailwind.config.ts`)

Add a `fontSize` block inside `theme.extend`:

```ts
fontSize: {
  // Labels & metadata — small uppercase text (letterSpacing handled in Typography.tsx)
  'label':    ['9px',  { lineHeight: '1.2' }],
  'meta':     ['10px', { lineHeight: '1.2' }],
  'tag':      ['11px', { lineHeight: '1.2' }],
  // Body — reading text
  'body-sm':  ['15px', { lineHeight: '1.75' }],
  'body':     ['17px', { lineHeight: '1.9'  }],
  'body-lg':  ['19px', { lineHeight: '1.85' }],
  // Headings — responsive clamp
  'story':    ['clamp(40px,4.5vw,64px)',  { lineHeight: '0.95' }],
  'section':  ['clamp(44px,5vw,72px)',    { lineHeight: '1.05' }],
  'page':     ['clamp(64px,9vw,130px)',   { lineHeight: '0.88' }],
}
```

> `letterSpacing` is intentionally excluded from label/meta tokens — each Typography component applies its own tracking via `className`. This allows `text-label` to be used without forced wide spacing in edge cases.

Existing color tokens (`cyan`, `dim`, `bg`, `bg2`, `bg3`, etc.) are already correct — no changes needed.

---

## Pattern Components (`Typography.tsx`)

Update each component to use token classes instead of arbitrary values:

| Component | Old class | New class |
|---|---|---|
| `<Eyebrow>` | `text-[10px]` | `text-meta` |
| `<PageHeading>` | `text-[clamp(64px,9vw,130px)]` | `text-page` |
| `<SectionHeading>` | `text-[clamp(44px,5vw,72px)]` | `text-section` |
| `<StoryHeading>` | `text-[clamp(40px,4.5vw,64px)]` | `text-story` |
| `<Body>` | `text-[17px]` | `text-body` |
| `<BodySmall>` | `text-[15px]` | `text-body-sm` |
| `<Caption>` | `text-[9px]` | `text-label` |
| `<MetaLabel>` | `text-[10px]` | `text-meta` |

---

## Component Migration Scope

Every component that hardcodes a font size must be updated to use Typography components or token classes. No arbitrary `text-[Npx]` values should remain after migration.

### Priority 1 — About page (most active, already partially migrated)
- `src/components/about/PageHero.tsx`
- `src/components/about/StatsBanner.tsx`
- `src/components/about/ValuesGrid.tsx`
- `src/components/about/TeamGallery.tsx`
- `src/components/about/CtaBand.tsx`

### Priority 2 — Home page
- `src/components/home/HeroSection.tsx`
- `src/components/home/CollabScroll.tsx`
- `src/components/home/PortfolioMasonry.tsx`
- `src/components/home/StartCollaborationDialog.tsx`

### Priority 3 — Layout
- `src/components/layout/Navbar.tsx`
- `src/components/layout/BackToTop.tsx`

`StorySection.tsx` is already migrated — skip.

---

## Migration Rules (per component)

For each component:
1. Replace `text-[9px]` → `text-label`, `text-[10px]` → `text-meta`, `text-[11px]` → `text-tag`
2. Replace `text-[15px]` → `text-body-sm`, `text-[17px]` → `text-body`, `text-[19px]` → `text-body-lg`
3. Replace clamp heading patterns → `text-story`, `text-section`, or `text-page`
4. Replace inline eyebrow div patterns with `<Eyebrow>` from Typography
5. Replace h2 heading patterns with `<SectionHeading>` or `<StoryHeading>`
6. Replace paragraph patterns with `<Body>` or `<BodySmall>` — pass extra classes via `className`
7. Do not change layout, colors, spacing, or hover effects — only typography

---

## What Does NOT Change

- Colors (`text-cyan`, `text-dim`, `text-white`) — already tokenized in Tailwind config
- Spacing (`mb-*`, `px-*`, `py-*`) — out of scope
- Animations and hover effects — out of scope
- Component layout and structure — out of scope
- `StorySection.tsx` — already done, skip

---

## Success Criteria

- Zero `text-[Npx]` arbitrary font size values remain in any component
- Zero inline `clamp(...)` font size patterns remain
- Every eyebrow pattern uses `<Eyebrow>`
- Every section h2 uses `<SectionHeading>` or `<StoryHeading>`
- Every paragraph uses `<Body>` or `<BodySmall>`
- Changing `body` in `tailwind.config.ts` updates all paragraphs site-wide
- Changing `<Body>` in `Typography.tsx` updates all paragraph styles site-wide
