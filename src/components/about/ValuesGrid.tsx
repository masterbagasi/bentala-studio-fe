import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { RichHeadline } from "@/components/shared/RichHeadline";

interface Value {
  name: string;
  desc: string;
  icon: string;
}

interface Props {
  values: Value[];
  title?: string | null;
}

const DEFAULT_TITLE = "The Six Principles";

const BOLD_STYLE =
  "color:transparent;-webkit-text-stroke:2px #0B3DE7;font-weight:800;";
const ITALIC_STYLE =
  "font-family:Georgia,serif;font-style:italic;font-weight:500;color:#0B3DE7;letter-spacing:-0.02em;";

/**
 * Six Principles — 3 × 2 grid of speech-burst cards. Shapes are
 * taken verbatim from the Shape Polos asset: four pure-white layered
 * paths + a black number badge. The visual hierarchy mirrors the
 * source layout exactly:
 *   • Badge top-left
 *   • Title in the burst-tab band just below the badge
 *   • Description wrapping below the title, spanning into the front
 *     rounded rect
 * No gradients, no tab animations — the source is flat white and
 * we keep it that way.
 */
export default function ValuesGrid({ values, title }: Props) {
  const v = values.slice(0, 6);
  const headline = (title && title.trim()) || DEFAULT_TITLE;

  return (
    <section className="relative bg-black overflow-hidden">
      {/* Atmospheric bloom — radial blue glow behind the title. */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          width: "min(900px, 80%)",
          height: "min(900px, 80%)",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(closest-side, rgba(11,61,231,0.22) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      {/* Dot-grid texture, masked toward the centre. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 55%, #000 20%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 55%, #000 20%, transparent 85%)",
        }}
      />
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.10) 50%, transparent)",
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.08) 50%, transparent)",
        }}
      />

      {/* Wrapper structure mirrors StorySection's Vision/Mission
          rows so the horizontal bounds line up 1:1: outer div carries
          vertical padding, inner div carries horizontal padding. The
          identical `px-5 md:px-[52px]` keeps left/right edges flush
          with the section above. */}
      <div className="relative pt-24 md:pt-32 pb-24 md:pb-32">
        <div className="relative px-5 md:px-[52px]">
          <RevealOnScroll className="mb-16 md:mb-24">
            <div className="relative flex flex-col items-center text-center">
              <RichHeadline
                source={headline}
                as="h2"
                className="font-sans uppercase font-black text-white leading-[0.92] tracking-[-0.01em]"
                style={{ fontSize: "clamp(40px, 7vw, 100px)" }}
                boldStyle={BOLD_STYLE}
                italicStyle={ITALIC_STYLE}
              />
            </div>
          </RevealOnScroll>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-2 md:gap-x-3 gap-y-4 md:gap-y-8 pt-2">
            {v.map((value, i) => (
              <RevealOnScroll key={value.name + i} delay={i * 100}>
                <PrincipleCard value={value} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Source asset coordinates (Shape Polos / shape 5), used to crop the
// SVG viewBox so the silhouette sits flush with the card edges (md+).
const SHAPE_H = 205;
const CONTENT_LEFT = 33.4;
const CONTENT_RIGHT = 393.7;
const CONTENT_W = CONTENT_RIGHT - CONTENT_LEFT; // 360.3

function PrincipleCard({ value }: { value: Value }) {
  return (
    // Mobile: a plain white rounded card that grows to fit the copy
    // (single column, text in normal flow) — the fixed-aspect speech
    // burst was far shorter than the text on narrow screens, so the
    // absolutely-positioned copy overflowed and overlapped. Desktop
    // (md+) keeps the layered speech-burst silhouette with the copy
    // absolutely centered inside it.
    <div className="relative w-full bg-white rounded-3xl md:bg-transparent md:rounded-none md:aspect-[440/280]">
      <svg
        aria-hidden="true"
        className="hidden md:block absolute inset-0 w-full h-full drop-shadow-[0_20px_42px_rgba(0,0,0,0.55)]"
        viewBox={`${CONTENT_LEFT} 0 ${CONTENT_W} ${SHAPE_H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Four pure-white layered shapes — exact paths from the
            source Shape Polos asset, no gradient overlays. */}
        <path
          d="M 33.43 139.70 L 33.43 62.85 C 33.43 28.14 61.57 0 96.27 0 L 375.13 0 C 382.02 0 388 4.73 389.58 11.44 C 391.17 18.14 387.94 25.05 381.78 28.14 L 89.63 174.41 C 77.59 180.44 63.30 179.80 51.85 172.73 C 40.40 165.66 33.43 153.16 33.43 139.70 Z"
          fill="#ffffff"
        />
        <path
          d="M 393.74 51.87 L 393.74 145.05 C 393.74 151.20 391.29 157.10 386.95 161.45 C 382.59 165.80 376.70 168.25 370.54 168.25 L 54.78 168.25 C 52.70 168.25 50.92 166.76 50.54 164.72 C 50.16 162.68 51.29 160.65 53.23 159.91 L 372.09 37.01 C 376.99 35.13 382.50 35.77 386.83 38.74 C 391.15 41.71 393.74 46.62 393.74 51.87 Z"
          fill="#ffffff"
        />
        <path
          d="M 393.73 106.84 L 393.73 162.62 C 393.73 185.76 374.98 204.52 351.84 204.52 L 42.18 204.52 C 38.67 204.52 35.67 201.99 35.07 198.53 C 34.48 195.07 36.46 191.68 39.77 190.51 L 354.25 78.95 C 363.31 75.74 373.36 77.12 381.21 82.67 C 389.07 88.21 393.73 97.23 393.73 106.84 Z"
          fill="#ffffff"
        />
        <path
          d="M 47.65 113.72 L 379.52 113.72 C 387.37 113.72 393.73 120.09 393.73 127.94 L 393.73 164.83 C 393.73 172.68 387.37 179.05 379.52 179.05 L 47.65 179.05 C 39.80 179.05 33.43 172.68 33.43 164.83 L 33.43 127.94 C 33.43 120.09 39.80 113.72 47.65 113.72 Z"
          fill="#ffffff"
        />

      </svg>

      {/* Title + description — one column vertically centered within
          the card's white area, so the copy sits balanced (not bunched
          at the top or bottom) regardless of how many lines the
          description wraps to on narrow mobile cards. */}
      <div className="relative flex flex-col gap-2 px-7 py-8 pointer-events-none md:absolute md:inset-0 md:gap-[0.5em] md:justify-center md:px-[11%] md:py-[7%]">
        <h3 className="font-sans font-extrabold uppercase text-black leading-[1.05] md:leading-[1.02] tracking-[0.005em] text-[clamp(22px,5.5vw,28px)] md:text-[clamp(26px,3vw,46px)]">
          {value.name}
        </h3>
        <p className="font-sans text-black leading-[1.55] font-medium text-[15px] md:text-[clamp(17px,1.65vw,24px)]">
          {value.desc}
        </p>
      </div>
    </div>
  );
}
