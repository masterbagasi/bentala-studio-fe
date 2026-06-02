"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, LeadFormData } from "@/lib/lead-schema";
import { WHATSAPP_URL } from "@/lib/constants";
import { getCurrentVisitorId, trackEvent } from "@/lib/tracker";
import type { Service } from "@/lib/types";

type Lang = "id" | "en";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  /** Team WhatsApp number in international format (e.g. "+6281284731599"). */
  leadWhatsappNumber?: string;
  /** Pre-selected service value for the "Jenis Kebutuhan" dropdown.
   *  When the user clicks the per-service CTA in ServicesSpotlight we
   *  pass the service name here so the dropdown opens already pointing
   *  at that service, instead of an empty placeholder. */
  initialProjectType?: string;
  /** Override the dialog title. Defaults to "Start Collaboration". Used
   *  by the Abroad Production booking flow which wants a different
   *  heading to make the booking context obvious. */
  title?: string;
  /** Subtitle line rendered under the heading — typically the trip
   *  destination + date, so the visitor knows which slot they're
   *  booking before they fill the form. */
  contextLine?: string;
  /** Pre-fill the notes textarea (caller passes the trip context so
   *  the form opens with the booking details already in the note). */
  initialNotes?: string;
  /** Auto-filled, read-only destination country shown at the top of
   *  the form (e.g. "France"). Pairs with `departureDate` +
   *  `returnDate` so the trip context reads as distinct labeled
   *  chips instead of a run-on line. Threaded into the WhatsApp
   *  message + lead payload so the studio receives the context. */
  destinationCountry?: string;
  /** Auto-filled, read-only departure date (e.g. "14 May 2026"). */
  departureDate?: string;
  /** Auto-filled, read-only return date (e.g. "15 May 2026"). Hidden
   *  when the trip is single-day (no return). */
  returnDate?: string;
  /** Language for ALL dialog copy (labels, placeholders, buttons,
   *  country names, WhatsApp pre-fill message). Defaults to "id"
   *  for backward compat with the home page. The abroad-production
   *  booking flow passes "en" so the international audience gets
   *  English copy throughout. */
  lang?: Lang;
}

const DISCUSS_VALUE = "discuss";

