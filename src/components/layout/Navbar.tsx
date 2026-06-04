"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const FALLBACK_LOGO = "/logo.png";

interface Props {
  /** Logo image URL fetched from bsi_hero.logo_url server-side and
   *  threaded through layout.tsx. Falls back to /logo.png in /public
   *  when null/empty so the navbar always renders something. */
  logoUrl?: string | null;
  /** Per-route visibility toggles fetched from bsi_hero. When true,
   *  the matching link is filtered out of the rendered list. */
  hideHome?: boolean | null;
  hideAbout?: boolean | null;
  hideNews?: boolean | null;
}

export default function Navbar({
  logoUrl,
  hideHome,
  hideAbout,
  hideNews,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const resolvedLogo = logoUrl && logoUrl.trim() !== "" ? logoUrl : FALLBACK_LOGO;
  const isExternalLogo = resolvedLogo.startsWith("http");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-close drawer on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open so the page underneath
  // doesn't slide around when the user pans inside the menu.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navLinks: { href: string; label: string }[] = (
    [
      { href: "/", label: "Home", hidden: !!hideHome },
      { href: "/about", label: "About Us", hidden: !!hideAbout },
      { href: "/news", label: "News", hidden: !!hideNews },
    ] as const
  )
    .filter((l) => !l.hidden)
    .map(({ href, label }) => ({ href, label }));

  return (
    <nav className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-between px-5 md:px-[52px] py-3 md:py-[22px]">
      {/* Glass background layer — fades in on scroll. The
          semi-transparent alpha + backdrop-blur lets the navbar
          show hero/intro content blurred behind it (preserves the
          "glass" aesthetic). To prevent portfolio tiles from
          bleeding through, the PortfolioMasonry sticky banner
          extends its solid bg-bg up under this navbar (top-0 +
          pt-36) — so the blur sees a solid mask, not the grid. */}
      <div
        className="absolute inset-0 backdrop-blur-xl backdrop-saturate-150 bg-[rgba(8,9,13,0.55)] shadow-[0_8px_32px_rgba(0,0,0,0.35)] pointer-events-none"
        style={{ opacity: scrolled ? 1 : 0, transition: "opacity 500ms ease" }}
      />

      {/* Bottom separator — gradient fade from center */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          opacity: scrolled ? 1 : 0,
          transition: "opacity 500ms ease",
        }}
      />

      <Link href="/" className="relative z-10 flex items-center no-underline flex-shrink-0">
        {isExternalLogo ? (
          // External (Supabase Storage) URLs aren't allowed by next/image
          // unless added to remotePatterns. Use plain <img> so admins can
          // upload to any bucket without a Next config change.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedLogo}
            alt="Bentala Studio"
            height={64}
            width={220}
            className="h-11 md:h-16 w-auto object-contain"
            style={{ maxWidth: 260 }}
          />
        ) : (
          <Image
            src={resolvedLogo}
            alt="Bentala Studio"
            height={64}
            width={220}
            className="object-contain h-11 md:h-16 w-auto"
          />
        )}
      </Link>

      {/* Desktop nav — md+ */}
      <ul className="relative z-10 hidden md:flex gap-9 list-none ml-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`font-sans text-body-lg font-medium no-underline transition-colors relative ${
                  isActive ? "text-white" : "text-dim hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-[5px] left-0 right-0 h-px bg-cyan" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile hamburger — only on small screens. Tap to open the
          drawer below; tap again (or any link inside) to close. */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        className="relative z-[1000] md:hidden ml-auto w-11 h-11 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] active:bg-[rgba(255,255,255,0.08)]"
      >
        <span className="sr-only">{menuOpen ? "Tutup menu" : "Buka menu"}</span>
        {/* Two bars that morph into an X. The top bar rotates 45°
            and translates down, bottom bar -45° and translates up,
            so the toggle is visually self-explanatory without a
            second icon. */}
        <span
          aria-hidden
          className="absolute w-5 h-px bg-white transition-all duration-300"
          style={{
            transform: menuOpen
              ? "translateY(0) rotate(45deg)"
              : "translateY(-4px) rotate(0deg)",
          }}
        />
        <span
          aria-hidden
          className="absolute w-5 h-px bg-white transition-all duration-300"
          style={{
            transform: menuOpen
              ? "translateY(0) rotate(-45deg)"
              : "translateY(4px) rotate(0deg)",
          }}
        />
      </button>

      {/* Mobile drawer — full-viewport overlay. Sibling of the
          navbar children so backdrop blur / dim covers everything
          beneath the bar (which stays z-[999] above the drawer
          via stacking context). */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-0 left-0 right-0 bottom-0 z-[998]"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute inset-0 bg-[rgba(8,9,13,0.92)] backdrop-blur-xl"
            aria-hidden
          />
          <nav
            className="relative h-full flex flex-col items-center justify-center gap-2 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`font-sans font-bold tracking-tight no-underline transition-all relative ${
                    isActive ? "text-white" : "text-dim hover:text-white"
                  }`}
                  style={{
                    fontSize: "clamp(36px, 9vw, 56px)",
                    lineHeight: 1.1,
                    padding: "12px 24px",
                    opacity: 0,
                    animation: "fadeUp 0.4s ease forwards",
                    animationDelay: `${0.1 + i * 0.08}s`,
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-12 h-px bg-cyan" />
                  )}
                </Link>
              );
            })}

            <style jsx>{`
              @keyframes fadeUp {
                from {
                  opacity: 0;
                  transform: translateY(12px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </nav>
        </div>
      )}
    </nav>
  );
}
