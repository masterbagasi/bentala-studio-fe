# Bentala Studio — Design System Guide

Panduan ini menjelaskan cara mengubah tampilan teks, warna, dan pola UI di seluruh site
hanya dengan mengedit beberapa file.

---

## Prinsip Dasarnya

Ada **dua file utama** yang mengontrol tampilan:

| File | Mengontrol apa |
|---|---|
| `tailwind.config.ts` | Ukuran teks, warna — "token" dasar |
| `src/components/shared/Typography.tsx` | Pola UI berulang (Eyebrow, Heading, Body, dll) |

**Aturan sederhananya:**
- Mau ubah ukuran font? → edit `tailwind.config.ts`
- Mau ubah pola (misalnya garis cyan sebelum label)? → edit `Typography.tsx`

---

## Token Warna — `tailwind.config.ts`

Warna sudah terpusat di sini. Pakai nama ini di seluruh komponen.

```
bg        #08090d   → background utama (paling gelap)
bg2       #0d0f18   → background section
bg3       #111420   → background card
cyan      #00d4ff   → warna aksen utama (biru terang)
white     #f0f4ff   → teks putih
dim       rgba(240,244,255,0.55) → teks abu-abu
blue1–4             → variasi biru (tombol, hover)
```

**Contoh pakai:** `text-cyan`, `bg-bg2`, `text-dim`

---

## Token Ukuran Teks — `tailwind.config.ts`

Setelah sistem ini diimplementasi, nama-nama ini tersedia sebagai Tailwind class.

### Label & Metadata (teks kecil, uppercase)
| Class | Ukuran | Dipakai di |
|---|---|---|
| `text-label` | 9px | Caption foto galeri, tag kecil |
| `text-meta` | 10px | Eyebrow label ("Our Story"), index number |
| `text-tag` | 11px | Tombol CTA, link navbar |

### Body (teks bacaan)
| Class | Ukuran | Dipakai di |
|---|---|---|
| `text-body-sm` | 15px | Deskripsi card, entity desc |
| `text-body` | 17px | Paragraf utama semua section |
| `text-body-lg` | 19px | Subtitle hero |

### Heading
| Class | Ukuran | Dipakai di |
|---|---|---|
| `text-story` | clamp(40px → 64px) | H2 StorySection |
| `text-section` | clamp(44px → 72px) | H2 semua section lain |
| `text-page` | clamp(64px → 130px) | H1 halaman hero |

**Cara ubah ukuran body di seluruh site:**
Buka `tailwind.config.ts`, cari `body`, ganti angkanya. Semua teks dengan class `text-body` langsung ikut.

---

## Pola UI — `src/components/shared/Typography.tsx`

Komponen-komponen ini siap pakai di mana saja. Import dan gunakan langsung.

### `<Eyebrow>`
Label kecil cyan dengan garis di depannya. Dipakai di pembuka setiap section.
```tsx
<Eyebrow>Our Story</Eyebrow>
// → "— OUR STORY" dengan garis cyan
```

### `<PageHeading>`
H1 raksasa untuk halaman hero.
```tsx
<PageHeading>WHO WE <em>ARE</em></PageHeading>
```

### `<SectionHeading>`
H2 untuk pembuka section (ValuesGrid, TeamGallery, dll).
```tsx
<SectionHeading>The <span className="text-cyan">People</span></SectionHeading>
```

### `<StoryHeading>`
H2 khusus StorySection — sedikit lebih kecil dari SectionHeading.
```tsx
<StoryHeading>Born In <span className="text-cyan">Indonesia</span></StoryHeading>
```

### `<Body>`
Paragraf utama — 17px, light, line-height longgar.
```tsx
<Body className="mb-8">Bentala adalah creative ecosystem...</Body>
```

### `<BodySmall>`
Paragraf sekunder — 15px, untuk deskripsi card, entity, dll.
```tsx
<BodySmall>Media platform yang menyajikan...</BodySmall>
```

### `<Caption>`
Label foto kecil — 9px uppercase tracking lebar.
```tsx
<Caption>Cinema Setup</Caption>
```

### `<MetaLabel>`
Metadata kecil — 10px uppercase, warna dim.
```tsx
<MetaLabel>Strategy · Project Management</MetaLabel>
```

---

## Cara Pakai className untuk Override

Semua komponen Typography menerima `className` untuk override spesifik:

```tsx
// Tambah margin
<Body className="mb-8">teks</Body>

// Ganti warna untuk konteks tertentu
<Body className="text-white">teks lebih terang</Body>

// Komponen lain tetap pakai text-dim standar
<Body>teks lain — tetap dim</Body>
```

---

## Komponen Lain di Project

### Layout
| File | Fungsi |
|---|---|
| `src/components/layout/Navbar.tsx` | Navigasi atas, sticky |
| `src/components/layout/BackToTop.tsx` | Tombol scroll ke atas |

### Home
| File | Fungsi |
|---|---|
| `src/components/home/HeroSection.tsx` | Hero halaman utama |
| `src/components/home/CollabScroll.tsx` | Scroll horizontal brand collaborations |
| `src/components/home/PortfolioMasonry.tsx` | Grid masonry portfolio |
| `src/components/home/StartCollaborationDialog.tsx` | Dialog form lead capture |

### About
| File | Fungsi |
|---|---|
| `src/components/about/PageHero.tsx` | Hero "WHO WE ARE" dengan background image |
| `src/components/about/StorySection.tsx` | Cerita + visi/misi |
| `src/components/about/StatsBanner.tsx` | Banner angka statistik |
| `src/components/about/ValuesGrid.tsx` | Grid 6 nilai perusahaan |
| `src/components/about/TeamGallery.tsx` | Bento grid foto team & BTS |
| `src/components/about/CtaBand.tsx` | CTA penutup halaman about |

### Shared (dipakai di mana saja)
| File | Fungsi |
|---|---|
| `src/components/shared/Typography.tsx` | Semua pola teks — **edit di sini untuk ubah tampilan** |
| `src/components/shared/RevealOnScroll.tsx` | Animasi fade-up saat scroll |

---

## Ringkasan: Mau ubah apa, buka file mana?

| Kebutuhan | Buka file ini |
|---|---|
| Semua teks body terlalu kecil | `tailwind.config.ts` → ubah `body` |
| Heading section terlalu besar | `tailwind.config.ts` → ubah `section` |
| Warna aksen cyan ganti ke warna lain | `tailwind.config.ts` → ubah `cyan` |
| Eyebrow garis mau lebih panjang | `Typography.tsx` → ubah `<Eyebrow>` |
| Layout section tertentu | Component file-nya langsung |