// Centralised UI copy + WhatsApp pre-fill, keyed by language. Adding
// a new locale = adding one more record to this object; no component
// changes needed downstream.
const STRINGS: Record<Lang, {
  discussLabel: string;
  fullName: string;
  fullNamePlaceholder: string;
  brandName: string;
  brandNamePlaceholder: string;
  whatsapp: string;
  whatsappAria: string;
  whatsappPlaceholder: string;
  countryAria: string;
  countryListAria: string;
  projectType: string;
  projectTypePlaceholder: string;
  projectTypeAria: string;
  projectTypeListAria: string;
  notesLabel: string;
  notesOptional: string;
  notesPlaceholder: string;
  submitting: string;
  submit: string;
  submitError: string;
  responseTime: string;
  closeAria: string;
  waGreeting: string;
  waName: string;
  waBrand: string;
  waWhatsapp: string;
  waService: string;
  waNotes: string;
  waNotesEmpty: string;
}> = {
  id: {
    discussLabel: "Belum yakin, mau diskusi dulu",
    fullName: "Nama Lengkap",
    fullNamePlaceholder: "Nama kamu",
    brandName: "Nama Brand / Perusahaan",
    brandNamePlaceholder: "Nama brand atau perusahaan",
    whatsapp: "Nomor WhatsApp",
    whatsappAria: "Nomor WhatsApp",
    whatsappPlaceholder: "812345678",
    countryAria: "Pilih kode negara",
    countryListAria: "Kode negara",
    projectType: "Jenis Kebutuhan",
    projectTypePlaceholder: "Pilih jenis kebutuhan",
    projectTypeAria: "Pilih jenis kebutuhan",
    projectTypeListAria: "Jenis kebutuhan",
    notesLabel: "Ceritakan Project-nya",
    notesOptional: "(opsional)",
    notesPlaceholder:
      "Contoh: Butuh video company profile di Tokyo untuk launching produk Q3",
    submitting: "Mengirim...",
    submit: "Kirim & Lanjut ke WhatsApp →",
    submitError: "Gagal mengirim. Coba lagi.",
    responseTime: "Tim kami akan membalas chat kamu dalam 1×24 jam",
    closeAria: "Tutup",
    waGreeting: "Hi Bentala Studio! Saya sudah mengisi form kolaborasi.",
    waName: "Nama",
    waBrand: "Brand",
    waWhatsapp: "WhatsApp",
    waService: "Kebutuhan",
    waNotes: "Catatan",
    waNotesEmpty: "Tidak ada",
  },
  en: {
    discussLabel: "Not sure yet, let's discuss",
    fullName: "Full Name",
    fullNamePlaceholder: "Your name",
    brandName: "Brand / Company Name",
    brandNamePlaceholder: "Brand or company name",
    whatsapp: "WhatsApp Number",
    whatsappAria: "WhatsApp number",
    whatsappPlaceholder: "812345678",
    countryAria: "Select country code",
    countryListAria: "Country code",
    projectType: "Service Type",
    projectTypePlaceholder: "Select service type",
    projectTypeAria: "Select service type",
    projectTypeListAria: "Service type",
    notesLabel: "Tell us about the project",
    notesOptional: "(optional)",
    notesPlaceholder:
      "e.g. Need a company-profile video in Tokyo for our Q3 product launch",
    submitting: "Sending...",
    submit: "Send & Continue to WhatsApp →",
    submitError: "Failed to send. Please try again.",
    responseTime: "Our team will reply within 1 business day",
    closeAria: "Close",
    waGreeting: "Hi Bentala Studio! I've just submitted the booking form.",
    waName: "Name",
    waBrand: "Brand",
    waWhatsapp: "WhatsApp",
    waService: "Service",
    waNotes: "Notes",
    waNotesEmpty: "None",
  },
};

interface ProjectOption {
  value: string;
  label: string;
  sub: string;
}

function buildProjectOptions(services: Service[], lang: Lang): ProjectOption[] {
  const fromServices = services.map((s) => ({ value: s.name, label: s.name, sub: "" }));
  // "Not sure" always stays at the bottom regardless of how many services exist.
  return [
    ...fromServices,
    { value: DISCUSS_VALUE, label: STRINGS[lang].discussLabel, sub: "" },
  ];
}

/** Convert "+6281234..." or "081234..." to a wa.me-compatible URL. */
function toWaUrl(rawNumber: string | undefined): string {
  if (!rawNumber) return WHATSAPP_URL;
  const digits = rawNumber.replace(/[^\d]/g, "");
  if (!digits) return WHATSAPP_URL;
  return `https://wa.me/${digits}`;
}

