# WhatsApp-Only Collaboration Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sederhanakan form Start Collaboration jadi WhatsApp-only — hapus opsi email, auto-redirect ke wa.me setelah submit, hapus notifikasi otomatis (Resend/Fonnte). Data tetap tersimpan ke `bsi_leads`.

**Architecture:** Modifikasi minimal di komponen existing (`StartCollaborationDialog`, schema, API route). Tidak ada migrasi DB — kolom `contact_type`/`contact_value` di `bsi_leads` tetap, tapi di-set fixed `"whatsapp"` saat insert. Frontend submit → POST `/api/leads/submit` → tunggu sukses → `window.location.href = wa.me URL`. Pop-up blocker tidak masalah karena redirect dilakukan saat user gesture (klik submit).

**Tech Stack:** Next.js 14 (app router), React Hook Form, Zod, libphonenumber-js, Supabase.

**Spec:** [docs/superpowers/specs/2026-05-05-whatsapp-only-collaboration-form-design.md](../specs/2026-05-05-whatsapp-only-collaboration-form-design.md)

**Project layout:**
- `bentala-studio/` — public site (form, API, schema)
- `bentala-nextjs/` — admin (hero editor cleanup)

Both projects share Supabase. **Tidak perlu migrasi SQL.**

---

## Task 1: Sederhanakan lead schema

**Files:**
- Modify: `bentala-studio/src/lib/lead-schema.ts`

- [ ] **Step 1: Ganti isi lead-schema.ts**

Replace seluruh file dengan:

```ts
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const leadSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  brand_name: z.string().trim().min(1, "Nama brand wajib diisi"),
  whatsapp_number: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi")
    .refine((v) => isValidPhoneNumber(v), {
      message: "Format nomor WA tidak valid (contoh: +6281234567890)",
    }),
  project_type: z.string().trim().min(1, "Pilih jenis kebutuhan"),
  notes: z.string().max(500, "Maksimal 500 karakter").optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export type LeadPayload = LeadFormData & {
  submitted_at: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  user_agent?: string;
};
```

- [ ] **Step 2: Typecheck**

Run: `cd bentala-studio && npx tsc --noEmit 2>&1 | grep -v "src/app/api/track" | head -30`

Expected: errors di file lain yang masih reference `contact_type`/`contact_value` (akan dibereskan di task selanjutnya). **Tidak boleh** error di `lead-schema.ts` itu sendiri.

- [ ] **Step 3: Commit**

```bash
cd bentala-studio
git add src/lib/lead-schema.ts
git commit -m "feat(leads): simplify schema to WhatsApp-only

Drops contact_type enum and contact_value field. Replaces with a
single whatsapp_number field validated by libphonenumber-js.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Update API route — pakai schema baru, hapus notifikasi otomatis

**Files:**
- Modify: `bentala-studio/src/app/api/leads/submit/route.ts`

- [ ] **Step 1: Replace seluruh isi file**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { leadSchema, LeadPayload } from "@/lib/lead-schema";
import { supabaseServer } from "@/lib/supabase-server";
import { checkRateLimit, getClientIdentifier, HONEYPOT_FIELD } from "@/lib/server-utils";

const serverSchema = leadSchema.extend({
  submitted_at: z.string().datetime(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referrer: z.string().optional(),
  user_agent: z.string().optional(),
  visitor_id: z.string().optional(),
  [HONEYPOT_FIELD]: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (typeof body?.[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].trim() !== "") {
      // Bot detected — pretend it succeeded so they don't retry.
      return NextResponse.json({ success: true });
    }

    const data = serverSchema.parse(body) as LeadPayload & { visitor_id?: string };

    const identifier = getClientIdentifier(req);
    const allowed = await checkRateLimit("leads", identifier, 3600, 5);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak permintaan. Coba lagi dalam 1 jam." },
        { status: 429 }
      );
    }

    if (!supabaseServer) {
      console.error("[leads] Supabase server client not configured");
      return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
    }

    // Existing bsi_leads schema still has contact_type & contact_value columns.
    // We keep those filled (hard-coded to whatsapp) so historical lead rows
    // remain shape-compatible with the new schema-only flow.
    const insertResult = await supabaseServer
      .from("bsi_leads")
      .insert({
        full_name: data.full_name,
        brand_name: data.brand_name,
        contact_type: "whatsapp",
        contact_value: data.whatsapp_number,
        project_type: data.project_type,
        notes: data.notes ?? "",
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        referrer: data.referrer ?? null,
        user_agent: data.user_agent ?? null,
        submitted_at: data.submitted_at,
      })
      .select("id")
      .single();

    if (insertResult.error) {
      console.error("[leads] insert failed", insertResult.error);
      return NextResponse.json({ success: false, error: "Failed to save" }, { status: 500 });
    }

    if (data.visitor_id) {
      // Best-effort link visitor → lead. Failure here doesn't fail the request.
      await supabaseServer
        .from("bsi_visitors")
        .update({ is_lead: true, lead_id: insertResult.data.id })
        .eq("visitor_id", data.visitor_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.issues }, { status: 400 });
    }
    console.error("[leads] error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd bentala-studio && npx tsc --noEmit 2>&1 | grep "api/leads/submit/route" | head -5`

