# Start Collaboration Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modal lead-capture form that appears when "Start Collaboration" is clicked in the hero section, captures 6 fields + auto metadata, submits to an API route, then shows a thank-you state with WhatsApp CTA.

**Architecture:** A `StartCollaborationDialog` client component is imported by `HeroSection` and rendered via a single `isOpen` boolean state. The hero CTA `<a>` is replaced with a `<button>` that sets `isOpen = true`. Validation lives in a shared Zod schema in `src/lib/lead-schema.ts`, re-used by both the client form (via react-hook-form) and the API route (server-side re-validation). The API route logs to console with a TODO for DB integration.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS (custom tokens), react-hook-form, zod, @hookform/resolvers/zod — no shadcn/ui.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/lead-schema.ts` | Create | Zod schema + `LeadFormData` type shared by client and server |
| `src/app/api/leads/submit/route.ts` | Create | POST handler: re-validate, console.log, return JSON |
| `src/components/home/StartCollaborationDialog.tsx` | Create | Modal: form fields, submit, thank-you state, auto-close |
| `src/components/home/HeroSection.tsx` | Modify | Replace `<a>` CTA with `<button>`, import + render dialog |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install react-hook-form, zod, and the hookform resolver**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio"
npm install react-hook-form zod @hookform/resolvers
```

Expected output: packages added to `node_modules`, `package-lock.json` updated, `package.json` shows three new entries under `"dependencies"`.

- [ ] **Step 2: Verify install**

```bash
node -e "require('zod'); require('react-hook-form'); console.log('OK')"
```

Expected: prints `OK`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-hook-form, zod, @hookform/resolvers"
```

---

## Task 2: Lead schema and types

**Files:**
- Create: `src/lib/lead-schema.ts`

- [ ] **Step 1: Create the schema file**

Create `src/lib/lead-schema.ts` with this exact content:

```ts
import { z } from "zod";

export const leadSchema = z
  .object({
    full_name: z.string().min(2, "Nama minimal 2 karakter"),
    brand_name: z.string().min(1, "Nama brand wajib diisi"),
    contact_type: z.enum(["whatsapp", "email"]),
    contact_value: z.string().min(1, "Kontak wajib diisi"),
    project_type: z.enum(["single", "campaign", "retainer", "discuss"], {
      required_error: "Pilih jenis kebutuhan",
      invalid_type_error: "Pilih jenis kebutuhan",
    }),
    locations: z.array(z.string()).min(1, "Pilih minimal 1 lokasi"),
    notes: z.string().max(500, "Maksimal 500 karakter").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.contact_type === "whatsapp") {
      const cleaned = data.contact_value.replace(/[\s\-().+]/g, "");
      if (!/^[0-9]{8,15}$/.test(cleaned)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Format nomor WA tidak valid (contoh: +6281234567890)",
          path: ["contact_value"],
        });
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Format email tidak valid",
          path: ["contact_value"],
        });
      }
    }
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

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (or only unrelated pre-existing warnings).

- [ ] **Step 3: Commit**

```bash
git add src/lib/lead-schema.ts
git commit -m "feat: add lead form Zod schema and types"
```

---

## Task 3: API route `/api/leads/submit`

**Files:**
- Create: `src/app/api/leads/submit/route.ts`

- [ ] **Step 1: Create the API route**

Create `src/app/api/leads/submit/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { leadSchema, LeadPayload } from "@/lib/lead-schema";

const serverSchema = leadSchema.extend({
  submitted_at: z.string().datetime(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referrer: z.string().optional(),
  user_agent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = serverSchema.parse(body) as LeadPayload;

    // TODO: Save to internal CRM / Supabase table `bsi_leads`
    console.log("[BSI Lead Captured]", JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: err.errors },
        { status: 400 }
      );
    }
    console.error("[BSI Lead Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd "/Users/dandirivaldi/Documents/Claude/Projects/Internal Bentala/bentala-studio"
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Start dev server and test the route manually**

```bash
npm run dev
```

In a second terminal:

```bash
curl -s -X POST http://localhost:3000/api/leads/submit \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","brand_name":"Test Brand","contact_type":"whatsapp","contact_value":"+6281234567890","project_type":"single","locations":["Indonesia"],"submitted_at":"2026-04-17T00:00:00.000Z"}' \
  | jq .
