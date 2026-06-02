import RevealOnScroll from "@/components/shared/RevealOnScroll";

interface Props {
  stats: { num: string; label: string }[];
}

export default function StatsBanner({ stats }: Props) {
  return (
    <RevealOnScroll>
      <div className="py-20 px-5 md:px-[52px] bg-bg2 border-t-[0.5px] border-b-[0.5px] border-[rgba(11,61,231,0.1)]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`text-center px-6 ${
                i < stats.length - 1
                  ? "border-r-[0.5px] border-[rgba(240,244,255,0.08)] max-md:border-r-0 max-md:border-b-[0.5px] max-md:pb-6"
                  : ""
              }`}
            >
              <div className="font-sans text-stat text-white leading-none">
                {stat.num.includes("+") || stat.num.includes("∞") ? (
                  <>
                    {stat.num.replace(/[+∞]/g, "")}
                    <span className="text-cyan">
                      {stat.num.includes("+") ? "+" : "∞"}
                    </span>
                  </>
                ) : stat.num === "∞" ? (
                  <span className="text-white">∞</span>
                ) : (
                  stat.num
                )}
              </div>
              <div className="font-sans text-meta tracking-[0.18em] uppercase text-dim mt-1.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}