Expected: tidak ada error pada file ini.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/leads/submit/route.ts
git commit -m "feat(leads): drop notification dispatch, hard-code contact_type to whatsapp

Removes call to dispatchLeadNotifications (Resend/Fonnte) — clients
will be redirected straight to wa.me instead of relying on automated
team notifications. Insert payload now hard-codes contact_type to
'whatsapp' and writes the WA number into contact_value to keep the
existing bsi_leads schema valid.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Hapus file `lead-notify.ts`

**Files:**
- Delete: `bentala-studio/src/lib/lead-notify.ts`

- [ ] **Step 1: Hapus file**

```bash
cd bentala-studio
rm src/lib/lead-notify.ts
```

- [ ] **Step 2: Verifikasi tidak ada import yang nyangkut**

Run: `grep -rn "lead-notify" src/`

Expected: empty (no output).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -v "src/app/api/track" | head -10`

Expected: no errors related to lead-notify.

- [ ] **Step 4: Commit**

```bash
git add -A src/lib/
git commit -m "chore: remove unused lead-notify helper

No longer called after switching to WhatsApp-only redirect flow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Sederhanakan StartCollaborationDialog — hapus toggle email, auto-redirect

**Files:**
- Modify: `bentala-studio/src/components/home/StartCollaborationDialog.tsx`

Ini task terbesar. Ada 4 perubahan:
1. Hapus state `contactType` dan `contact_type`/`contact_value` di register
2. Tambah `whatsappNumber` field via `PhoneInput`
3. Hapus `SuccessContent` step + countdown logic — submit langsung redirect
4. Update `buildWaMessage` agar pakai field baru

- [ ] **Step 1: Replace blok atas (imports, types, helpers) — baris 1-95**

Cari blok dari `"use client";` sampai akhir `function buildWaMessage(...) { ... }`. Replace dengan:

```ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, LeadFormData } from "@/lib/lead-schema";
import { WHATSAPP_URL } from "@/lib/constants";
import { getCurrentVisitorId, trackEvent } from "@/lib/tracker";
import type { Service } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  /** Team WhatsApp number in international format (e.g. "+6281284731599"). */
  leadWhatsappNumber?: string;
}

const DISCUSS_VALUE = "discuss";
const DISCUSS_LABEL = "Belum yakin, mau diskusi dulu";

interface ProjectOption {
  value: string;
  label: string;
  sub: string;
}

function buildProjectOptions(services: Service[]): ProjectOption[] {
  const fromServices = services.map((s) => ({ value: s.name, label: s.name, sub: "" }));
  return [...fromServices, { value: DISCUSS_VALUE, label: DISCUSS_LABEL, sub: "" }];
}

/** Convert "+6281234..." or "081234..." to a wa.me-compatible URL. */
function toWaUrl(rawNumber: string | undefined): string {
  if (!rawNumber) return WHATSAPP_URL;
  const digits = rawNumber.replace(/[^\d]/g, "");
  if (!digits) return WHATSAPP_URL;
  return `https://wa.me/${digits}`;
}

