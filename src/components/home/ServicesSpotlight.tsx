"use client";

import { useState } from "react";
import Image from "next/image";
import { Service } from "@/lib/types";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StartCollaborationDialog from "@/components/home/StartCollaborationDialog";
import { trackEvent } from "@/lib/tracker";

interface Props {
  services: Service[];
  /** Threaded through to the lead-form dialog so the WhatsApp
      hand-off uses the same number as the hero CTA. */
  leadWhatsappNumber?: string;
}

/**
 * Detailed services section. Each service that has a `media_url`
 * gets rendered as a 2-column row (text on one side, image/video
 * on the other), alternating sides on every other row so the page
 * has visual rhythm. Services without media stay quiet — they show
 * elsewhere as nav/hero pills.
 */
export default function ServicesSpotlight({ services, leadWhatsappNumber }: Props) {
  const spotlight = services.filter((s) => s.media_url && s.is_published);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Tracks which service the user clicked the CTA from. Passed to the
  // dialog so it can pre-select that service in the "Jenis Kebutuhan"
  // dropdown — clicking "Start Collaboration" on Content Production
  // should land the user on a form already pointing at Content
  // Production, not an empty placeholder.
  const [initialProjectType, setInitialProjectType] = useState<string | undefined>(undefined);
  if (spotlight.length === 0) return null;
  const openDialog = (serviceName: string) => {
    setInitialProjectType(serviceName);
    setDialogOpen(true);
    void trackEvent("cta_click", `services_start_a_project:${serviceName}`);
  };

  return (
    <section className="pb-4 md:pb-8 px-5 md:px-[52px] relative">
      <div className="pt-14 md:pt-20 flex flex-col gap-16 md:gap-28">
        {spotlight.map((service, i) => (
          <ServiceRow
            key={service.id}
            service={service}
            reversed={i % 2 === 1}
            onStartProject={() => openDialog(service.name)}
            revealDelay={i * 140}
          />
        ))}
      </div>
      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        services={services}
        leadWhatsappNumber={leadWhatsappNumber}
        initialProjectType={initialProjectType}
      />
    </section>
  );
}

function ServiceRow({
  service,
  reversed,
  onStartProject,
  revealDelay = 0,
}: {
  service: Service;
  reversed: boolean;
  onStartProject: () => void;
  revealDelay?: number;
}) {
  return (
    <RevealOnScroll className="block" delay={revealDelay}>
      <div
        className={`cinematic-reveal grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
          reversed ? "lg:[&>*:first-child]:lg:order-2" : ""
        }`}
      >
        {/* Text column. On mobile (single-col grid) the media is
            pulled above (order-1) and the text block sits below it,
            center-aligned across heading, description, and CTAs.
            `lg:order-none` + `lg:text-left` + `lg:items-start` +
            `lg:mx-0` snap everything back to left-aligned at the lg
            breakpoint where the two-column alternation logic takes
            over and centering would fight the side-by-side layout. */}
        <div className="flex flex-col gap-6 max-w-xl order-2 lg:order-none mx-auto lg:mx-0 text-center lg:text-left items-center lg:items-start">
          <h3 className="slate-heading font-sans uppercase font-bold leading-[0.95] tracking-tight text-[clamp(2rem,3.5vw,3rem)] text-white">
            <span className="slate-heading-inner">{service.name}</span>
          </h3>
          {service.description && (
            <p className="slate-description font-sans text-base md:text-lg text-[rgba(240,244,255,0.7)] leading-relaxed">
              {service.description}
            </p>
          )}
          <div className="slate-cta flex flex-wrap gap-3 mt-2 justify-center lg:justify-start">
            <button
              type="button"
              onClick={onStartProject}
              className="font-sans text-body-sm font-bold tracking-[0.02em] bg-cyan text-white px-6 py-3 rounded-full transition-all hover:bg-blue4 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(11,61,231,0.25)]"
            >
              {service.cta_text || "Start Collaboration"}
            </button>
            {service.learn_more_url && (
              <a
                href={service.learn_more_url}
                className="font-sans text-body-sm font-medium tracking-[0.02em] text-white px-6 py-3 rounded-full border border-white/30 transition-all hover:border-white hover:bg-white/[0.04]"
              >
                {service.learn_more_text || "Learn more"}
              </a>
            )}
          </div>
        </div>

        {/* Media column — pulled above the text on mobile via
            `order-1`; lg breakpoint resets to natural DOM order.
            `slate-media` adds a scale-down + brightness-lift on
            reveal, like a camera focus pulling onto the subject. */}
        <ServiceMedia
          service={service}
          className="slate-media order-1 lg:order-none"
        />
      </div>
    </RevealOnScroll>
  );
}

function ServiceMedia({
  service,
  className,
}: {
  service: Service;
  className?: string;
}) {
  if (!service.media_url) return null;
  const isVideo = service.media_type === "video";

  return (
    <div
      className={`relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.05] ${
        className ?? ""
      }`}
    >
      {isVideo ? (
        <video
          src={service.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
        />
      ) : (
        <Image
          src={service.media_url}
          alt={service.name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      )}
    </div>
  );
}
