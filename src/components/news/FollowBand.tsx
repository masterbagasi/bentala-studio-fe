import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { Body } from "@/components/shared/Typography";

export default function FollowBand() {
  return (
    <RevealOnScroll>
      <div className="mx-5 md:mx-[52px] mb-20 p-8 md:p-12 bg-bg2 border-[0.5px] border-[rgba(11,61,231,0.1)] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(11,61,231,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-[2]">
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-cyan mb-2.5">
            Follow BPI
          </div>
          <div className="text-[clamp(22px,3vw,32px)] font-bold text-white leading-[1.1] mb-2">
            Stay Updated With
            <br />
            Bentala Project Indonesia
          </div>
          <Body>
            Konten berita internasional terkait Indonesia setiap hari di Instagram &amp;
            TikTok kami.
          </Body>
        </div>

        <div className="flex gap-3 flex-wrap flex-shrink-0 relative z-[2]">
          <a
            href="https://instagram.com/bentalaprojectindonesia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-xs font-semibold px-[22px] py-[11px] rounded-lg no-underline transition-all bg-[rgba(240,244,255,0.06)] text-white border-[0.5px] border-[rgba(240,244,255,0.12)] hover:bg-[rgba(240,244,255,0.12)] hover:border-[rgba(240,244,255,0.25)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            @bentalaprojectindonesia
          </a>
          <a
            href="https://tiktok.com/@bentalaprojectindonesia"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sans text-xs font-semibold px-[22px] py-[11px] rounded-lg no-underline transition-all bg-[rgba(240,244,255,0.06)] text-white border-[0.5px] border-[rgba(240,244,255,0.12)] hover:bg-[rgba(240,244,255,0.12)] hover:border-[rgba(240,244,255,0.25)]"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
            </svg>
            @bentalaprojectindonesia
          </a>
        </div>
      </div>
    </RevealOnScroll>
  );
}
