export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";
export type FontStyle = "normal" | "italic";
export type BackgroundType = "image" | "video";

export interface HeroData {
  id: string;
  headline: string;
  subtitle: string;
  cta_text: string;
  cta_url: string;

  background_type?: BackgroundType;
  background_image_url?: string | null;
  /** Mobile-only background image (≤md breakpoint). When set,
      replaces the desktop video/image on small viewports; when
      null, the desktop bg is used on every screen size. */
  background_image_url_mobile?: string | null;
  video_urls: string[];
  poster_url: string;

  headline_color?: string;
  headline_font_size_px?: number;
  headline_font_weight?: number;
  headline_font_style?: FontStyle;
  headline_text_transform?: TextTransform;
  headline_letter_spacing_em?: number;

  subtitle_color?: string;
  subtitle_font_size_px?: number;
  subtitle_font_weight?: number;
  subtitle_font_style?: FontStyle;
  subtitle_text_transform?: TextTransform;

  is_active: boolean;

  lead_whatsapp_number?: string;
  lead_email?: string;

  // Optional landscape image rendered as the Portfolio section
  // header on the public site (replaces the plain "Portfolio"
  // text). Filter tabs sit below the image.
  portfolio_header_image_url?: string | null;

  // Logo rendered in the navbar across every public-site page.
  // Falls back to /logo.png when null.
  logo_url?: string | null;

  // Per-route navbar visibility toggles. When `true`, the matching
  // link is hidden from the public Navbar's link list. Admin can
  // flip these without removing the underlying page/route.
  nav_home_hidden?: boolean | null;
  nav_about_hidden?: boolean | null;
  nav_news_hidden?: boolean | null;

  // Section-level toggle for the Abroad Production block on the
  // public home page. When `true`, the section is skipped and
  // ServicesSpotlight moves up to fill the space.
  abroad_section_hidden?: boolean | null;
}

export interface PortfolioItem {
  id: string;
  title: string;
  /** Legacy single-category column. Kept in sync with categories[0]
   *  so older readers (and any row that hasn't been migrated yet)
   *  still resolve to a sensible value. */
  category: string;
  /** Multi-category array. A portfolio item can live under more
   *  than one filter tab on the public site. When null/empty/missing
   *  on legacy rows, callers should fall back to [category]. */
  categories?: string[] | null;
  tag: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  aspect_ratio: string;
  is_published: boolean;
  sort_order: number;
}

export interface Collaboration {
  id: string;
  brand_name: string;
  logo_svg: string;
  tint_color: string;
  is_published: boolean;
  sort_order: number;
}

export interface Service {
  id: string;
  name: string;
  is_published: boolean;
  sort_order: number;

  // Optional spotlight fields — when populated, the service is
  // rendered as a detailed row in the Services Spotlight section
  // (text on one side, media on the other). When empty, the
  // service still appears as a pill in the hero / nav.
  description?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  learn_more_text?: string | null;
  learn_more_url?: string | null;
  media_url?: string | null;
  media_type?: "image" | "video" | null;
}

export interface SocialLink {
  id: string;
  platform: string;
  handle: string;
  url: string;
  is_published: boolean;
}

/**
 * One destination inside an abroad-production trip — a stop the
 * production crew will visit during that trip. Rendered as a card
 * in the "Destinations We'll Visit" gallery on the detail page.
 */
export interface TripLocation {
  name: string;
  image_url: string;
  description?: string | null;
}

/**
 * One row of the universal Abroad-Production services list (e.g.
 * "Video Production", "Photography"). Rendered inside the
 * "Services We Offer" section on every /abroad-production/[slug]
 * detail page — the sticker-deck on the left uses `title` and
 * `description`, the right preview panel plays `preview_url` when
 * `preview_type` is `"video"` or shows it as an image otherwise.
 */
export interface AbroadService {
  id: string;
  sort_order: number;
  title: string;
  description?: string | null;
  preview_url?: string | null;
  preview_type: "video" | "image";
  /** Optional accent override for the preview panel's radial wash.
   *  Null falls back to the brand Bentala blue. */
  accent_color?: string | null;
  /** Optional sticker-card background override. Null falls back to
   *  a deterministic Bentala-blue tint keyed off sort_order. */
  card_bg_color?: string | null;
  is_published: boolean;
}

/**
 * Upcoming on-location shoot the studio is offering bookings for.
 * Rendered as a banner slide on the public home page; clicking a
 * slide routes to /abroad-production/[slug] for the trip's detail
 * page, which uses `title` + `description` for editorial copy and
 * pulls the studio's international portfolio in beneath it.
 */
export interface AbroadProductionTrip {
  id: string;
  image_url: string;
  country: string;
  departure_date: string; // ISO date (YYYY-MM-DD)
  /** Optional ISO date for the return trip. When set the detail page
   *  renders a date range (e.g. "12 – 15 Jun 2026"); when null only
   *  the departure date is shown. */
  return_date?: string | null;
  note?: string | null;
  service_link_url: string;
  sort_order: number;
  is_published: boolean;
  /** Long-form headline rendered on the detail page. When empty the
   *  detail page falls back to `country`. */
  title?: string | null;
  /** Body copy rendered under the headline on the detail page. */
  description?: string | null;
  /** URL-safe identifier used in /abroad-production/[slug]. Generated
   *  automatically from `country` if the admin leaves it blank. */
  slug?: string | null;
  /** Secondary image rendered in the side-by-side block on the
   *  detail page (under the hero banner). Falls back to
   *  `image_url` when null so the layout still pairs an image with
   *  the description. */
  secondary_image_url?: string | null;
  /** Destinations to visit during the trip — gallery cards rendered
   *  on the detail page. Stored as JSONB; null/empty hides the
   *  section entirely. */
  locations?: TripLocation[] | null;
  /** Terms & conditions copy (Syarat & Ketentuan). Free-form text;
   *  line breaks are preserved on the public site. Null/empty hides
   *  the T&C section. */
  terms_conditions?: string | null;
}

