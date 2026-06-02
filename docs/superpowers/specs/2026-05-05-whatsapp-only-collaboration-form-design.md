# WhatsApp-Only Collaboration Form — Design

**Date:** 2026-05-05
**Status:** Approved (brainstorming)
**Scope:** `bentala-studio` (public form) + `bentala-nextjs` (admin editor cleanup)

---

## Goal

Sederhanakan flow "Start Collaboration": form hanya minta nomor WhatsApp (tidak ada
opsi email), data tetap tersimpan ke `bsi_leads`, lalu setelah submit user
otomatis di-redirect ke WhatsApp dengan pesan terisi otomatis. Hilangkan
notifikasi otomatis (Resend, Fonnte) — tim cukup terima pesan langsung dari
client di WhatsApp.

## Non-Goals

- Tidak menambahkan integrasi notifikasi baru (Slack, email otomatis, dsb).
- Tidak mengubah skema tabel `bsi_leads` (kolom `contact_type` &
  `contact_value` tetap ada untuk backward compat dengan lead lama).
- Tidak mengubah dashboard admin `/website/leads`.

## Architecture

```
[Client di bentala-studio]
        │
        │ 1. Isi form (Nama, Brand, No. WA, Kebutuhan, Catatan)
        │ 2. Klik "Kirim & Lanjut ke WhatsApp"
        ▼
[POST /api/leads/submit]
        │
        │ 3. Validasi (zod) + rate limit + honeypot
        │ 4. Insert ke bsi_leads (contact_type fixed = "whatsapp")
        ▼
[Response 200]
        │
        │ 5. Frontend build wa.me URL dari hero.lead_whatsapp_number
        │ 6. window.location.href = waUrl  (same tab — tidak ke-block)
        ▼
[WhatsApp client app terbuka, pesan sudah terisi]
        │
        │ 7. Client tinggal press Send
        ▼
[Tim Bentala terima pesan di nomor WA tujuan]
```

## Components

### 1. Form (`components/home/StartCollaborationDialog.tsx`)

**Field yang ada:**

| Field            | Type     | Required | Validasi                                  |
| ---------------- | -------- | -------- | ----------------------------------------- |
| Nama Lengkap     | text     | yes      | min 2 karakter                            |
| Nama Brand       | text     | yes      | min 1 karakter                            |
| Nomor WhatsApp   | tel      | yes      | `isValidPhoneNumber` (libphonenumber-js)  |
| Jenis Kebutuhan  | dropdown | yes      | salah satu dari `bsi_services` + "discuss"|
| Catatan          | textarea | no       | max 500 karakter                          |

**Yang dihapus:**

- Toggle WhatsApp/Email
- Field email (mode email)
- Branch validasi email di schema

**Tombol submit:** `Kirim & Lanjut ke WhatsApp →`

**On submit:**

1. POST ke `/api/leads/submit`.
2. Bila gagal: tampilkan error inline, tombol retry. **Jangan redirect.**
3. Bila sukses:
   - Build `waUrl = wa.me/<digits>?text=<encoded message>` (dari
     `hero.lead_whatsapp_number`, fallback ke konstanta lama bila kosong).
   - `window.location.href = waUrl` (same tab — pasti tidak ke-block).

**Format pesan WhatsApp** (built client-side):

```
Hi Bentala Studio! Saya sudah mengisi form kolaborasi.

Nama: <full_name>
Brand: <brand_name>
WhatsApp: <whatsapp_number>
Kebutuhan: <project_type>
Catatan: <notes or "Tidak ada">
```

Field "Kontak (Email/WhatsApp)" yang lama menjadi cukup "WhatsApp" saja.

### 2. Schema (`lib/lead-schema.ts`)

```ts
leadSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  brand_name: z.string().trim().min(1, "Nama brand wajib diisi"),
  whatsapp_number: z.string().refine(isValidPhoneNumber, {
    message: "Format nomor WA tidak valid (contoh: +6281234567890)",
  }),
  project_type: z.string().trim().min(1, "Pilih jenis kebutuhan"),
  notes: z.string().max(500).optional(),
});
```

`contact_type` & `contact_value` di-drop dari schema. API route mengisi
`contact_type='whatsapp'` & `contact_value=<whatsapp_number>` saat insert ke
`bsi_leads` agar kolom DB lama tetap konsisten.

### 3. API (`app/api/leads/submit/route.ts`)

- Validasi pakai schema baru.
- Insert ke `bsi_leads`:
  - `contact_type = "whatsapp"` (hard-coded)
  - `contact_value = data.whatsapp_number`
  - field lain seperti sebelumnya
- **Hapus**: panggilan `dispatchLeadNotifications()`.
- Tetap: rate limit (`leads`, 5/hour), honeypot, visitor → lead linking.

### 4. Hero Editor (`bentala-nextjs/app/(dashboard)/website/home/hero/page.tsx`)

- Section title: `"Tombol Hero & Penerima Lead"` → **`"Tombol Hero & WhatsApp Tujuan"`**.
- **Hapus** field "Email Penerima" dari UI (kolom DB `lead_email` tetap ada untuk
  backward compat — bisa di-revert kalau di kemudian hari email diaktifkan lagi).
- Field yang tersisa: Tulisan Tombol, Link Langsung Tombol (opsional), WhatsApp Penerima.

### 5. File yang dihapus

- `bentala-studio/src/lib/lead-notify.ts` — tidak dipanggil lagi.

### 6. Env vars yang tidak perlu lagi

- `RESEND_API_KEY`
- `LEAD_EMAIL_FROM`
- `FONNTE_TOKEN`

(Boleh dibiarkan di `.env.local` lama; tidak ada konsekuensi.)

## Data Flow & Edge Cases

| Kondisi                                  | Perilaku                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| API insert sukses                        | Redirect ke wa.me                                                       |
| API insert gagal (5xx, network)          | Tampil error + tombol "Coba Lagi". Tidak redirect, tidak buang data form|
| Honeypot terisi (bot)                    | Fake-200 dari server. Frontend tetap redirect (pengalaman bot tidak penting)|
| `lead_whatsapp_number` di hero kosong    | Fallback ke `WHATSAPP_URL` konstanta lama                               |
| Rate limit (>5 lead/jam dari satu IP)    | API return 429. Frontend tampilkan pesan rate-limit, tidak redirect     |
| Validasi gagal (zod)                     | API return 400. Inline error per-field di form                          |

## Testing

- **Manual**: submit form di dev → verifikasi (a) lead muncul di
  `/website/leads`, (b) WhatsApp terbuka dengan pesan benar, (c) nomor
  tujuan = `lead_whatsapp_number` dari hero settings.
- **Network gagal**: matikan internet → submit → harus tampil error, **tidak**
  redirect.
- **Validation**: submit dengan nomor invalid → tampil error per-field.
- **Rate limit**: submit 6× dalam 1 jam → ke-6 harus dapat error 429.

## Migration / Deployment

1. Deploy bentala-studio → form baru otomatis aktif.
2. Deploy bentala-nextjs → editor admin sembunyikan field email.
3. Tidak ada migrasi DB.
4. Env vars Resend/Fonnte boleh di-cleanup.

## Rollback

Bila ada masalah, revert dua commit (bentala-studio + bentala-nextjs) dan
restore `lead-notify.ts`. Skema DB tidak berubah, jadi rollback aman.
