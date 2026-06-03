import type { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AboutData, HeroData, Service, TeamGalleryPhoto, TeamMember } from "@/lib/types";
import StorySection from "@/components/about/StorySection";
import ValuesGrid from "@/components/about/ValuesGrid";
import TeamGallery from "@/components/about/TeamGallery";
import CtaBand from "@/components/about/CtaBand";

// Render on every request so admin edits (headline, vision/mission
// text, values, hero banner, photos, dst) reflect on the public site
// immediately. ISR caching was serving a stale-while-revalidate copy
// that lagged a version behind; dynamic rendering reads fresh from
// Supabase each time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from("bsi_seo").select("*").eq("page", "about").single();
      if (data) {
        return {
          title: data.meta_title,
          description: data.meta_description,
          openGraph: { title: data.meta_title, description: data.meta_description, images: data.og_image_url ? [data.og_image_url] : [] },
        };
      }
    } catch (err) {
      console.error("[AboutPage] Failed to fetch SEO data:", err);
    }
  }
  return {
    title: "About Us — Bentala Studio Indonesia",
    description: "A creative agency born in Indonesia, built to take Indonesian brands to the world stage.",
  };
}

const fallbackAbout: AboutData = {
  id: "1",
  story_title: "OUR\nVISION",
  story_body: "Bentala is a creative ecosystem born in Indonesia, blending cinematic production with global perspective for indonesian brands ready to step on the world stage.",
  story_cta_url: "https://wa.me/6281284731599?text=Hi%20Bentala%20Studio!",
  vision_text: "To be Indonesia's leading creative ecosystem — recognized regionally for building global narratives and helping Indonesian brands elevate their perspective and positioning on the world stage.",
  mission_text: "We build strong, consistent brand identities. We elevate company reputation through world-class content. We develop personal branding for leaders and public figures. We tell Indonesia's stories from every corner of the globe.",
  edge_text: "We produce content internationally — giving your brand visuals that stand out in every feed, every story, every scroll.",
  stats: [
    { num: "4", label: "Core Creatives" },
    { num: "5+", label: "Countries" },
    { num: "2", label: "Active Brands" },
    { num: "∞", label: "Ideas" },
  ],
  values: [
    { name: "Think Global", desc: "We don't limit ourselves to what's available locally. Every project is approached with a global mindset and international production standards.", icon: "globe" },
    { name: "Cinematic Quality", desc: "Everything we produce is crafted with cinematic intention. No shortcuts, no generic templates — only content that earns attention.", icon: "film" },
    { name: "Brand First", desc: "Every decision starts with your brand. We obsess over how your story looks, feels, and lands — before we ever hit record.", icon: "star" },
    { name: "Collaborate Deep", desc: "We don't just execute briefs. We become partners — understanding your audience, your goals, and your voice at every stage.", icon: "users" },
    { name: "Own It", desc: "We take full responsibility for our work — the strategy, the execution, the results. No excuses. Just accountability and growth.", icon: "check" },
    { name: "Always Evolve", desc: "Trends change. Platforms shift. We stay ahead — constantly learning, experimenting, and refining our craft.", icon: "refresh" },
  ],
  principles_title: "The Six Principles",
  cta_title: "Ready to *create*\nsomething **great**?",
};

const fallbackTeam: TeamMember[] = [
  {
    id: "1",
    name: "Dandi Rivaldi",
    title: "CEO · Project Manager",
    role_description: "Leading the overall vision and strategy of Bentala — ensuring every project is executed with international standards and purposeful direction.",
    initials: "DR",
    avatar_color: "#0B3DE7",
    tags: ["Strategy", "Project Management"],
    is_published: true,
    sort_order: 1,
  },
  {
    id: "2",
    name: "Tri Naufal",
    title: "CCO · Content Strategic",
    role_description: "Designing content strategies that blend local storytelling with global aesthetics — building narratives that resonate across audiences.",
    initials: "TN",
    avatar_color: "#0B3DE7",
    tags: ["Content Strategy", "Creative Direction"],
    is_published: true,
    sort_order: 2,
  },
  {
    id: "3",
    name: "Faizal Kusuma",
    title: "COO · Videographer & Editor",
    role_description: "Delivering high-quality cinematic visuals — from capturing the perfect shot to a final edit that commands attention.",
    initials: "FK",
    avatar_color: "#A78BFA",
    tags: ["Videography", "Video Editing"],
    is_published: true,
    sort_order: 3,
  },
  {
    id: "4",
    name: "Reynaldi Saputra",
    title: "CBO · Graphic Designer",
    role_description: "Building strong, distinctive visual identities for brands that want to stand out in every medium and every market.",
    initials: "RS",
    avatar_color: "#34D399",
    tags: ["Graphic Design", "Brand Identity"],
    is_published: true,
    sort_order: 4,
  },
];

const fallbackServices: Service[] = [
  { id: "1", name: "Video Production", is_published: true, sort_order: 1 },
  { id: "2", name: "Social Media", is_published: true, sort_order: 2 },
  { id: "3", name: "International Content", is_published: true, sort_order: 3 },
  { id: "4", name: "KOL Campaign", is_published: true, sort_order: 4 },
  { id: "5", name: "Brand Design", is_published: true, sort_order: 5 },
  { id: "6", name: "Advertising", is_published: true, sort_order: 6 },
];

async function getData() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      about: fallbackAbout,
      team: fallbackTeam,
      services: fallbackServices,
      heroLead: null,
      gallery: [] as TeamGalleryPhoto[],
    };
  }
  try {
    const [aboutRes, teamRes, servicesRes, heroRes, galleryRes] = await Promise.all([
      supabase.from("bsi_about").select("*").single(),
      supabase.from("bsi_team").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("bsi_services").select("*").eq("is_published", true).order("sort_order"),
      supabase
        .from("bsi_hero")
        .select("lead_whatsapp_number")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bsi_team_gallery")
        .select("*")
        .eq("is_published", true)
        .order("sort_order"),
    ]);
    return {
      about: (aboutRes.data as AboutData) || fallbackAbout,
      team: (teamRes.data as TeamMember[])?.length ? (teamRes.data as TeamMember[]) : fallbackTeam,
      services: (servicesRes.data as Service[])?.length ? (servicesRes.data as Service[]) : fallbackServices,
      heroLead: (heroRes.data as Pick<HeroData, "lead_whatsapp_number"> | null) ?? null,
      gallery: (galleryRes.data as TeamGalleryPhoto[]) ?? [],
    };
  } catch (err) {
    console.error("[AboutPage] Failed to fetch page data:", err);
    return {
      about: fallbackAbout,
      team: fallbackTeam,
      services: fallbackServices,
      heroLead: null,
      gallery: [] as TeamGalleryPhoto[],
    };
  }
}

export default async function AboutPage() {
  const { about, services, heroLead, gallery } = await getData();

  return (
    <>
      <StorySection about={about} />
      <ValuesGrid values={about.values} title={about.principles_title} />
      <TeamGallery photos={gallery} />
      <CtaBand
        services={services}
        leadWhatsappNumber={heroLead?.lead_whatsapp_number}
        contactEmail={about.contact_email}
        title={about.cta_title}
      />
    </>
  );
}