interface CountryCode {
  dial: string;
  flag: string;
  /** Indonesian display name. */
  label: string;
  /** English display name. */
  labelEn: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { dial: "+62",  flag: "🇮🇩", label: "Indonesia",         labelEn: "Indonesia" },
  { dial: "+60",  flag: "🇲🇾", label: "Malaysia",          labelEn: "Malaysia" },
  { dial: "+65",  flag: "🇸🇬", label: "Singapura",         labelEn: "Singapore" },
  { dial: "+66",  flag: "🇹🇭", label: "Thailand",          labelEn: "Thailand" },
  { dial: "+84",  flag: "🇻🇳", label: "Vietnam",           labelEn: "Vietnam" },
  { dial: "+63",  flag: "🇵🇭", label: "Filipina",          labelEn: "Philippines" },
  { dial: "+673", flag: "🇧🇳", label: "Brunei",            labelEn: "Brunei" },
  { dial: "+855", flag: "🇰🇭", label: "Kamboja",           labelEn: "Cambodia" },
  { dial: "+61",  flag: "🇦🇺", label: "Australia",         labelEn: "Australia" },
  { dial: "+64",  flag: "🇳🇿", label: "Selandia Baru",     labelEn: "New Zealand" },
  { dial: "+1",   flag: "🇺🇸", label: "USA",               labelEn: "USA" },
  { dial: "+1",   flag: "🇨🇦", label: "Kanada",            labelEn: "Canada" },
  { dial: "+44",  flag: "🇬🇧", label: "Inggris",           labelEn: "United Kingdom" },
  { dial: "+81",  flag: "🇯🇵", label: "Jepang",            labelEn: "Japan" },
  { dial: "+82",  flag: "🇰🇷", label: "Korea Selatan",     labelEn: "South Korea" },
  { dial: "+86",  flag: "🇨🇳", label: "Tiongkok",          labelEn: "China" },
  { dial: "+852", flag: "🇭🇰", label: "Hong Kong",         labelEn: "Hong Kong" },
  { dial: "+886", flag: "🇹🇼", label: "Taiwan",            labelEn: "Taiwan" },
  { dial: "+91",  flag: "🇮🇳", label: "India",             labelEn: "India" },
  { dial: "+971", flag: "🇦🇪", label: "Uni Emirat Arab",   labelEn: "UAE" },
  { dial: "+966", flag: "🇸🇦", label: "Arab Saudi",        labelEn: "Saudi Arabia" },
  { dial: "+49",  flag: "🇩🇪", label: "Jerman",            labelEn: "Germany" },
  { dial: "+33",  flag: "🇫🇷", label: "Perancis",          labelEn: "France" },
  { dial: "+31",  flag: "🇳🇱", label: "Belanda",           labelEn: "Netherlands" },
  { dial: "+39",  flag: "🇮🇹", label: "Italia",            labelEn: "Italy" },
  { dial: "+34",  flag: "🇪🇸", label: "Spanyol",           labelEn: "Spain" },
];

function buildWaMessage(data: LeadFormData, lang: Lang): string {
  const t = STRINGS[lang];
  const projectLabel =
    data.project_type === DISCUSS_VALUE ? t.discussLabel : data.project_type;

  return [
    t.waGreeting,
    "",
    `${t.waName}: ${data.full_name}`,
    `${t.waBrand}: ${data.brand_name}`,
    `${t.waWhatsapp}: ${data.whatsapp_number}`,
    `${t.waService}: ${projectLabel}`,
    `${t.waNotes}: ${data.notes?.trim() || t.waNotesEmpty}`,
  ].join("\n");
}