export type AboutHeroImagePosition =
  | "top-left"
  | "top-right"
  | "mid-left"
  | "mid-right"
  | "bottom-left"
  | "bottom-right";

export interface AboutData {
  id: string;
  story_title: string;
  story_body: string;
  story_cta_url: string;
  /** Editorial copy for the "Our Story" section (above the entity
   *  cards). Renderer supports a tiny markdown subset:
   *    `**word**` — cyan accent (heading) / bold white (paragraph)
   *    `*word*`   — italic-serif accent (heading)
   *    `\n`       — line break (heading)
   *  When null/empty, the public site falls back to bundled copy. */
  story_eyebrow?: string | null;
  story_heading?: string | null;
  story_paragraph?: string | null;
  /** Optional 16:9 cinematic video rendered full-bleed between
   *  the caption paragraph and the entity cards. When null, the
   *  section flows straight from caption to entity cards. */
  story_video_url?: string | null;
  /** Optional decorative image overlay in the editorial hero.
   *  When null, hero renders text-only. */
  hero_overlay_image_url?: string | null;
  hero_overlay_position?: AboutHeroImagePosition | null;
  /** Logos rendered on the two "entity" cards (Bentala Project &
   *  Bentala Studio) in the About story section. When null, the
   *  public site falls back to bundled assets in /public. */
  entity_1_logo_url?: string | null;
  entity_2_logo_url?: string | null;
  /** Body copy on each entity card. When null/empty, the public
   *  site falls back to the bundled default sentence. */
  entity_1_desc?: string | null;
  entity_2_desc?: string | null;
  vision_text: string;
  mission_text: string;
  edge_text: string;
  /** Admin-editable contact email rendered in the CTA band at
   *  the bottom of the public About page. Clicking it opens
   *  Gmail's compose view with this address pre-filled. */
  contact_email?: string | null;
  /** Admin-editable CSS line-height (unitless multiplier) for
   *  each philosophy description paragraph. Lets editors tune how
   *  tight or airy each block of copy reads without changing the
   *  surrounding layout. Defaults to 1.55. */
  vision_text_line_height?: number | null;
  mission_text_line_height?: number | null;
  edge_text_line_height?: number | null;
  /** Optional image rendered in place of the giant numeral on each
   *  philosophy row. When null, the public site falls back to the
   *  oversized "01 / 02 / 03" numeral. */
  vision_image_url?: string | null;
  mission_image_url?: string | null;
  edge_image_url?: string | null;
  /** Editorial photo strip rendered between the "Born in Indonesia"
   *  hero and the rest of the About story. Editors upload an
   *  ordered list of image URLs; public lays them out in a tidy
   *  responsive grid. */
  hero_grid_image_urls?: string[] | null;
  /** Optional full-bleed banner image for the About hero. When
   *  set, replaces the text headline + description in the pinned
   *  hero. When null, the text hero renders as before. */
  hero_banner_image_url?: string | null;
  /** Optional mobile-specific hero banner. Shown on phone-width
   *  viewports where the wide desktop banner would crop. Falls back
   *  to hero_banner_image_url when null. */
  hero_banner_image_url_mobile?: string | null;
  stats: { num: string; label: string }[];
  values: { name: string; desc: string; icon: string }[];
  /** Heading above the Six Principles grid. Supports the same
   *  markdown subset as `story_heading`: `*word*` italic-serif
   *  blue, `**word**` outline-stroke blue, `\n` line break. */
  principles_title?: string | null;
  /** Oversized headline inside the closing CTA band. Same
   *  markdown subset as `principles_title`. */
  cta_title?: string | null;
}

export type TeamGalleryRatio = "16:9" | "9:16" | "4:5";

export interface TeamGalleryPhoto {
  id: string;
  image_url: string;
  caption: string;
  alt_text: string;
  sort_order: number;
  is_published: boolean;
  /** Crop ratio the public site renders this photo at — one of
   *  three fixed shapes chosen by the editor. */
  display_ratio?: TeamGalleryRatio | null;
  /** Focal point + zoom set by the admin to control which part
   *  of the photo stays visible inside the chosen ratio frame. */
  focal_x?: number | null;
  focal_y?: number | null;
  zoom?: number | null;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  role_description: string;
  initials: string;
  avatar_color: string;
  tags: string[];
  is_published: boolean;
  sort_order: number;
}

export interface NewsPost {
  id: string;
  account: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  caption: string;
  permalink: string;
  like_count: number;
  comments_count: number;
  posted_at: string;
  is_published: boolean;
  sort_order: number;
}

export interface SeoData {
  id: string;
  page: string;
  meta_title: string;
  meta_description: string;
  og_image_url: string | null;
}
