import { TeamMember } from "@/lib/types";
import RevealOnScroll from "@/components/shared/RevealOnScroll";

interface Props {
  team: TeamMember[];
}

export default function TeamSection({ team }: Props) {
  if (team.length === 0) return null;

  return (
    <section className="py-24 px-5 md:px-[52px] bg-bg2">
      <div>
        <RevealOnScroll className="mb-16">
          <div className="font-sans text-[10px] tracking-[0.16em] uppercase text-cyan flex items-center gap-3.5 mb-5">
            <span className="w-7 h-px bg-cyan" />
            The People
          </div>
          <h2 className="font-sans text-[clamp(44px,5vw,72px)] tracking-[-0.01em] text-white">
            Meet The <span className="text-cyan">Team</span>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member, i) => (
            <RevealOnScroll key={member.id} delay={i * 100}>
              <div className="p-7 bg-bg3 border-[0.5px] border-[rgba(240,244,255,0.06)] hover:border-[rgba(11,61,231,0.15)] transition-all duration-300 h-full">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-sans text-lg font-bold tracking-wider mb-6"
                  style={{
                    backgroundColor: `${member.avatar_color}1a`,
                    color: member.avatar_color,
                    border: `1.5px solid ${member.avatar_color}40`,
                  }}
                >
                  {member.initials}
                </div>

                <div className="font-sans text-white text-[17px] tracking-[-0.01em] font-medium mb-1">
                  {member.name}
                </div>
                <div className="font-sans text-[10px] tracking-[0.15em] uppercase text-cyan mb-4">
                  {member.title}
                </div>
                <p className="text-[13px] font-light text-dim leading-[1.75] mb-5">
                  {member.role_description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-sans text-[9px] tracking-[0.1em] uppercase px-2.5 py-1 bg-[rgba(11,61,231,0.05)] border border-[rgba(11,61,231,0.12)] text-dim"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
