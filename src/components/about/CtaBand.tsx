"use client";

import { useState } from "react";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { RichHeadline } from "@/components/shared/RichHeadline";
import StartCollaborationDialog from "@/components/home/StartCollaborationDialog";
import { trackEvent } from "@/lib/tracker";
import type { Service } from "@/lib/types";

interface Props {
  services: Service[];
  leadWhatsappNumber?: string;
  /** Admin-editable email for the "Or say hello" footer. When
   *  null/empty, falls back to the bundled default. Click on the
   *  rendered address opens Gmail compose with the recipient
   *  pre-filled. */
  contactEmail?: string | null;
  /** Admin-editable headline. Accepts HTML from the Tiptap rich
   *  editor or the legacy markdown subset (`*word*`, `**word**`,
   *  `\n`). Falls back to bundled default when null/empty. */
  title?: string | null;
}

const DEFAULT_CONTACT_EMAIL = "hello@bentalastudio.id";
const DEFAULT_TITLE = "Ready to *create*\nsomething **great**?";

const BOLD_STYLE =
  "color:transparent;-webkit-text-stroke:2px #0B3DE7;font-weight:800;";
const ITALIC_STYLE =
  "font-family:Georgia,serif;font-style:italic;font-weight:500;color:#0B3DE7;letter-spacing:-0.02em;";

/**
 * Closing CTA — restructured from a center-aligned slab into a
 * cinematic "open envelope" composition: oversized split headline
 * with one half italic-serif, an offset blue glow, and CTAs
 * anchored to a subtle hairline that ties the page off. Reads as
 * an intentional sign-off rather than a generic call-to-action.
 */
export default function CtaBand({ services, leadWhatsappNumber, contactEmail, title }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const email = (contactEmail && contactEmail.trim()) || DEFAULT_CONTACT_EMAIL;
  const headline = (title && title.trim()) || DEFAULT_TITLE;
  // Gmail web-compose URL — opens the user's Gmail account in a
  // new tab with the To: field already filled. Falls through to
  // mailto: when Gmail is blocked or the user uses a different
  // client (target=_blank means a mailto fallback still works
  // via the OS-level handler in most browsers).
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;

  return (
    <section className="relative overflow-hidden bg-bg2 py-28 md:py-40">
      {/* Layered atmosphere — large soft blue bloom slightly off-
          center, plus a faint conic gradient sweep so the band
          doesn't read as a flat colour field. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 30% 50%, rgba(11,61,231,0.18) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "conic-gradient(from 200deg at 75% 50%, rgba(255,255,255,0.04) 0deg, transparent 90deg, transparent 270deg, rgba(11,61,231,0.08) 360deg)",
        }}
      />

      <div className="relative px-5 md:px-[52px]">
        {/* Centered sign-off stack — headline anchors the top, then
            CTAs, then a hairline divider, then the email echo at
            the very bottom. Everything is centred on the column
            axis so the band reads as a deliberate full-stop to
            the page instead of a split editorial layout. */}
        <RevealOnScroll className="reveal-zoom">
          <RichHeadline
            source={headline}
            as="h2"
            className="font-sans uppercase font-bold text-white leading-[0.98] md:leading-[0.92] tracking-[-0.015em] text-center break-words text-[clamp(20px,5.5vw,28px)] lg:text-[clamp(56px,7vw,120px)]"
            boldStyle={BOLD_STYLE}
            italicStyle={ITALIC_STYLE}
          />
        </RevealOnScroll>

        {/* Buttons — centred row directly under the headline. */}
        <RevealOnScroll delay={150}>
          <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => {
                setDialogOpen(true);
                void trackEvent("cta_click", "about_cta_band");
              }}
              className="font-sans text-sm md:text-body-sm font-bold tracking-[0.02em] bg-cyan text-white px-5 py-2.5 md:px-6 md:py-3 rounded-full transition-all hover:bg-blue4 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(11,61,231,0.25)]"
            >
              Start Collaboration
            </button>
            <a
              href="/#portfolio"
              className="font-sans text-sm md:text-body-sm font-medium tracking-[0.02em] border border-white/25 text-white px-5 py-2.5 md:px-6 md:py-3 no-underline rounded-full transition-all hover:border-white hover:bg-white/[0.06] hover:-translate-y-0.5"
            >
              View Portfolio
            </a>
          </div>
        </RevealOnScroll>

        {/* Or-say-hello block — sits at the BOTTOM of the band,
            below the buttons. Centred under a hairline divider so
            it reads as a contact sign-off, not a competing CTA. */}
        <RevealOnScroll delay={250}>
          <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-[rgba(240,244,255,0.12)] text-center">
            <span className="block font-sans text-[10px] tracking-[0.24em] uppercase text-white/80 mb-2">
              Or say hello
            </span>
            <a
              href={gmailHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-white no-underline hover:text-cyan transition-colors"
              style={{ fontSize: "clamp(15px, 1.2vw, 18px)" }}
            >
              {email}
            </a>
          </div>
        </RevealOnScroll>
      </div>

      <StartCollaborationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        services={services}
        leadWhatsappNumber={leadWhatsappNumber}
      />
    </section>
  );
}