```

Expected response: `{ "success": true }`

Test validation error:

```bash
curl -s -X POST http://localhost:3000/api/leads/submit \
  -H "Content-Type: application/json" \
  -d '{"full_name":"A"}' \
  | jq .
```

Expected: `{ "success": false, "errors": [...] }` with status 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/leads/submit/route.ts
git commit -m "feat: add /api/leads/submit route with Zod validation"
```

---

## Task 4: `StartCollaborationDialog` component

**Files:**
- Create: `src/components/home/StartCollaborationDialog.tsx`

This is a self-contained modal that manages its own form state. It receives `isOpen: boolean` and `onClose: () => void` from HeroSection.

- [ ] **Step 1: Create the component file**

Create `src/components/home/StartCollaborationDialog.tsx` with the full content below:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, LeadFormData } from "@/lib/lead-schema";
import { WHATSAPP_URL } from "@/lib/constants";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  single: "Single Content (foto/video satu project)",
  campaign: "Campaign / Series",
  retainer: "Retainer (berkelanjutan bulanan)",
  discuss: "Belum yakin, mau diskusi dulu",
};

const LOCATION_OPTIONS = [
  { value: "indonesia", label: "Indonesia" },
  { value: "asia", label: "Asia (Jepang, Korea, dll)" },
  { value: "eropa", label: "Eropa" },
  { value: "amerika", label: "Amerika" },
  { value: "other", label: "Lainnya / Diskusi dulu" },
];

