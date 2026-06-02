import { notFound } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AbroadProductionTrip,
  AbroadService,
  HeroData,
  PortfolioItem,
  Service,
} from "@/lib/types";
import TripDetailIntro from "@/components/abroad/TripDetailIntro";
import TripDestinationsGallery from "@/components/abroad/TripDestinationsGallery";
import TripAbroadServices from "@/components/abroad/TripAbroadServices";
import TripTermsConditions from "@/components/abroad/TripTermsConditions";
import PortfolioMasonry from "@/components/home/PortfolioMasonry";

export const revalidate = 30;

interface PageProps {
  params: { slug: string };
}

interface DetailData {
  trip: AbroadProductionTrip | null;
  services: Service[];
  /** Abroad-production specific services (Video Production / Photography
   *  / Event Activation / Social Content by default). Drives the
   *  sticker-deck + preview panel inside the "Services We Offer"
   *  section. Falls back to a hard-coded default set inside
   *  `TripAbroadServices` when the table is empty. */
  abroadServices: AbroadService[];
  /** Universal T&C intro paragraph from `bsi_abroad_settings`. */
  termsDescription: string | null;
  /** Universal structured T&C clauses { title, body } from
   *  `bsi_abroad_settings`. When empty, the renderer falls back to
   *  parsing the legacy `termsConditions` free-form text. */
  termsItems: { title: string; body: string }[];
  /** Legacy free-form universal T&C text. Used as a fallback source
   *  when `termsItems` is empty so old data keeps rendering. */
  termsConditions: string | null;
  internationalPortfolio: PortfolioItem[];
  hero: HeroData | null;
  /** Bentala Studio brand mark URL — same logo the About page renders
   *  for the studio entity card. Fetched from `bsi_about.entity_2_logo_url`
   *  so swapping the brand asset in admin updates everywhere at once.
   *  Falls back to the bundled `/logo-studio-tight.png` when unset. */
  studioLogoUrl: string | null;
}

/**
 * Resolve everything the abroad-production detail page needs in a single
 * Supabase round-trip. Returns `null` for `trip` when the slug doesn't
 * map to a published row — the page will surface a 404 from there.
 */