export default function StartCollaborationDialog({
  isOpen,
  onClose,
  services,
  leadWhatsappNumber,
  initialProjectType,
  title = "Start Collaboration",
  contextLine,
  initialNotes,
  destinationCountry,
  departureDate,
  returnDate,
  lang = "id",
}: Props) {
  const t = STRINGS[lang];
  const projectOptions = useMemo(
    () => buildProjectOptions(services, lang),
    [services, lang],
  );
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
      // When the dialog is opened from a per-service CTA the caller
      // passes the service name as initialProjectType — pre-select it
      // so "Jenis Kebutuhan" already matches the service the user just
      // clicked from. Validate so the field doesn't render in error
      // state on first paint.
      if (initialProjectType) {
        setValue("project_type", initialProjectType, { shouldValidate: true });
      }
      if (initialNotes) {
        setValue("notes", initialNotes, { shouldValidate: true });
      }
      void trackEvent("form_open", "start_collaboration");
    }
  }, [isOpen, reset, initialProjectType, initialNotes, setValue]);

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
    // When booking context is shown in the dialog, inject it into
    // the notes field so the lead record and the WhatsApp message
    // both carry the destination + dates — the textarea itself
    // stays empty for the visitor to write their own message.
    // Booking context formatted as one line (Destination /
    // Departure / Return); the visitor's notes (if any) sit below
    // with a blank line between.
    const dateLine = returnDate
      ? `${departureDate ?? ""} → ${returnDate}`
      : (departureDate ?? "");
    const bookingLine = [destinationCountry, dateLine]
      .filter(Boolean)
      .join(" — ");
    const combinedNotes = bookingLine
      ? `${bookingLine}${data.notes?.trim() ? `\n\n${data.notes.trim()}` : ""}`
      : data.notes;
    const payload = {
      ...data,
      notes: combinedNotes,
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

      // Redirect inside the user-gesture handler so pop-up blockers don't
      // intervene. Same-tab navigation also avoids new-window restrictions
      // on Safari/Firefox strict mode.
      const waMessage = buildWaMessage(
        { ...data, notes: combinedNotes },
        lang,
      );
      window.location.href = `${waBaseUrl}?text=${encodeURIComponent(waMessage)}`;
    } catch {
      setSubmitError(true);
      void trackEvent("form_error", "start_collaboration");
    }
  };

  if (!isOpen) return null;
  // Portal to <body> so the dialog escapes any ancestor that creates a
  // containing block (a parent with `transform`, `filter`, or
  // `will-change` — e.g. the RevealOnScroll wrapper around the
  // Services section pins `position: fixed` to itself instead of the
  // viewport). Mounting on body keeps the dialog truly centered on
  // every page that uses it.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-dialog-title"
    >
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full sm:max-w-[560px] max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto bg-bg2 border border-[rgba(11,61,231,0.15)] sm:rounded-2xl rounded-t-2xl shadow-[0_-8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(11,61,231,0.06)] scrollbar-hide"
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
          title={title}
          contextLine={contextLine}
          destinationCountry={destinationCountry}
          departureDate={departureDate}
          returnDate={returnDate}
          lang={lang}
        />
      </div>
    </div>,
    document.body,
  );
}

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
  title: string;
  contextLine?: string;
  destinationCountry?: string;
  departureDate?: string;
  returnDate?: string;
  lang: Lang;
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
  title,
  contextLine,
  destinationCountry,
  departureDate,
  returnDate,
  lang,
}: FormContentProps) {
  const t = STRINGS[lang];
  const [projectOpen, setProjectOpen] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) setProjectOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <form onSubmit={onSubmit} noValidate>
      {/* Honeypot — hidden from real users, bots fill it. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website_url_extra">Website (do not fill)</label>
        <input
          id="website_url_extra"
          name="website_url_extra"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-bg2 border-b border-[rgba(240,244,255,0.06)]">
        <div className="flex flex-col gap-1.5">
          <h2 id="collab-dialog-title" className="font-sans text-heading-xs font-bold tracking-[-0.01em] text-white leading-none">
            {title}
          </h2>
          {contextLine && (
            <span className="font-sans text-meta tracking-[0.16em] uppercase text-cyan">
              {contextLine}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.closeAria}
          className="w-8 h-8 flex items-center justify-center text-dim hover:text-white transition-colors rounded-full hover:bg-[rgba(240,244,255,0.06)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-6 flex flex-col gap-5">
        {/* Booking context — read-only chips auto-filled from the
            trip the visitor is booking. Layout:
              [Destination (full width)]
              [Departure] [Return]   ← 2-col grid side-by-side
            Country gets a full-width chip so the country name reads
            prominently; the two dates pair underneath because they
            belong together as a date range. All chips Bentala-blue
            tinted to signal "system info" vs. editable inputs. */}
        {(destinationCountry || departureDate || returnDate) && (
          <div className="flex flex-col gap-3">
            {destinationCountry && (
              <BookingContextField
                label={lang === "en" ? "Destination" : "Tujuan"}
                value={destinationCountry}
              />
            )}
            {(departureDate || returnDate) && (
              <div className="grid grid-cols-2 gap-3">
                {departureDate && (
                  <BookingContextField
                    label={lang === "en" ? "Departure" : "Keberangkatan"}
                    value={departureDate}
                  />
                )}
                {returnDate && (
                  <BookingContextField
                    label={lang === "en" ? "Return" : "Kepulangan"}
                    value={returnDate}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <Field label={t.fullName} required htmlFor="full_name" error={errors.full_name?.message}>
          <input
            {...register("full_name")}
            id="full_name"
            type="text"
            placeholder={t.fullNamePlaceholder}
            autoComplete="name"
            className={inputClass(!!errors.full_name)}
          />
        </Field>

        <Field label={t.brandName} required htmlFor="brand_name" error={errors.brand_name?.message}>
          <input
            {...register("brand_name")}
            id="brand_name"
            type="text"
            placeholder={t.brandNamePlaceholder}
            className={inputClass(!!errors.brand_name)}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <label className="font-sans text-meta tracking-[0.14em] uppercase text-dim flex items-center gap-1">
            {t.whatsapp} <span className="text-cyan">*</span>
          </label>
          <PhoneInput
            setValue={setValue}
            error={errors.whatsapp_number?.message}
            lang={lang}
          />
          {errors.whatsapp_number && (
            <p className="font-sans text-tag text-red-400 mt-0.5">
              {errors.whatsapp_number.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans text-meta tracking-[0.14em] uppercase text-dim flex items-center gap-1">
            {t.projectType} <span className="text-cyan">*</span>
          </label>
          <div className="relative" ref={projectRef}>
            <button
              type="button"
              onClick={() => setProjectOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={projectOpen}
              aria-label={t.projectTypeAria}
              className={`w-full flex items-center justify-between px-4 py-3 bg-bg3 rounded-xl border transition-all duration-200 ${
                errors.project_type
                  ? "border-red-400/60"
                  : "border-[rgba(240,244,255,0.08)] hover:border-[rgba(11,61,231,0.3)]"
              }`}
            >
              <span className={`font-sans text-body-sm ${projectType ? "text-white" : "text-dim/40"}`}>
                {projectType
                  ? projectOptions.find((o) => o.value === projectType)?.label
                  : t.projectTypePlaceholder}
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-dim flex-shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {projectOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-bg2 border border-[rgba(240,244,255,0.1)] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]" role="listbox" aria-label={t.projectTypeListAria}>
                {projectOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setValue("project_type", opt.value, { shouldValidate: true });
                      setProjectOpen(false);
                    }}
                    role="option"
                    aria-selected={projectType === opt.value}
                    className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors hover:bg-[rgba(11,61,231,0.06)] ${
                      projectType === opt.value ? "bg-[rgba(11,61,231,0.06)]" : ""
                    }`}
                  >
                    <span className="font-sans text-nav text-white">{opt.label}</span>
                    {opt.sub && (
                      <span className="font-sans text-tag text-dim mt-0.5">({opt.sub})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.project_type && (
            <p className="font-sans text-tag text-red-400 mt-0.5">
              {errors.project_type.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans text-meta tracking-[0.14em] uppercase text-dim text-left block">
            {t.notesLabel}
            <span className="normal-case tracking-normal text-meta text-dim/60 ml-1">
              {t.notesOptional}
            </span>
          </label>
          <div className="relative">
            <textarea
              {...register("notes")}
              placeholder={t.notesPlaceholder}
              rows={3}
              maxLength={500}
              className={`${inputClass(!!errors.notes)} resize-none leading-[1.6] text-left`}
            />
            <span
              className={`absolute bottom-2.5 right-3 font-sans text-meta tabular-nums ${
                notesValue.length >= 450 ? "text-amber-400" : "text-dim/50"
              }`}
            >
              {notesValue.length}/500
            </span>
          </div>
          {errors.notes && (
            <p className="font-sans text-tag text-red-400 mt-0.5">
              {errors.notes.message}
            </p>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 px-6 py-4 bg-bg2 border-t border-[rgba(240,244,255,0.06)]">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full font-sans text-nav tracking-[0.06em] font-bold bg-cyan text-white py-3.5 rounded-xl transition-all duration-250 hover:bg-blue4 hover:shadow-[0_0_28px_rgba(11,61,231,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-cyan disabled:hover:shadow-none flex items-center justify-center gap-2.5"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              {t.submitting}
            </>
          ) : (
            t.submit
          )}
        </button>
        {submitError && (
          <p className="font-sans text-tag text-red-400 text-center mb-2">
            {t.submitError}
          </p>
        )}
      </div>
    </form>
  );
}

function PhoneInput({
  setValue,
  error,
  lang,
}: {
  setValue: UseFormSetValue<LeadFormData>;
  error?: string;
  lang: Lang;
}) {
  const t = STRINGS[lang];
  const [dialCode, setDialCode] = useState("+62");
  const [open, setOpen] = useState(false);
  const [localPhone, setLocalPhone] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);


  const updateValue = (dial: string, local: string) => {
    const digits = local.replace(/[^0-9]/g, "").replace(/^0+/, "");
    setValue("whatsapp_number", digits ? `${dial}${digits}` : "", { shouldValidate: true });
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalPhone(e.target.value);
    updateValue(dialCode, e.target.value);
  };

  const handleDialSelect = (dial: string) => {
    setDialCode(dial);
    setOpen(false);
    updateValue(dial, localPhone);
  };

  const selected = COUNTRY_CODES.find((c) => c.dial === dialCode)!;

  return (
    <div className="flex gap-2">
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t.countryAria}
          className={`h-full flex items-center gap-1.5 px-3 bg-bg3 rounded-xl border transition-all duration-200 ${
            error
              ? "border-red-400/60"
              : "border-[rgba(240,244,255,0.08)] hover:border-[rgba(11,61,231,0.3)]"
          }`}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="font-sans text-nav text-white tabular-nums">{dialCode}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-dim flex-shrink-0">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-30 bg-bg2 border border-[rgba(240,244,255,0.1)] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-44" role="listbox" aria-label={t.countryListAria}>
            {COUNTRY_CODES.map((c) => (
              <button
                key={c.dial}
                type="button"
                onClick={() => handleDialSelect(c.dial)}
                role="option"
                aria-selected={dialCode === c.dial}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-[rgba(11,61,231,0.06)] ${
                  dialCode === c.dial ? "bg-[rgba(11,61,231,0.06)]" : ""
                }`}
              >
                <span className="text-sm leading-none">{c.flag}</span>
                <span className="font-sans text-nav text-white flex-1">
                  {lang === "en" ? c.labelEn : c.label}
                </span>
                <span className="font-sans text-tag text-dim tabular-nums">{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="tel"
        value={localPhone}
        onChange={handleLocalChange}
        placeholder={t.whatsappPlaceholder}
        autoComplete="tel-national"
        aria-label={t.whatsappAria}
        className={`flex-1 ${inputClass(!!error)}`}
      />
    </div>
  );
}

/**
 * Read-only "booking context" field used at the top of the form
 * for the abroad-production booking flow. Bentala-blue tinted so
 * it reads as system-supplied info distinct from editable inputs.
 */
function BookingContextField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="font-sans text-meta tracking-[0.18em] uppercase text-white/75 font-semibold">
        {label}
      </label>
      <div
        className="font-sans text-body-sm text-white px-4 py-3 rounded-xl border"
        style={{
          background: "rgba(11, 61, 231, 0.1)",
          borderColor: "rgba(11, 61, 231, 0.32)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="font-sans text-meta tracking-[0.14em] uppercase text-dim flex items-center gap-1">
        {label}
        {required && <span className="text-cyan">*</span>}
      </label>
      {children}
      {error && (
        <p className="font-sans text-tag text-red-400 mt-0.5">{error}</p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    "w-full bg-bg3 border rounded-xl px-4 py-3 font-sans text-body-sm text-white placeholder:text-dim/40",
    "focus:outline-none focus:ring-2 transition-all duration-200",
    hasError
      ? "border-red-400/60 focus:ring-red-400/30"
      : "border-[rgba(240,244,255,0.08)] focus:border-[rgba(11,61,231,0.4)] focus:ring-[rgba(11,61,231,0.15)]",
  ].join(" ");
}