function buildWaMessage(data: LeadFormData): string {
  const projectLabel = PROJECT_TYPE_LABELS[data.project_type] ?? data.project_type;
  const locationLabels = data.locations
    .map((v) => LOCATION_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .join(", ");

  return [
    "Hi Bentala Studio! Saya sudah mengisi form kolaborasi.",
    "",
    `Nama: ${data.full_name}`,
    `Brand: ${data.brand_name}`,
    `Kontak (${data.contact_type === "whatsapp" ? "WhatsApp" : "Email"}): ${data.contact_value}`,
    `Kebutuhan: ${projectLabel}`,
    `Lokasi: ${locationLabels}`,
    `Catatan: ${data.notes?.trim() || "Tidak ada"}`,
  ].join("\n");
}

export default function StartCollaborationDialog({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submittedData, setSubmittedData] = useState<LeadFormData | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [keepOpen, setKeepOpen] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

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
    defaultValues: {
      contact_type: "whatsapp",
      locations: [],
    },
  });

  const contactType = watch("contact_type");
  const notesValue = watch("notes") ?? "";
  const locations = watch("locations") ?? [];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setSubmittedData(null);
      setCountdown(15);
      setKeepOpen(false);
      reset({ contact_type: "whatsapp", locations: [] });
    }
  }, [isOpen, reset]);

  // Escape key close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Auto-close countdown
  useEffect(() => {
    if (step !== "success" || keepOpen) return;
    if (countdown <= 0) {
      onClose();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown, keepOpen, onClose]);

  const toggleLocation = useCallback(
    (val: string) => {
      const next = locations.includes(val)
        ? locations.filter((l) => l !== val)
        : [...locations, val];
      setValue("locations", next, { shouldValidate: true });
    },
    [locations, setValue]
  );

  const onSubmit = async (data: LeadFormData) => {
    const params = new URLSearchParams(window.location.search);
    const payload = {
      ...data,
      submitted_at: new Date().toISOString(),
      utm_source: params.get("utm_source") ?? undefined,
      utm_medium: params.get("utm_medium") ?? undefined,
      utm_campaign: params.get("utm_campaign") ?? undefined,
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
    };

    try {
      const res = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmittedData(data);
      setStep("success");
    } catch {
      // Network error — keep form open so user can retry
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Start Collaboration"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-[560px] max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto bg-bg2 border border-[rgba(0,212,255,0.15)] sm:rounded-2xl rounded-t-2xl shadow-[0_-8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,212,255,0.06)] scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "form" ? (
          <FormContent
            errors={errors}
            isSubmitting={isSubmitting}
            isValid={isValid}
            contactType={contactType}
            notesValue={notesValue}
            locations={locations}
            notesRef={notesRef}
            register={register}
            setValue={setValue}
            toggleLocation={toggleLocation}
            onSubmit={handleSubmit(onSubmit)}
            onClose={onClose}
          />
        ) : (
          <SuccessContent
            name={submittedData?.full_name ?? ""}
            data={submittedData!}
            countdown={countdown}
            keepOpen={keepOpen}
            onKeepOpen={() => setKeepOpen(true)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}

// ─── Form Content ────────────────────────────────────────────────────────────

interface FormContentProps {
  errors: ReturnType<typeof useForm<LeadFormData>>["formState"]["errors"];
  isSubmitting: boolean;
  isValid: boolean;
  contactType: "whatsapp" | "email";
  notesValue: string;
  locations: string[];
  notesRef: React.RefObject<HTMLTextAreaElement | null>;
  register: ReturnType<typeof useForm<LeadFormData>>["register"];
  setValue: ReturnType<typeof useForm<LeadFormData>>["setValue"];
  toggleLocation: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function FormContent({
  errors,
  isSubmitting,
  isValid,
  contactType,
  notesValue,
  locations,
  register,
  setValue,
  toggleLocation,
  onSubmit,
  onClose,
}: FormContentProps) {
  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-bg2 border-b border-[rgba(240,244,255,0.06)]">
        <div>
          <div className="font-sans text-[9px] tracking-[0.22em] uppercase text-cyan mb-1">
            Bentala Studio
          </div>
          <h2 className="font-sans text-[22px] font-bold tracking-[-0.01em] text-white leading-none">
            Start Collaboration
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 flex items-center justify-center text-dim hover:text-white transition-colors rounded-full hover:bg-[rgba(240,244,255,0.06)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-6 flex flex-col gap-5">
        {/* Field 1: Nama Lengkap */}
        <Field label="Nama Lengkap" required error={errors.full_name?.message}>
          <input
            {...register("full_name")}
            type="text"
            placeholder="Nama kamu"
            autoComplete="name"
            className={inputClass(!!errors.full_name)}
          />
        </Field>

        {/* Field 2: Nama Brand */}
        <Field label="Nama Brand / Perusahaan" required error={errors.brand_name?.message}>
          <input
            {...register("brand_name")}
            type="text"
            placeholder="Nama brand atau perusahaan"
            className={inputClass(!!errors.brand_name)}
          />
        </Field>

        {/* Field 3: Kontak Preferensi */}
        <div className="flex flex-col gap-2">
          <label className="font-sans text-[10px] tracking-[0.14em] uppercase text-dim flex items-center gap-1">
            Kontak Preferensi <span className="text-cyan">*</span>
          </label>
          {/* Toggle */}
          <div className="flex rounded-lg border border-[rgba(240,244,255,0.1)] overflow-hidden w-fit">
            {(["whatsapp", "email"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setValue("contact_type", type, { shouldValidate: false });
                  setValue("contact_value", "", { shouldValidate: false });
                }}
                className={`font-sans text-[10px] tracking-[0.06em] px-4 py-2 transition-all duration-200 ${
                  contactType === type
                    ? "bg-cyan text-bg font-semibold"
                    : "bg-transparent text-dim hover:text-white"
                }`}
              >
                {type === "whatsapp" ? "WhatsApp" : "Email"}
              </button>
            ))}
          </div>
          {/* Adaptive input */}
          {contactType === "whatsapp" ? (
            <input
              {...register("contact_value")}
              type="tel"
              placeholder="+62812345678"
              autoComplete="tel"
              className={inputClass(!!errors.contact_value)}
            />
          ) : (
            <input
              {...register("contact_value")}
              type="email"
              placeholder="kamu@email.com"
              autoComplete="email"
              className={inputClass(!!errors.contact_value)}
            />
          )}
          {errors.contact_value && (
            <p className="font-sans text-[11px] text-red-400 mt-0.5">
              {errors.contact_value.message}
            </p>
          )}
        </div>

        {/* Field 4: Jenis Kebutuhan */}
        <div className="flex flex-col gap-2">
          <label className="font-sans text-[10px] tracking-[0.14em] uppercase text-dim flex items-center gap-1">
            Jenis Kebutuhan <span className="text-cyan">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {(
              [
                { value: "single", label: "Single Content", sub: "foto/video satu project" },
                { value: "campaign", label: "Campaign / Series", sub: "" },
                { value: "retainer", label: "Retainer", sub: "berkelanjutan bulanan" },
                { value: "discuss", label: "Belum yakin, mau diskusi dulu", sub: "" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(240,244,255,0.06)] cursor-pointer transition-all duration-200 hover:border-[rgba(0,212,255,0.2)] hover:bg-[rgba(0,212,255,0.03)] has-[:checked]:border-cyan has-[:checked]:bg-[rgba(0,212,255,0.06)]"
              >
                <input
                  {...register("project_type")}
                  type="radio"
                  value={opt.value}
                  className="sr-only"
                />
                <span className="w-4 h-4 rounded-full border-2 border-[rgba(240,244,255,0.2)] flex-shrink-0 flex items-center justify-center transition-all has-parent-checked:border-cyan">
                  {/* Visual dot handled via CSS has-[:checked] on parent */}
                </span>
                <span className="flex-1">
                  <span className="font-sans text-[13px] text-white">{opt.label}</span>
                  {opt.sub && (
                    <span className="font-sans text-[11px] text-dim ml-1.5">({opt.sub})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          {errors.project_type && (
            <p className="font-sans text-[11px] text-red-400 mt-0.5">
              {errors.project_type.message}
            </p>
          )}
        </div>

        {/* Field 5: Lokasi Produksi */}
        <div className="flex flex-col gap-2">
          <label className="font-sans text-[10px] tracking-[0.14em] uppercase text-dim flex items-center gap-1">
            Lokasi Produksi <span className="text-cyan">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((opt) => {
              const checked = locations.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleLocation(opt.value)}
                  className={`font-sans text-[11px] tracking-[0.03em] px-4 py-2 rounded-full border transition-all duration-200 ${
                    checked
                      ? "bg-cyan text-bg border-cyan font-semibold"
                      : "bg-transparent text-dim border-[rgba(240,244,255,0.1)] hover:border-[rgba(0,212,255,0.3)] hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {errors.locations && (
            <p className="font-sans text-[11px] text-red-400 mt-0.5">
              {errors.locations.message}
            </p>
          )}
        </div>

        {/* Field 6: Notes (optional) */}
        <div className="flex flex-col gap-2">
          <label className="font-sans text-[10px] tracking-[0.14em] uppercase text-dim">
            Ceritakan Project-nya{" "}
            <span className="normal-case tracking-normal text-[10px] text-dim/60 ml-1">
              (opsional)
            </span>
          </label>
          <div className="relative">
            <textarea
              {...register("notes")}
              placeholder="Contoh: Butuh video company profile di Tokyo untuk launching produk Q3"
              rows={3}
              maxLength={500}
              className={`${inputClass(!!errors.notes)} resize-none leading-[1.6]`}
            />
            <span
              className={`absolute bottom-2.5 right-3 font-sans text-[10px] tabular-nums ${
                notesValue.length >= 450 ? "text-amber-400" : "text-dim/50"
              }`}
            >
              {notesValue.length}/500
            </span>
          </div>
          {errors.notes && (
            <p className="font-sans text-[11px] text-red-400 mt-0.5">
              {errors.notes.message}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-6 py-4 bg-bg2 border-t border-[rgba(240,244,255,0.06)]">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full font-sans text-[13px] tracking-[0.06em] font-semibold bg-cyan text-bg py-3.5 rounded-xl transition-all duration-250 hover:bg-blue4 hover:shadow-[0_0_28px_rgba(0,212,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-cyan disabled:hover:shadow-none flex items-center justify-center gap-2.5"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              Mengirim...
            </>
          ) : (
            "Kirim & Mulai Kolaborasi →"
          )}
        </button>
        <p className="text-center font-sans text-[10px] text-dim/50 mt-3">
          Tim kami akan menghubungi kamu dalam 1×24 jam
        </p>
      </div>
    </form>
  );
}

// ─── Success Content ──────────────────────────────────────────────────────────

interface SuccessContentProps {
  name: string;
  data: LeadFormData;
  countdown: number;
  keepOpen: boolean;
  onKeepOpen: () => void;
  onClose: () => void;
}

function SuccessContent({
  name,
  data,
  countdown,
  keepOpen,
  onKeepOpen,
  onClose,
}: SuccessContentProps) {
  const waMessage = buildWaMessage(data);
  const waUrl = `${WHATSAPP_URL}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="px-6 py-10 flex flex-col items-center text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-cyan mb-3">
        Terima kasih!
      </div>
      <h3 className="font-sans text-[26px] font-bold tracking-[-0.01em] text-white leading-tight mb-3">
        Pesan kamu sudah<br />kami terima, {name.split(" ")[0]}!
      </h3>
      <p className="font-sans text-[14px] font-light text-dim leading-[1.75] mb-8 max-w-[340px]">
        Tim Bentala Studio akan menghubungi kamu dalam{" "}
        <span className="text-white font-normal">1×24 jam</span>. Atau langsung chat sekarang.
      </p>

      {/* CTAs */}
      <div className="flex flex-col gap-3 w-full max-w-[340px]">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 font-sans text-[13px] tracking-[0.04em] font-semibold bg-cyan text-bg py-3.5 rounded-xl transition-all hover:bg-blue4 hover:shadow-[0_0_28px_rgba(0,212,255,0.35)] no-underline"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.956 9.956 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat Langsung via WhatsApp
        </a>

        <button
          type="button"
          onClick={() => {
            onClose();
            setTimeout(() => {
              document.getElementById("portfolio")?.scrollIntoView({ behavior: "smooth" });
            }, 300);
          }}
          className="font-sans text-[13px] tracking-[0.04em] text-dim border border-[rgba(240,244,255,0.1)] py-3.5 rounded-xl transition-all hover:text-white hover:border-[rgba(240,244,255,0.25)]"
        >
          Lihat Portfolio Kami
        </button>
      </div>

      {/* Auto-close notice */}
      {!keepOpen && (
        <div className="flex items-center gap-2 mt-8">
          <p className="font-sans text-[11px] text-dim/50">
            Dialog menutup otomatis dalam {countdown} detik
          </p>
          <button
            type="button"
            onClick={onKeepOpen}
            className="font-sans text-[11px] text-cyan/70 hover:text-cyan transition-colors underline underline-offset-2"
          >
            Tahan
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-sans text-[10px] tracking-[0.14em] uppercase text-dim flex items-center gap-1">
        {label}
        {required && <span className="text-cyan">*</span>}
      </label>
      {children}
      {error && (
        <p className="font-sans text-[11px] text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full bg-bg3 border rounded-xl px-4 py-3 font-sans text-[14px] text-white placeholder:text-dim/40",
    "focus:outline-none focus:ring-2 transition-all duration-200",
    hasError
      ? "border-red-400/60 focus:ring-red-400/30"
      : "border-[rgba(240,244,255,0.08)] focus:border-[rgba(0,212,255,0.4)] focus:ring-[rgba(0,212,255,0.15)]",
  ].join(" ");
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/StartCollaborationDialog.tsx
git commit -m "feat: add StartCollaborationDialog modal component"
```

---

## Task 5: Wire HeroSection to open the dialog

**Files:**
- Modify: `src/components/home/HeroSection.tsx`

The CTA `<a href={hero.cta_url}>` on line 111–118 needs to become a `<button>` that sets `isOpen = true`. The `StartCollaborationDialog` is rendered at the end of the section.

- [ ] **Step 1: Update HeroSection.tsx**

Replace the entire content of `src/components/home/HeroSection.tsx` with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { HeroData, Service, SocialLink } from "@/lib/types";
import StartCollaborationDialog from "@/components/home/StartCollaborationDialog";

interface Props {
  hero: HeroData;
  services: Service[];
  socialLinks: SocialLink[];
}

export default function HeroSection({ hero, services, socialLinks }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoIdxRef = useRef(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hero.video_urls.length) return;

    const nextVideo = () => {
      videoIdxRef.current = (videoIdxRef.current + 1) % hero.video_urls.length;
      video.src = hero.video_urls[videoIdxRef.current];
      video.play().catch(() => {});
    };

    video.addEventListener("ended", nextVideo);
    video.addEventListener("error", nextVideo);

    return () => {
      video.removeEventListener("ended", nextVideo);
      video.removeEventListener("error", nextVideo);
    };
  }, [hero.video_urls]);

  const platformIcon = (platform: string) => {
    if (platform === "ig")
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 flex-shrink-0">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    if (platform === "tiktok")
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
        </svg>
      );
    if (platform === "whatsapp")
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.956 9.956 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    return null;
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        autoPlay
        muted
        loop
        playsInline
        poster={hero.poster_url}
      >
        {hero.video_urls[0] && <source src={hero.video_urls[0]} type="video/mp4" />}
      </video>

      {/* Dark Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,9,13,0.65) 0%, rgba(8,9,13,0.55) 40%, rgba(8,9,13,0.82) 85%, rgba(8,9,13,1) 100%), linear-gradient(to right, rgba(8,9,13,0.4) 0%, transparent 35%, transparent 65%, rgba(8,9,13,0.4) 100%)",
        }}
      />
      {/* Scanline */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[1100px]">
        <h1 className="font-sans text-[clamp(56px,8vw,110px)] leading-[0.92] tracking-[-0.01em] text-white animate-fade-up animate-fade-up-delay-1 [text-shadow:0_2px_32px_rgba(0,0,0,0.9),0_0_80px_rgba(0,0,0,0.6)]">
          {hero.headline.split(" ").map((word, i) => {
            if (word === "STORIES")
              return <span key={i} className="text-stroke-cyan"> {word}</span>;
            if (word === "BEYOND")
              return (
                <span key={i}>
                  <br />
                  <span className="text-blue3">{word}</span>
                </span>
              );
            return <span key={i}>{i > 0 ? " " : ""}{word}</span>;
          })}
        </h1>
        <p className="text-lg font-normal text-[rgba(240,244,255,0.92)] max-w-[560px] mx-auto mt-6 mb-10 leading-[1.75] animate-fade-up animate-fade-up-delay-2 [text-shadow:0_1px_20px_rgba(0,0,0,1),0_0_40px_rgba(0,0,0,0.8)]">
          {hero.subtitle}
        </p>
        <div className="flex gap-3.5 justify-center animate-fade-up animate-fade-up-delay-3">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="font-sans text-sm tracking-[0.04em] bg-cyan text-bg px-8 py-3.5 font-medium transition-all rounded-lg hover:bg-blue4 hover:shadow-[0_0_36px_rgba(0,212,255,0.4)] hover:-translate-y-0.5"
          >
            {hero.cta_text}
          </button>
        </div>
      </div>

      {/* Hero Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-5 pb-9">
        {/* Service Pills */}
        <div className="flex gap-2.5 flex-wrap justify-center">
          {services.map((s) => (
            <span
              key={s.id}
              className="font-sans text-xs font-normal text-[rgba(240,244,255,0.7)] border border-[rgba(240,244,255,0.15)] px-4 py-1.5 rounded-full backdrop-blur-[8px] bg-[rgba(240,244,255,0.05)] tracking-[0.02em] transition-all hover:text-cyan hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.06)]"
            >
              {s.name}
            </span>
          ))}
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-6">
          {socialLinks.map((link, i) => (
            <span key={link.id} className="flex items-center gap-6">
              {i > 0 && <span className="text-[rgba(240,244,255,0.15)]">&middot;</span>}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-[7px] font-sans text-[11px] text-[rgba(240,244,255,0.45)] no-underline transition-colors tracking-[0.02em] hover:text-[rgba(240,244,255,0.85)]"
              >
                {platformIcon(link.platform)}
                {link.handle}
              </a>
            </span>
          ))}
        </div>

        {/* Scroll Indicator */}
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
      </div>

      {/* Collaboration Dialog */}
      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test in browser**

With `npm run dev` running:
1. Open http://localhost:3000
2. Click "Start Collaboration" → modal appears with backdrop blur
3. Fill all required fields → submit button activates
4. Leave required field empty → inline error appears below the field
5. Submit valid form → check dev server console for `[BSI Lead Captured]` log
6. Thank-you state appears with name, countdown timer shows
7. Click "Chat Langsung via WhatsApp" → opens wa.me with pre-filled message
8. Click "Lihat Portfolio Kami" → modal closes, page scrolls to portfolio section
9. Press Escape → modal closes
10. Click backdrop → modal closes
11. On mobile viewport (375px): modal slides up from bottom as full-width sheet

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HeroSection.tsx
git commit -m "feat: wire Start Collaboration button to open lead-capture dialog"
```
