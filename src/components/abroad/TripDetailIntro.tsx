"use client";

import { useMemo, useState } from "react";
import StartCollaborationDialog from "@/components/home/StartCollaborationDialog";
import { trackEvent } from "@/lib/tracker";
import type {
  AbroadProductionTrip,
  AbroadService,
  Service,
} from "@/lib/types";

interface Props {
  trip: AbroadProductionTrip;
  /** Generic home-page services. Kept on the prop for backward
   *  compatibility, but the booking dialog now pulls its dropdown
   *  options from `abroadServices` so the "Jenis Kebutuhan" list
   *  matches what's actually shown on the trip's Services section. */
  services: Service[];
  /** Abroad-production services (Video Production, Photography,
   *  Event Activation, Social Content by default). Used to populate
   *  the booking dialog's project-type dropdown so admin edits to
   *  the abroad-services table flow through automatically. */
  abroadServices?: AbroadService[];
  leadWhatsappNumber?: string;
  /** Bentala Studio brand mark rendered at the very top of this
   *  section, directly above the "Abroad Production" headline.
   *  Falls back to the bundled `/logo-studio-tight.png` when null. */
  studioLogoUrl?: string | null;
}

/**
 * Title + description + "Booking Now" CTA block on the abroad-production
 * detail page. The CTA opens the same lead form as the home banner but
 * with copy specific to abroad-production booking: title is overridden,
 * the trip's destination + date show up as a context line, and the
 * notes textarea is pre-filled with the trip's headline so the visitor
 * doesn't have to retype it before hitting send.
 */