function buildWaMessage(data: LeadFormData): string {
  const projectLabel = data.project_type === DISCUSS_VALUE ? DISCUSS_LABEL : data.project_type;

  return [
    "Hi Bentala Studio! Saya sudah mengisi form kolaborasi.",
    "",
    `Nama: ${data.full_name}`,
    `Brand: ${data.brand_name}`,
    `WhatsApp: ${data.whatsapp_number}`,
    `Kebutuhan: ${projectLabel}`,
    `Catatan: ${data.notes?.trim() || "Tidak ada"}`,
  ].join("\n");
}
```

- [ ] **Step 2: Replace `StartCollaborationDialog` body — drop step state, drop SuccessContent**

Cari `export default function StartCollaborationDialog({...}: Props) {` dan replace seluruh body sampai sebelum `interface FormContentProps {` dengan:

```ts
export default function StartCollaborationDialog({
  isOpen,
  onClose,
  services,
  leadWhatsappNumber,
}: Props) {
  const projectOptions = useMemo(() => buildProjectOptions(services), [services]);
  const waBaseUrl = useMemo(() => toWaUrl(leadWhatsappNumber), [leadWhatsappNumber]);

  const [submitError, setSubmitError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    mode: "onChange",
  });

  const notesValue = watch("notes") ?? "";
  const projectType = watch("project_type");

  useEffect(() => {
    if (isOpen) {
      setSubmitError(false);
      reset();
      void trackEvent("form_open", "start_collaboration");
    }
  }, [isOpen, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const onSubmit = async (data: LeadFormData) => {
    const params = new URLSearchParams(window.location.search);
    const honeypot = (document.getElementById("website_url_extra") as HTMLInputElement | null)?.value ?? "";
    const payload = {
      ...data,
      submitted_at: new Date().toISOString(),
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
      visitor_id: getCurrentVisitorId() ?? undefined,
      website_url_extra: honeypot,
    };

    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submit failed");

      void trackEvent("form_submit", "start_collaboration", {
        project_type: data.project_type,
      });

      // Redirect synchronously inside the user-gesture handler so pop-up
      // blockers don't intervene. Same-tab navigation also avoids new-window
      // restrictions on Safari/Firefox strict mode.
      const waMessage = buildWaMessage(data);
      window.location.href = `${waBaseUrl}?text=${encodeURIComponent(waMessage)}`;
    } catch {
      setSubmitError(true);
      void trackEvent("form_error", "start_collaboration");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-dialog-title"
    >
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-[560px] max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto bg-bg2 border border-[rgba(0,212,255,0.15)] sm:rounded-2xl rounded-t-2xl shadow-[0_-8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,212,255,0.06)] scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        <FormContent
          errors={errors}
          isSubmitting={isSubmitting}
          isValid={isValid}
          notesValue={notesValue}
          projectType={projectType}
          projectOptions={projectOptions}
          register={register}
          setValue={setValue}
          onSubmit={handleSubmit(onSubmit)}
          onClose={onClose}
          submitError={submitError}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Replace `FormContentProps` interface dan `FormContent` body — hilangkan toggle, ganti contact_value jadi whatsapp_number**

Cari `interface FormContentProps {` sampai akhir `function FormContent({...}: FormContentProps) {` (header function-nya). Replace dengan:

```ts
interface FormContentProps {
  errors: ReturnType<typeof useForm<LeadFormData>>["formState"]["errors"];
  isSubmitting: boolean;
  isValid: boolean;
  notesValue: string;
  projectType: string | undefined;
  projectOptions: ProjectOption[];
  register: ReturnType<typeof useForm<LeadFormData>>["register"];
  setValue: UseFormSetValue<LeadFormData>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitError: boolean;
}

function FormContent({
  errors,
  isSubmitting,
  isValid,
  notesValue,
  projectType,
  projectOptions,
  register,
  setValue,
  onSubmit,
  onClose,
  submitError,
}: FormContentProps) {
```

- [ ] **Step 4: Replace blok kontak — drop toggle, langsung phone input**

Cari blok dari komentar `Kontak Preferensi` sampai akhir error display untuk `contact_value`. Itu blok:

```tsx
        <div className="flex flex-col gap-2">
          <label className="font-sans text-meta tracking-[0.14em] uppercase text-dim flex items-center gap-1">
            Kontak Preferensi <span className="text-cyan">*</span>
          </label>
          <div className="flex rounded-lg border border-[rgba(240,244,255,0.1)] overflow-hidden w-fit">
            {(["whatsapp", "email"] as const).map((type) => (
              <button
                ... (toggle buttons)
              </button>
            ))}
          </div>
          {contactType === "whatsapp" ? (
            <PhoneInput setValue={setValue} error={errors.contact_value?.message} />
          ) : (
            <input
              ... (email input)
            />
          )}
          {errors.contact_value && (
            <p className="font-sans text-tag text-red-400 mt-0.5">
              {errors.contact_value.message}
            </p>
          )}
        </div>
```

Replace dengan:

```tsx
        <div className="flex flex-col gap-2">
          <label className="font-sans text-meta tracking-[0.14em] uppercase text-dim flex items-center gap-1">
            Nomor WhatsApp <span className="text-cyan">*</span>
          </label>
          <PhoneInput setValue={setValue} error={errors.whatsapp_number?.message} />
          {errors.whatsapp_number && (
            <p className="font-sans text-tag text-red-400 mt-0.5">
              {errors.whatsapp_number.message}
            </p>
          )}
        </div>
```

- [ ] **Step 5: Update PhoneInput agar set `whatsapp_number` (bukan `contact_value`)**

Cari fungsi `PhoneInput` di file yang sama. Update setValue calls:

Cari semua: `setValue("contact_value", ...)`
Replace ke: `setValue("whatsapp_number", ...)`

Cari prop type `setValue: ...` di PhoneInputProps interface. Replace setValue call typing dari `(name: "contact_value", ...)` ke `(name: "whatsapp_number", ...)`. Atau yang lebih aman, gunakan generic `UseFormSetValue<LeadFormData>` jika belum.

Lihat juga error prop di PhoneInput — pastikan referensinya ke `errors.whatsapp_number?.message`.

- [ ] **Step 6: Update tombol submit text**

Cari `Kirim & Mulai Kolaborasi →` di file ini. Replace dengan:

```tsx
              "Kirim & Lanjut ke WhatsApp →"
```

- [ ] **Step 7: Hapus `SuccessContent` dan dependencies-nya**

Cari `interface SuccessContentProps {` dan hapus seluruh interface + function `SuccessContent` body sampai `}`-nya yang menutup function. Juga hapus `import { BodySmall } from "@/components/shared/Typography";` jika tidak dipakai lagi.

- [ ] **Step 8: Typecheck**

Run: `cd bentala-studio && npx tsc --noEmit 2>&1 | grep -v "src/app/api/track" | head -30`

Expected: nol error di `StartCollaborationDialog.tsx`. Mungkin masih ada error di `CtaBand.tsx` atau `HeroSection.tsx` (karena props `leadEmail` belum di-cleanup) — itu akan diselesaikan di task selanjutnya.

- [ ] **Step 9: Manual smoke test (opsional, dilakukan di akhir setelah cleanup task lain)**

Catat: jangan run dev server di tengah task ini — banyak file lain masih break. Test manual di akhir Task 7.

- [ ] **Step 10: Commit**

```bash
git add src/components/home/StartCollaborationDialog.tsx
git commit -m "feat(form): WhatsApp-only flow with auto-redirect

Drops the WhatsApp/Email toggle in favour of a single mandatory
WhatsApp number field. After successful submit, redirects the user to
wa.me via window.location (same tab) so the pop-up blocker doesn't
intervene. SuccessContent step + countdown removed; the WhatsApp
client is now the success surface.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Cleanup CtaBand — hapus prop `leadEmail`

**Files:**
- Modify: `bentala-studio/src/components/about/CtaBand.tsx`

- [ ] **Step 1: Hapus `leadEmail` dari Props dan dialog usage**

Cari blok:

```tsx
interface Props {
  services: Service[];
  leadWhatsappNumber?: string;
  leadEmail?: string;
}

export default function CtaBand({ services, leadWhatsappNumber, leadEmail }: Props) {
```

Replace dengan:

```tsx
interface Props {
  services: Service[];
  leadWhatsappNumber?: string;
}

export default function CtaBand({ services, leadWhatsappNumber }: Props) {
```

Lalu cari:

```tsx
      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        services={services}
        leadWhatsappNumber={leadWhatsappNumber}
        leadEmail={leadEmail}
      />
```

Replace dengan:

```tsx
      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        services={services}
        leadWhatsappNumber={leadWhatsappNumber}
      />
```

- [ ] **Step 2: Typecheck**

Run: `cd bentala-studio && npx tsc --noEmit 2>&1 | grep "CtaBand"`

Expected: empty.

- [ ] **Step 3: Commit**

```bash
git add src/components/about/CtaBand.tsx
git commit -m "refactor(about): drop leadEmail prop from CtaBand

The form is WhatsApp-only now; email destination is no longer used.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Cleanup HeroSection (home) + about page — hapus `leadEmail` data

**Files:**
- Modify: `bentala-studio/src/components/home/HeroSection.tsx`
- Modify: `bentala-studio/src/app/about/page.tsx`

- [ ] **Step 1: Hapus `leadEmail` di HeroSection**

Cari di HeroSection.tsx:

```tsx
      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        services={services}
        leadWhatsappNumber={hero.lead_whatsapp_number}
        leadEmail={hero.lead_email}
      />
```

Replace dengan:

```tsx
      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        services={services}
        leadWhatsappNumber={hero.lead_whatsapp_number}
      />
```

- [ ] **Step 2: Hapus `leadEmail` di about page (`src/app/about/page.tsx`)**

Cari blok `getData` yang fetch `bsi_hero`:

```ts
      supabase
        .from("bsi_hero")
        .select("lead_whatsapp_number, lead_email")
        ...
```

Replace dengan:

```ts
      supabase
        .from("bsi_hero")
        .select("lead_whatsapp_number")
        ...
```

Lalu cari `heroLead?.lead_email` dan hapus baris itu di `<CtaBand>`:

```tsx
      <CtaBand
        services={services}
        leadWhatsappNumber={heroLead?.lead_whatsapp_number}
        leadEmail={heroLead?.lead_email}
      />
```

Replace dengan:

```tsx
      <CtaBand
        services={services}
        leadWhatsappNumber={heroLead?.lead_whatsapp_number}
      />
```

Update juga type cast di getData:

```ts
      heroLead: (heroRes.data as Pick<HeroData, "lead_whatsapp_number" | "lead_email"> | null) ?? null,
```

Ke:

```ts
      heroLead: (heroRes.data as Pick<HeroData, "lead_whatsapp_number"> | null) ?? null,
```

- [ ] **Step 3: Typecheck**

Run: `cd bentala-studio && npx tsc --noEmit 2>&1 | grep -vE "src/app/api/track" | head -10`

Expected: nol error.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HeroSection.tsx src/app/about/page.tsx
git commit -m "refactor: stop passing leadEmail through hero/about pages

WhatsApp-only flow no longer needs the email destination.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Hero editor admin — hapus field "Email Penerima"

**Files:**
- Modify: `bentala-nextjs/app/(dashboard)/website/home/hero/page.tsx`

- [ ] **Step 1: Update section title dan hapus FormField "Email Penerima"**

Cari blok:

```tsx
          <Section title="Tombol Hero & Penerima Lead">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Tulisan di Tombol" required>
                ...
              </FormField>
              <FormField
                label="Link Langsung Tombol (opsional)"
                hint="Kosongkan untuk munculkan form. Isi untuk redirect langsung ke link."
              >
                ...
              </FormField>
              <FormField
                label="WhatsApp Penerima"
                ...
              >
                ...
              </FormField>
              <FormField
                label="Email Penerima"
                required
                hint="Alamat email tim yang menerima lead."
              >
                <input
                  style={inputStyle}
                  type="email"
                  value={form.lead_email}
                  onChange={(e) => update('lead_email', e.target.value)}
                  placeholder="hello@bentalastudio.id"
                />
              </FormField>
            </div>
          </Section>
```

Replace dengan:

```tsx
          <Section title="Tombol Hero & WhatsApp Tujuan">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField label="Tulisan di Tombol" required>
                <input
                  style={inputStyle}
                  value={form.cta_text}
                  onChange={(e) => update('cta_text', e.target.value)}
                  placeholder="Start Collaboration"
                />
              </FormField>
              <FormField
                label="Link Langsung Tombol (opsional)"
                hint="Kosongkan untuk munculkan form. Isi untuk redirect langsung ke link."
              >
                <input
                  style={inputStyle}
                  value={form.cta_url}
                  onChange={(e) => update('cta_url', e.target.value)}
                  placeholder="https://..."
                />
              </FormField>
              <FormField
                label="WhatsApp Penerima"
                required
                hint="Nomor WhatsApp tim yang menerima lead. Format internasional, mis. +6281284731599."
              >
                <input
                  style={inputStyle}
                  value={form.lead_whatsapp_number}
                  onChange={(e) => update('lead_whatsapp_number', e.target.value)}
                  placeholder="+6281284731599"
                />
              </FormField>
            </div>
          </Section>
```

Note: kolom `lead_email` di DB **tidak dihapus**. Form state `lead_email` juga tetap ada (akan di-load dari DB dengan default lama dan diabaikan). Ini intentional per spec — backward compat in case future revert.

- [ ] **Step 2: Typecheck**

Run: `cd bentala-nextjs && npx tsc --noEmit 2>&1 | grep "hero/page.tsx" | grep -vE "TS2769|never|TS2339" | head -5`

Expected: empty (no new errors).

- [ ] **Step 3: Commit**

```bash
cd ../bentala-nextjs
git add 'app/(dashboard)/website/home/hero/page.tsx'
git commit -m "feat(admin/hero): drop Email Penerima field; rename section

Form is now WhatsApp-only on the public side. The lead_email column in
bsi_hero is preserved for backward compat but no longer surfaced in
the editor.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: End-to-end manual test

**Files:** N/A (verification only)

- [ ] **Step 1: Start dev server bentala-studio**

```bash
cd bentala-studio
npm run dev
```

Buka browser di `http://localhost:3000`.

- [ ] **Step 2: Buka form Start Collaboration**

Klik tombol "Start Collaboration" di hero. Verifikasi:
- Tidak ada toggle WhatsApp/Email lagi
- Field `Nomor WhatsApp` langsung tampil dengan country code dropdown
- Tombol submit baca "Kirim & Lanjut ke WhatsApp →"

- [ ] **Step 3: Test submit dengan data valid**

Isi semua field. Klik submit. Verifikasi:
- Loading spinner sebentar (~200-500ms)
- Tab langsung redirect ke `https://wa.me/<digits>?text=...`
- Pesan WhatsApp pre-filled dengan format yang benar
- (Manual lanjut) press Send di WhatsApp → tim terima pesan di nomor yang diset di admin

- [ ] **Step 4: Test save ke DB**

Buka admin (bentala-nextjs) → `/website/leads`. Verifikasi:
- Lead baru muncul dengan `contact_type=whatsapp`
- `contact_value` berisi nomor yang user input
- Field lain (nama, brand, kebutuhan, catatan) lengkap

- [ ] **Step 5: Test error handling**

Matikan internet (Wi-Fi off) → submit form. Verifikasi:
- Tampil pesan error "Gagal mengirim. Coba lagi."
- **Tidak** redirect ke wa.me
- Data form **tetap utuh** di field-nya (user nggak harus isi ulang)

Hidupkan kembali Wi-Fi → klik submit lagi → harus berhasil.

- [ ] **Step 6: Test invalid phone**

Isi nomor WA dengan format salah (mis. "12345" atau kosong). Verifikasi:
- Tombol submit ter-disable (karena `isValid=false`)
- Atau tampil error inline "Format nomor WA tidak valid"

- [ ] **Step 7: Test admin editor**

Buka `bentala-nextjs` → `/website/home/hero`. Verifikasi:
- Section title baca "Tombol Hero & WhatsApp Tujuan"
- 3 field tampil: Tulisan Tombol, Link Langsung Tombol, WhatsApp Penerima
- Field "Email Penerima" tidak ada lagi
- Edit nomor WhatsApp Penerima → save → reload halaman → nilai persist
- Buka public site (tunggu ~30s revalidate atau pakai Next.js fast refresh) → submit form → redirect ke nomor baru

- [ ] **Step 8: Commit hasil verifikasi (optional, tag release)**

Jika semua test pass, opsional buat tag:

```bash
cd bentala-studio
git tag -a "whatsapp-only-form-v1" -m "WhatsApp-only collaboration form launched"
```

---

## Self-Review Notes

Plan ini sudah dicheck terhadap spec:
- ✅ Form fields (Task 4 step 4) match spec section "Form (StartCollaborationDialog)"
- ✅ Schema (Task 1) matches spec section "Schema"
- ✅ API behavior (Task 2) — drops dispatchLeadNotifications, hard-codes contact_type, preserves rate limit + honeypot
- ✅ Hero editor (Task 7) — section title + email field removal
- ✅ File deletion (Task 3) — lead-notify.ts removed
- ✅ Edge cases — Task 8 step 5 covers API failure → no redirect
- ✅ Tests — Task 8 covers manual verification

Tidak ada placeholder. Tidak ada referensi ke type/function yang belum didefinisikan. Type signatures konsisten antar task (`LeadFormData`, `Service`, `ProjectOption`, `UseFormSetValue<LeadFormData>`).