async function getDetailData(slug: string): Promise<DetailData> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      trip: null,
      services: [],
      abroadServices: [],
      termsDescription: null,
      termsItems: [],
      termsConditions: null,
      internationalPortfolio: [],
      hero: null,
      studioLogoUrl: null,
    };
  }
  try {
    // Resolve the trip by slug first. Legacy rows that pre-date the
    // slug column (or rows where the admin saved a blank slug) match
    // on a country-derived slug pattern using ILIKE so the URL still
    // routes correctly without forcing a manual re-save.
    const slugLikeCountry = slug.replace(/-/g, " ");
    const [
      tripRes,
      servicesRes,
      portfolioRes,
      heroRes,
      aboutRes,
      abroadServicesRes,
      abroadSettingsRes,
    ] = await Promise.all([
      supabase
        .from("bsi_abroad_production")
        .select("*")
        .eq("is_published", true)
        .or(`slug.eq.${slug},country.ilike.${slugLikeCountry}`)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bsi_services")
        .select("*")
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("bsi_portfolio")
        .select("*")
        .eq("is_published", true)
        // International items only — filter via the legacy single-
        // category column AND the multi-category array so rows on
        // either schema are picked up.
        .or("category.eq.intl,categories.cs.{intl}")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("bsi_hero")
        .select("lead_whatsapp_number, lead_email, logo_url")
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("bsi_about")
        .select("entity_2_logo_url")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("bsi_abroad_services")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("bsi_abroad_settings")
        .select("terms_conditions, terms_description, terms_items")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    const trip = (tripRes.data as AbroadProductionTrip | null) ?? null;
    const settings = abroadSettingsRes.data as {
      terms_conditions: string | null;
      terms_description: string | null;
      terms_items: { title: string; body: string }[] | null;
    } | null;
    const universalTerms = settings?.terms_conditions ?? null;
    // Universal T&C text takes priority. If the admin hasn't set it
    // yet we fall back to the trip's legacy per-row column so
    // existing data keeps rendering until migration.
    const termsConditions =
      universalTerms ?? trip?.terms_conditions ?? null;

    return {
      trip,
      services: (servicesRes.data as Service[]) ?? [],
      abroadServices: (abroadServicesRes.data as AbroadService[]) ?? [],
      termsDescription: settings?.terms_description ?? null,
      termsItems: Array.isArray(settings?.terms_items)
        ? settings!.terms_items
        : [],
      termsConditions,
      internationalPortfolio:
        (portfolioRes.data as PortfolioItem[]) ?? [],
      hero: (heroRes.data as HeroData | null) ?? null,
      studioLogoUrl:
        (aboutRes.data as { entity_2_logo_url: string | null } | null)
          ?.entity_2_logo_url ?? null,
    };
  } catch (err) {
    console.error(
      "[abroad-production/[slug]] Failed to fetch Supabase data:",
      err,
    );
    return {
      trip: null,
      services: [],
      abroadServices: [],
      termsDescription: null,
      termsItems: [],
      termsConditions: null,
      internationalPortfolio: [],
      hero: null,
      studioLogoUrl: null,
    };
  }
}

export default async function AbroadProductionDetailPage({
  params,
}: PageProps) {
  const {
    trip,
    services,
    abroadServices,
    termsDescription,
    termsItems,
    termsConditions,
    internationalPortfolio,
    hero,
    studioLogoUrl,
  } = await getDetailData(params.slug);

  if (!trip) {
    notFound();
  }

  return (
    <main className="bg-bg">
      {/* Intro — two-column block, first thing visitors see under the
          navbar (the hero banner now lives only on the home page).
          Secondary image on the left, copy (logo + headlines +
          description + CTA) on the right. Falls back to the main image
          when the admin hasn't uploaded a secondary one. */}
      <TripDetailIntro
        trip={trip}
        services={services}
        abroadServices={abroadServices}
        leadWhatsappNumber={hero?.lead_whatsapp_number}
        studioLogoUrl={studioLogoUrl}
      />

      {/* Destinations gallery — only rendered when the trip has at
          least one location attached. Cards stagger in on scroll. */}
      {Array.isArray(trip.locations) && trip.locations.length > 0 && (
        <TripDestinationsGallery locations={trip.locations} />
      )}

      {/* Services offered for abroad production — full-viewport
          section. Sticker-deck of service categories on the left,
          dark landscape preview panel on the right. Pulls services
          from Supabase; falls back to a hard-coded default set when
          the table is empty. */}
      <TripAbroadServices services={abroadServices} />

      {/* Terms & Conditions — universal structured data from
          `bsi_abroad_settings` (description + items). Falls back to
          parsing the legacy free-form `termsConditions` text inside
          the component when `termsItems` is empty. Skipped entirely
          only when ALL three sources are empty. */}
      {(termsItems.length > 0 || termsConditions) && (
        <TripTermsConditions
          description={termsDescription}
          items={termsItems}
          legacyText={termsConditions}
        />
      )}

      {/* International portfolio — reuses the home masonry but pinned
          to the "intl" category with the filter pills hidden so it
          reads as a curated showcase of related production work.
          Padding + heading rhythm matches the other secondary
          sections (Destinations / Services / T&C) so the page reads
          as one consistent editorial spread. */}
      {internationalPortfolio.length > 0 && (
        <section className="pt-24 md:pt-36 pb-24 md:pb-36 bg-bg">
          <div className="px-5 md:px-[52px] mb-10 md:mb-14 flex flex-col items-center text-center">
            <h2
              className="font-sans uppercase font-bold text-white leading-[0.98] tracking-[-0.02em]"
              style={{ fontSize: "clamp(32px, 4.4vw, 56px)" }}
            >
              International Production
            </h2>
          </div>
          <PortfolioMasonry
            items={internationalPortfolio}
            lockedFilter="intl"
            hideHeader
          />
        </section>
      )}
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  if (!isSupabaseConfigured || !supabase) return { title: "Abroad Production" };
  const { data } = await supabase
    .from("bsi_abroad_production")
    .select("country, description")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return { title: "Abroad Production" };
  // Headline = country (the admin's only identity field for a trip).
  // The legacy `title` column on the row is ignored — kept in the DB
  // for historical data but no longer used for rendering or SEO.
  const headline = data.country as string;
  return {
    title: `${headline} — Abroad Production · Bentala Studio`,
    description:
      (data.description as string | null)?.trim() ||
      `Join Bentala Studio's on-location content production in ${data.country}.`,
  };
}