export default function TripDetailIntro({
  trip,
  services,
  abroadServices,
  leadWhatsappNumber,
}: Props) {
  const [open, setOpen] = useState(false);

  // Booking dialog's project-type dropdown should mirror the services
  // shown on this trip's "Services We Offer" section (Video Production,
  // Photography, etc.) — not the generic home-page services. We map
  // each AbroadService row into the Service shape the dialog expects.
  // Falls back to the home services when no abroad services exist yet
  // so the form never renders an empty dropdown.
  const dialogServices = useMemo<Service[]>(() => {
    if (abroadServices && abroadServices.length > 0) {
      return abroadServices.map((s) => ({
        id: s.id,
        name: s.title,
        is_published: s.is_published,
        sort_order: s.sort_order,
      }));
    }
    return services;
  }, [abroadServices, services]);

  // First abroad service becomes the default selection so the user
  // sees the most relevant booking type pre-selected on open.
  const initialProjectType = useMemo(() => {
    return dialogServices[0]?.name ?? undefined;
  }, [dialogServices]);

  // Headline = destination country. The admin only manages `country`
  // as the trip's identity — the legacy `title` field has been
  // dropped from the trip-edit form, so we ignore it on render too
  // (otherwise old rows would still show their stale custom titles).
  const headline = trip.country;
  const description = trip.description?.trim() || "";

  // Destination context shown as TWO read-only fields at the top of
  // the booking dialog (Country | Date) so each datum reads as its
  // own chip instead of one run-on line. The note (e.g. "Slot
  // Terbatas") is intentionally NOT included — it's marketing copy
  // for the public banner, not relevant inside the booking dialog.
  // The visitor's notes textarea stays EMPTY so they can write
  // their own message; the dialog injects the country + date into
  // the submitted notes + WhatsApp message automatically so the
  // studio still knows what trip was booked.
  const departureLabel = formatDate(trip.departure_date);
  const returnLabel = trip.return_date ? formatDate(trip.return_date) : null;

  const handleOpen = () => {
    void trackEvent(
      "cta_click",
      `abroad_production_detail_book:${trip.country}`,
    );
    setOpen(true);
  };

  // Secondary editorial image (admin-uploaded) sits in the LEFT column
  // and falls back to the trip's main image when empty so the layout
  // never collapses to a single column unintentionally.
  const sideImage = trip.secondary_image_url || trip.image_url;

  return (
    <section className="px-5 md:px-[52px] pt-[124px] md:pt-[136px] pb-16 md:pb-32">
      {/* Two-column intro: secondary image on the LEFT, copy stack on
          the RIGHT (logo → ABROAD PRODUCTION → trip headline → date →
          description → Start Collaboration CTA). Mobile/tablet stack:
          image first (order-1), copy second (order-2) so visitors see
          the visual hook before the copy. */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-center">
        {/* Side image — locked to a 4:3 frame so the whole intro fits
            in a single viewport on desktop instead of growing tall
            with the natural image aspect. `object-cover` makes the
            image fill the frame edge-to-edge (no letterbox, no gap
            between the rounded outline and the actual photo). The
            radius + shadow live on the container so they clip the
            image cleanly. */}
        <div
          className="relative w-full order-1 overflow-hidden rounded-[28px]"
          style={{
            aspectRatio: "4 / 3",
            boxShadow:
              "0 24px 60px -24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sideImage}
            alt={trip.title || trip.country}
            className="block w-full h-full select-none"
            style={{ objectFit: "cover" }}
            draggable={false}
          />
        </div>

        {/* Copy column — centered on mobile/tablet (single-column
            stacked layout) so the copy reads as a unified hero block
            under the image. Switches to left-aligned at `lg` once the
            2-column grid kicks in so the copy hugs the image edge. */}
        <div className="flex flex-col gap-5 md:gap-6 order-2 items-center text-center lg:items-start lg:text-left">
          <div className="flex flex-col gap-3 md:gap-4 items-center lg:items-start">

            {/* Headline row — country + optional "Slot Terbatas" style
                marketing note sit side-by-side. Country is now the
                page's hero typography (clamp 48-96px), so visitors
                see the unique part of each trip immediately. */}
            <div className="flex flex-wrap items-baseline justify-center lg:justify-start gap-x-4 gap-y-3">
              <h1
                className="font-sans uppercase font-bold text-white leading-[0.94] tracking-[-0.025em] break-words"
                style={{ fontSize: "clamp(40px, 6.2vw, 88px)" }}
              >
                {headline}
              </h1>
              {trip.note && (
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-full font-sans uppercase tracking-[0.2em] text-white border self-center"
                  style={{
                    fontSize: "clamp(10.5px, 0.8vw, 12px)",
                    background: "rgba(255,255,255,0.06)",
                    borderColor: "rgba(255,255,255,0.16)",
                  }}
                >
                  {trip.note}
                </span>
              )}
            </div>
            {/* Departure / Return — editorial two-column treatment.
                Clean typography directly on the page: small tracked
                white eyebrow over a bold white date, paired by a
                thin fading white rule between them. */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-7 sm:gap-x-10 gap-y-4 mt-5">
              <DateField label="Departure" value={departureLabel} />
              {returnLabel && (
                <>
                  <span
                    aria-hidden
                    className="hidden sm:block self-stretch"
                    style={{
                      width: 1,
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
                    }}
                  />
                  <DateField label="Return" value={returnLabel} />
                </>
              )}
            </div>
          </div>

          {description && (
            <p
              className="font-sans text-white/85 leading-[1.6] whitespace-pre-line"
              style={{ fontSize: "clamp(17px, 1.4vw, 22px)" }}
            >
              {description}
            </p>
          )}

          {/* Book Now CTA — primary action on the page. Pill button
              with Bentala-blue gradient, brand glow + inner highlight,
              and a directional arrow that nudges right on hover so the
              affordance reads as "go forward / start". */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-2">
            <BookNowButton onClick={handleOpen} />
          </div>
        </div>
      </div>

      <StartCollaborationDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        services={dialogServices}
        leadWhatsappNumber={leadWhatsappNumber}
        initialProjectType={initialProjectType}
        title="Abroad Production"
        destinationCountry={trip.country}
        departureDate={departureLabel}
        returnDate={returnLabel ?? undefined}
        lang="en"
      />
    </section>
  );
}

/**
 * Primary CTA pill — Bentala-blue gradient, multi-layer glow, and a
 * directional arrow that slides right on hover. Stateful so the
 * interactive feedback (lift, glow intensify, arrow nudge) reads as a
 * single coordinated micro-interaction instead of CSS jank.
 */
function BookNowButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="group relative inline-flex items-center gap-3 font-sans font-bold tracking-[0.06em] uppercase text-white rounded-full"
      style={{
        fontSize: "clamp(13px, 1.1vw, 16px)",
        padding: "16px 28px 16px 34px",
        background:
          "linear-gradient(135deg, #0B3DE7 0%, #1849F0 55%, #2D5DF5 100%)",
        boxShadow: hovered
          ? "0 0 0 1px rgba(255,255,255,0.16) inset, 0 0 36px rgba(11,61,231,0.55), 0 22px 50px -10px rgba(11,61,231,0.65)"
          : "0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 22px rgba(11,61,231,0.32), 0 16px 40px -12px rgba(11,61,231,0.5)",
        transform: pressed
          ? "translateY(0) scale(0.98)"
          : hovered
            ? "translateY(-3px)"
            : "translateY(0)",
        transition:
          "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease",
      }}
    >
      <span>Book Now</span>
      <span
        aria-hidden
        className="inline-flex items-center justify-center w-6 h-6 rounded-full"
        style={{
          background: "rgba(255,255,255,0.18)",
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          transition: "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="18" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        </svg>
      </span>
    </button>
  );
}

/**
 * Departure / Return field rendered in the hero. Editorial treatment —
 * no box, no border, no icon: a tracked white eyebrow over a bold
 * white date, sized confidently so the dates carry their own visual
 * weight against the cinematic hero. The eyebrow uses 70% white so it
 * sits a notch below the value in hierarchy without losing readability.
 */
function DateField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 text-white">
      <span
        className="font-sans uppercase font-semibold text-white/70"
        style={{
          fontSize: "clamp(11px, 0.85vw, 12.5px)",
          letterSpacing: "0.32em",
        }}
      >
        {label}
      </span>
      <span
        className="font-sans font-semibold whitespace-nowrap"
        style={{
          fontSize: "clamp(20px, 1.8vw, 28px)",
          letterSpacing: "-0.012em",
          lineHeight: 1.05,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

