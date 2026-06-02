import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  HeroData,
  Service,
  SocialLink,
  Collaboration,
  PortfolioItem,
  AbroadProductionTrip,
} from "@/lib/types";
import HomeIntro from "@/components/home/HomeIntro";
import CollabScroll from "@/components/home/CollabScroll";
import PortfolioMasonry from "@/components/home/PortfolioMasonry";
import ServicesSpotlight from "@/components/home/ServicesSpotlight";
import AbroadProduction from "@/components/home/AbroadProduction";
import RevealOnScroll from "@/components/shared/RevealOnScroll";

export const revalidate = 30;

const fallbackHero: HeroData = {
  id: "1",
  headline: 'CREATE <span style="color:#0B3DE7">STORIES</span><br>BEYOND BORDERS',
  subtitle: "Indonesia's creative agency producing cinematic content from around the world. Bold vision. Global execution.",
  cta_text: "Start Collaboration",
  cta_url: "https://wa.me/6281284731599?text=Hi%20Bentala%20Studio!%20Let's%20collaborate!",
  background_type: "video",
  background_image_url: null,
  background_image_url_mobile: null,
  video_urls: [
    "https://videos.pexels.com/video-files/6774849/6774849-hd_1920_1080_25fps.mp4",
    "https://videos.pexels.com/video-files/5985975/5985975-hd_1920_1080_25fps.mp4",
  ],
  poster_url: "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=1920",
  headline_color: "#ffffff",
  headline_font_size_px: 115,
  headline_font_weight: 700,
  headline_font_style: "normal",
  headline_text_transform: "uppercase",
  headline_letter_spacing_em: -0.01,
  subtitle_color: "rgba(240,244,255,0.92)",
  subtitle_font_size_px: 18,
  subtitle_font_weight: 400,
  subtitle_font_style: "normal",
  subtitle_text_transform: "none",
  is_active: true,
};

const fallbackServices: Service[] = [
  {
    id: "1",
    name: "Video Production",
    is_published: true,
    sort_order: 1,
    description:
      "From concept to final cut — we craft cinematic films, brand stories, and TVC content that move audiences and drive results across screens of every size.",
    cta_text: "Start Collaboration",
    cta_url: "https://wa.me/6281284731599?text=Hi!%20Interested%20in%20Video%20Production",
    learn_more_text: "Our reels",
    learn_more_url: "#portfolio",
    media_url: "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=1200",
    media_type: "image",
  },
  {
    id: "2",
    name: "Social Media",
    is_published: true,
    sort_order: 2,
    description:
      "Strategy, content, and community — full-stack social that builds loyal audiences and turns followers into customers across Instagram, TikTok, and beyond.",
    cta_text: "Start Collaboration",
    cta_url: "https://wa.me/6281284731599?text=Hi!%20Interested%20in%20Social%20Media",
    learn_more_text: "Recent campaigns",
    learn_more_url: "#portfolio",
    media_url: "https://images.pexels.com/photos/3584913/pexels-photo-3584913.jpeg?auto=compress&cs=tinysrgb&w=1200",
    media_type: "image",
  },
  {
    id: "3",
    name: "International Content",
    is_published: true,
    sort_order: 3,
    description:
      "Cross-border production with local know-how — Indonesian craft applied to global stories, shipped from Jakarta to wherever the brief takes us.",
    cta_text: "Start Collaboration",
    cta_url: "https://wa.me/6281284731599?text=Hi!%20Interested%20in%20International%20Content",
    learn_more_text: "Global work",
    learn_more_url: "#portfolio",
    media_url: "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=1200",
    media_type: "image",
  },
  { id: "4", name: "KOL Campaign", is_published: true, sort_order: 4 },
  { id: "5", name: "Brand Design", is_published: true, sort_order: 5 },
  { id: "6", name: "Advertising", is_published: true, sort_order: 6 },
];

const fallbackSocials: SocialLink[] = [
  { id: "1", platform: "ig", handle: "@bentalastudioindonesia", url: "https://instagram.com/bentalastudioindonesia", is_published: true },
  { id: "2", platform: "ig", handle: "@bentalaprojectindonesia", url: "https://instagram.com/bentalaprojectindonesia", is_published: true },
  { id: "3", platform: "tiktok", handle: "@bentalaprojectindonesia", url: "https://tiktok.com/@bentalaprojectindonesia", is_published: true },
  { id: "4", platform: "whatsapp", handle: "+62 812-8473-1599", url: "https://wa.me/6281284731599", is_published: true },
];

const fallbackCollabs: Collaboration[] = [
  { id: "1",  brand_name: "Gojek",        logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#00AD4F"/><circle cx="28" cy="28" r="14" fill="white"/><circle cx="28" cy="28" r="7" fill="#00AD4F"/></svg>',                                                                                                                   tint_color: "#00AD4F", is_published: true, sort_order: 1 },
  { id: "2",  brand_name: "Netflix",      logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" fill="#141414"/><text x="8" y="46" font-family="Georgia,serif" font-size="48" font-weight="900" fill="#E50914">N</text></svg>',                                                                                                          tint_color: "#E50914", is_published: true, sort_order: 2 },
  { id: "3",  brand_name: "Spotify",      logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="24" fill="#1ED760"/><path d="M18 22c5-2 12-2 17 1M17 28c6-2 14-1 18 2M18 34c5-1 11-1 15 2" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>',                                                                tint_color: "#1ED760", is_published: true, sort_order: 3 },
  { id: "4",  brand_name: "Google",       logo_svg: '<svg viewBox="0 0 56 56"><text x="6" y="42" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#4285F4">G</text></svg>',                                                                                                                                                   tint_color: "#4285F4", is_published: true, sort_order: 4 },
  { id: "5",  brand_name: "Tokopedia",    logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#42B549"/><circle cx="28" cy="22" r="8" fill="white"/><rect x="16" y="32" width="24" height="12" rx="6" fill="white"/></svg>',                                                                                                  tint_color: "#42B549", is_published: true, sort_order: 5 },
  { id: "6",  brand_name: "Shopee",       logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#EE4D2D"/><path d="M20 22 Q28 14 36 22 L38 36 H18 Z" fill="white"/><circle cx="23" cy="36" r="2" fill="#EE4D2D"/><circle cx="33" cy="36" r="2" fill="#EE4D2D"/></svg>',                                                        tint_color: "#EE4D2D", is_published: true, sort_order: 6 },
  { id: "7",  brand_name: "Grab",         logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#00B14F"/><text x="9" y="37" font-family="Arial,sans-serif" font-size="20" font-weight="900" fill="white">grab</text></svg>',                                                                                                   tint_color: "#00B14F", is_published: true, sort_order: 7 },
  { id: "8",  brand_name: "Samsung",      logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="6" fill="#1428A0"/><text x="5" y="34" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="white">SAMSUNG</text></svg>',                                                                                           tint_color: "#1428A0", is_published: true, sort_order: 8 },
  { id: "9",  brand_name: "Nike",         logo_svg: '<svg viewBox="0 0 56 56"><path d="M7 35 C16 18 36 12 50 21 L24 35 Z" fill="white"/></svg>',                                                                                                                                                                                                   tint_color: "#ffffff", is_published: true, sort_order: 9 },
  { id: "10", brand_name: "Traveloka",    logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#0064D2"/><path d="M18 34 L28 16 L38 34" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="28" cy="37" r="3" fill="white"/></svg>',                                      tint_color: "#0064D2", is_published: true, sort_order: 10 },
  { id: "11", brand_name: "Apple",        logo_svg: '<svg viewBox="0 0 56 56"><path d="M34 10c-1 3-4 5-7 5-2 0-5-2-5-5 2 0 5-2 6-4 2 2 5 3 6 4zm-6 6c-6 0-10 6-10 12 0 8 5 16 10 17 2-1 3-1 5-1s3 0 5 1c5-1 10-9 10-17 0-6-4-12-10-12-1 0-3 1-5 1s-4-1-5-1z" fill="white"/></svg>',                                                         tint_color: "#ffffff", is_published: true, sort_order: 11 },
  { id: "12", brand_name: "Adidas",       logo_svg: '<svg viewBox="0 0 56 56"><path d="M10 42 L28 10 L46 42 Z" fill="none" stroke="white" stroke-width="3.5" stroke-linejoin="round"/><line x1="16" y1="42" x2="40" y2="42" stroke="white" stroke-width="3.5" stroke-linecap="round"/></svg>',                                                   tint_color: "#ffffff", is_published: true, sort_order: 12 },
  { id: "13", brand_name: "Bukalapak",    logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#E31E24"/><text x="9" y="36" font-family="Arial,sans-serif" font-size="11" font-weight="900" fill="white">BUKA</text></svg>',                                                                                                   tint_color: "#E31E24", is_published: true, sort_order: 13 },
  { id: "14", brand_name: "Telkom",       logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#CC0000"/><text x="8" y="35" font-family="Arial,sans-serif" font-size="11" font-weight="900" fill="white">TELKOM</text></svg>',                                                                                                 tint_color: "#CC0000", is_published: true, sort_order: 14 },
  { id: "15", brand_name: "BRI",          logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="8" fill="#003D7C"/><text x="12" y="36" font-family="Arial,sans-serif" font-size="20" font-weight="900" fill="white">BRI</text></svg>',                                                                                              tint_color: "#003D7C", is_published: true, sort_order: 15 },
  { id: "16", brand_name: "Mandiri",      logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="4" fill="#003087"/><rect x="6" y="22" width="44" height="12" rx="2" fill="#F7B500"/></svg>',                                                                                                                                        tint_color: "#F7B500", is_published: true, sort_order: 16 },
  { id: "17", brand_name: "Pertamina",    logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#009345"/><path d="M20 20 L36 20 L36 28 L28 36 L20 28 Z" fill="#E31E24"/></svg>',                                                                                                                                               tint_color: "#009345", is_published: true, sort_order: 17 },
  { id: "18", brand_name: "Unilever",     logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#1F36C7"/><text x="10" y="35" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="white">Unilever</text></svg>',                                                                                              tint_color: "#1F36C7", is_published: true, sort_order: 18 },
  { id: "19", brand_name: "Xiaomi",       logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="12" fill="#FF6900"/><text x="8" y="38" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="white">mi</text></svg>',                                                                                               tint_color: "#FF6900", is_published: true, sort_order: 19 },
  { id: "20", brand_name: "TikTok",       logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="12" fill="#010101"/><path d="M36 14c1 5 5 8 9 8v7c-4 0-7-1-9-3v14c0 7-6 13-13 13-7 0-13-6-13-13 0-7 6-12 13-12v8c-3 0-5 2-5 5 0 3 2 5 5 5 3 0 5-2 5-5V14h8z" fill="white"/></svg>',                                             tint_color: "#EE1D52", is_published: true, sort_order: 20 },
  { id: "21", brand_name: "YouTube",      logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="10" fill="#FF0000"/><polygon points="22,18 22,38 40,28" fill="white"/></svg>',                                                                                                                                                      tint_color: "#FF0000", is_published: true, sort_order: 21 },
  { id: "22", brand_name: "Meta",         logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="8" fill="#0866FF"/><path d="M10 30c0-4 3-8 8-8 3 0 5 1 7 4 2-3 4-4 7-4 5 0 8 4 8 8 0 6-4 14-8 14-2 0-4-1-7-5-3 4-5 5-7 5-4 0-8-8-8-14z" fill="white"/></svg>',                                                                  tint_color: "#0866FF", is_published: true, sort_order: 22 },
  { id: "23", brand_name: "Lazada",       logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="8" fill="#0F146B"/><text x="7" y="36" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="white">LAZADA</text></svg>',                                                                                            tint_color: "#0F146B", is_published: true, sort_order: 23 },
  { id: "24", brand_name: "Blibli",       logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="8" fill="#0082CA"/><text x="10" y="36" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="white">blibli</text></svg>',                                                                                           tint_color: "#0082CA", is_published: true, sort_order: 24 },
  { id: "25", brand_name: "Indosat",      logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#ED1C24"/><text x="10" y="35" font-family="Arial,sans-serif" font-size="10" font-weight="900" fill="white">INDOSAT</text></svg>',                                                                                               tint_color: "#ED1C24", is_published: true, sort_order: 25 },
  { id: "26", brand_name: "Garuda",       logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#003087"/><path d="M28 14 L32 24 L44 24 L34 30 L38 42 L28 36 L18 42 L22 30 L12 24 L24 24 Z" fill="#F4C300"/></svg>',                                                                                                           tint_color: "#F4C300", is_published: true, sort_order: 26 },
  { id: "27", brand_name: "Indomie",      logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="6" fill="#C8102E"/><text x="4" y="36" font-family="Arial,sans-serif" font-size="11" font-weight="900" fill="white">INDOMIE</text></svg>',                                                                                           tint_color: "#C8102E", is_published: true, sort_order: 27 },
  { id: "28", brand_name: "Puma",         logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" fill="#1a1a1a"/><path d="M12 40 Q20 10 44 16 L36 32 Q28 28 12 40Z" fill="white"/></svg>',                                                                                                                                               tint_color: "#ffffff", is_published: true, sort_order: 28 },
  { id: "29", brand_name: "Honda",        logo_svg: '<svg viewBox="0 0 56 56"><rect width="56" height="56" rx="6" fill="#CC0000"/><text x="10" y="37" font-family="Arial,sans-serif" font-size="24" font-weight="900" fill="white" font-style="italic">H</text></svg>',                                                                            tint_color: "#CC0000", is_published: true, sort_order: 29 },
  { id: "30", brand_name: "Danone",       logo_svg: '<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="#0066B2"/><circle cx="28" cy="18" r="8" fill="white"/><path d="M20 26 Q28 44 36 26" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',                                                               tint_color: "#0066B2", is_published: true, sort_order: 30 },
];

const fallbackPortfolio: PortfolioItem[] = [
  { id: "1",   title: "Cinematic Brand Film",         category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 1 },
  { id: "2",   title: "Instagram Reels Series",       category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3584913/pexels-photo-3584913.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 2 },
  { id: "3",   title: "Visual Identity System",       category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 3 },
  { id: "4",   title: "Overseas Campaign — Europe",   category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 4 },
  { id: "5",   title: "Fashion Shoot — Paris",        category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 5 },
  { id: "6",   title: "Packaging Design",             category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 6 },
  { id: "7",   title: "Product Launch Video",         category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 7 },
  { id: "8",   title: "TikTok Content Series",        category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/4255400/pexels-photo-4255400.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 8 },
  { id: "9",   title: "Brand Motion Graphics",        category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/2510428/pexels-photo-2510428.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 9 },
  { id: "10",  title: "Logo & Brand System",          category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/6985192/pexels-photo-6985192.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 10 },
  { id: "11",  title: "Campaign — Japan",             category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 11 },
  { id: "12",  title: "Social Media Campaign",        category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3471423/pexels-photo-3471423.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 12 },
  { id: "13",  title: "Corporate Video — Jakarta",    category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 13 },
  { id: "14",  title: "KOL Campaign — Beauty",        category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 14 },
  { id: "15",  title: "Typography & Print",           category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 15 },
  { id: "16",  title: "Content Shoot — Dubai",        category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 16 },
  { id: "17",  title: "Lifestyle Content Series",     category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 17 },
  { id: "18",  title: "Ad Film — F&B Brand",          category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 18 },
  { id: "19",  title: "Brand Color System",           category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 19 },
  { id: "20",  title: "Shoot — South Korea",          category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/237211/pexels-photo-237211.jpeg?auto=compress&cs=tinysrgb&w=600",   media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 20 },
  { id: "21",  title: "Reel — Tech Startup",          category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 21 },
  { id: "22",  title: "Event Recap Film",             category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 22 },
  { id: "23",  title: "Campaign — Australia",         category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1878293/pexels-photo-1878293.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 23 },
  { id: "24",  title: "UI/UX Brand App Design",       category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",   media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 24 },
  { id: "25",  title: "KOL — Fashion Week",           category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=600",   media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 25 },
  { id: "26",  title: "Travel Film — Bali",           category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 26 },
  { id: "27",  title: "Shoot — New York",             category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/2190283/pexels-photo-2190283.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 27 },
  { id: "28",  title: "Brand Stationery Set",         category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/6373305/pexels-photo-6373305.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 28 },
  { id: "29",  title: "Short Film — Lombok",          category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 29 },
  { id: "30",  title: "Beauty KOL Content",           category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 30 },
  { id: "31",  title: "Brand Poster Series",          category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 31 },
  { id: "32",  title: "Campaign — Singapore",         category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 32 },
  { id: "33",  title: "Street Style Reel",            category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/2220316/pexels-photo-2220316.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 33 },
  { id: "34",  title: "Documentary Short",            category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3062541/pexels-photo-3062541.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 34 },
  { id: "35",  title: "Icon & Illustration Set",      category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 35 },
  { id: "36",  title: "Shoot — Amsterdam",            category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1796736/pexels-photo-1796736.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 36 },
  { id: "37",  title: "Skincare Brand Reel",          category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 37 },
  { id: "38",  title: "Testimonial Campaign Film",    category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 38 },
  { id: "39",  title: "Annual Report Design",         category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=800",   media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 39 },
  { id: "40",  title: "Campaign — London",            category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800",   media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 40 },
  { id: "41",  title: "Food Content Series",          category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 41 },
  { id: "42",  title: "Product Teaser Film",          category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3819969/pexels-photo-3819969.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 42 },
  { id: "43",  title: "Brand Guideline Book",         category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/6373294/pexels-photo-6373294.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 43 },
  { id: "44",  title: "Shoot — Kuala Lumpur",         category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/2549453/pexels-photo-2549453.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 44 },
  { id: "45",  title: "Behind The Scenes Reel",       category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3379934/pexels-photo-3379934.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 45 },
  { id: "46",  title: "Outdoor Ad Film",              category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 46 },
  { id: "47",  title: "Product Catalog Design",       category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 47 },
  { id: "48",  title: "Campaign — Bangkok",           category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1031698/pexels-photo-1031698.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 48 },
  { id: "49",  title: "Creator Collab Reel",          category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 49 },
  { id: "50",  title: "Mini-Doc — Artisans",          category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 50 },
  { id: "51",  title: "Social Ads Pack",              category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/6633920/pexels-photo-6633920.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 51 },
  { id: "52",  title: "Campaign — Berlin",            category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/2570063/pexels-photo-2570063.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 52 },
  { id: "53",  title: "Fitness KOL Series",           category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 53 },
  { id: "54",  title: "Automotive Launch Film",       category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/3786091/pexels-photo-3786091.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 54 },
  { id: "55",  title: "Event Branding Kit",           category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/1093898/pexels-photo-1093898.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 55 },
  { id: "56",  title: "Shoot — Osaka",                category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3408353/pexels-photo-3408353.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 56 },
  { id: "57",  title: "Tech Brand Explainer",         category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 57 },
  { id: "58",  title: "Trend Campaign Reels",         category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 58 },
  { id: "59",  title: "Packaging & Label Design",     category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/5632398/pexels-photo-5632398.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 59 },
  { id: "60",  title: "Campaign — Istanbul",          category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3573382/pexels-photo-3573382.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 60 },
  { id: "61",  title: "Real Estate Brand Film",       category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 61 },
  { id: "62",  title: "Micro-Content Pack",           category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 62 },
  { id: "63",  title: "Magazine Layout Design",       category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/3944405/pexels-photo-3944405.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 63 },
  { id: "64",  title: "Shoot — Hong Kong",            category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 64 },
  { id: "65",  title: "Ramadan Campaign Film",        category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/3581364/pexels-photo-3581364.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 65 },
  { id: "66",  title: "Outfit of the Day Series",     category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/2220352/pexels-photo-2220352.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 66 },
  { id: "67",  title: "Digital Billboard Design",     category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 67 },
  { id: "68",  title: "Campaign — Sydney",            category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1619854/pexels-photo-1619854.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 68 },
  { id: "69",  title: "Narrative Brand Film",         category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 69 },
  { id: "70",  title: "Community Reel",               category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3184431/pexels-photo-3184431.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 70 },
  { id: "71",  title: "Brand Tagline Design",         category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/6214476/pexels-photo-6214476.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 71 },
  { id: "72",  title: "Shoot — Riyadh",               category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3989948/pexels-photo-3989948.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 72 },
  { id: "73",  title: "Web Series Episode 1",         category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/2873282/pexels-photo-2873282.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 73 },
  { id: "74",  title: "Brand Challenge Reel",         category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3808057/pexels-photo-3808057.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 74 },
  { id: "75",  title: "Campaign Collateral Set",      category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 75 },
  { id: "76",  title: "Shoot — Vancouver",            category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 76 },
  { id: "77",  title: "Brand Anthem Film",            category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/1209978/pexels-photo-1209978.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 77 },
  { id: "78",  title: "Testimonial Short",            category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/3760809/pexels-photo-3760809.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 78 },
  { id: "79",  title: "Minimal Brand Identity",       category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/6373298/pexels-photo-6373298.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 79 },
  { id: "80",  title: "Campaign — Cape Town",         category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1430672/pexels-photo-1430672.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 80 },
  { id: "81",  title: "Aerial Cinematic Video",       category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/1438761/pexels-photo-1438761.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 81 },
  { id: "82",  title: "Trending Sounds Series",       category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 82 },
  { id: "83",  title: "Zine & Editorial Design",      category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/1005324/pexels-photo-1005324.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 83 },
  { id: "84",  title: "Shoot — Miami",                category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3225529/pexels-photo-3225529.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 84 },
  { id: "85",  title: "Startup Pitch Film",           category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 85 },
  { id: "86",  title: "Product Review Reel",          category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/3807533/pexels-photo-3807533.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 86 },
  { id: "87",  title: "3D Brand Render",              category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 87 },
  { id: "88",  title: "Campaign — Mumbai",            category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3044472/pexels-photo-3044472.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 88 },
  { id: "89",  title: "Year End Brand Film",          category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/3811082/pexels-photo-3811082.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 89 },
  { id: "90",  title: "Lifestyle Brand Reel",         category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3807571/pexels-photo-3807571.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 90 },
  { id: "91",  title: "Motion Brand Template",        category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/6214480/pexels-photo-6214480.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 91 },
  { id: "92",  title: "Shoot — Tokyo Street",         category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 92 },
  { id: "93",  title: "NGO Impact Film",              category: "video",  tag: "Video Production",  media_url: "https://images.pexels.com/photos/6591166/pexels-photo-6591166.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 93 },
  { id: "94",  title: "Viral Challenge Content",      category: "photo", tag: "Social Media",      media_url: "https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 94 },
  { id: "95",  title: "NFT Collection Design",        category: "design", tag: "Brand Design",      media_url: "https://images.pexels.com/photos/5483064/pexels-photo-5483064.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 95 },
  { id: "96",  title: "Campaign — Barcelona",         category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 96 },
  { id: "97",  title: "Hardsell Product Film",        category: "video",  tag: "Advertising",       media_url: "https://images.pexels.com/photos/3184455/pexels-photo-3184455.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 97 },
  { id: "98",  title: "Influencer Day-in-Life",       category: "photo", tag: "KOL Campaign",      media_url: "https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=600",  media_type: "image", thumbnail_url: null, aspect_ratio: "4:5",  is_published: true, sort_order: 98 },
  { id: "99",  title: "Rebrand Identity Launch",      category: "design", tag: "Brand Identity",    media_url: "https://images.pexels.com/photos/6373300/pexels-photo-6373300.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "1:1",  is_published: true, sort_order: 99 },
  { id: "100", title: "Global Story — Bentala",       category: "intl",   tag: "International",     media_url: "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800",  media_type: "image", thumbnail_url: null, aspect_ratio: "16:9", is_published: true, sort_order: 100 },
];

async function getData() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      hero: fallbackHero,
      services: fallbackServices,
      socialLinks: fallbackSocials,
      collabs: fallbackCollabs,
      portfolio: fallbackPortfolio,
      abroadTrips: [] as AbroadProductionTrip[],
    };
  }
  try {
    const [heroRes, servicesRes, socialsRes, collabsRes, portfolioRes, abroadRes] =
      await Promise.all([
        supabase.from("bsi_hero").select("*").eq("is_active", true).single(),
        supabase.from("bsi_services").select("*").eq("is_published", true).order("sort_order"),
        supabase.from("bsi_social_links").select("*").eq("is_published", true),
        supabase.from("bsi_collaborations").select("*").eq("is_published", true).order("sort_order"),
        supabase
          .from("bsi_portfolio")
          .select("*")
          .eq("is_published", true)
          // Newest items first. sort_order remains a tiebreaker so the
          // admin can still pin a specific piece to the top by giving
          // it a smaller sort_order than the rest.
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("bsi_abroad_production")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .order("departure_date", { ascending: true }),
      ]);

    // For services that haven't had spotlight fields populated yet,
    // cycle through the fallback media as placeholders so the row
    // still renders with something visible. DB values always win
    // when present — once admin uploads real media, that takes over.
    const dbServices = (servicesRes.data as Service[]) || fallbackServices;
    const fallbackMedia = fallbackServices.filter((f) => f.media_url);
    const services: Service[] = dbServices.map((svc, i) => {
      if (svc.media_url) return svc;
      const fb = fallbackMedia[i % Math.max(1, fallbackMedia.length)];
      if (!fb) return svc;
      return {
        ...svc,
        description:
          svc.description ??
          `Bentala Studio's ${svc.name.toLowerCase()} — crafted end-to-end with cinematic intent and global execution.`,
        cta_text: svc.cta_text ?? "Start Collaboration",
        cta_url:
          svc.cta_url ??
          `https://wa.me/6281284731599?text=Hi!%20Interested%20in%20${encodeURIComponent(svc.name)}`,
        learn_more_text: svc.learn_more_text ?? "Recent work",
        learn_more_url: svc.learn_more_url ?? "#portfolio",
        media_url: fb.media_url,
        media_type: fb.media_type,
      };
    });

    return {
      hero: (heroRes.data as HeroData) || fallbackHero,
      services,
      socialLinks: (socialsRes.data as SocialLink[]) || fallbackSocials,
      collabs: (collabsRes.data as Collaboration[]) || fallbackCollabs,
      portfolio: (portfolioRes.data as PortfolioItem[]) || fallbackPortfolio,
      abroadTrips:
        (abroadRes?.data as AbroadProductionTrip[] | null) ?? [],
    };
  } catch (err) {
    console.error("[HomePage] Failed to fetch data from Supabase:", err);
    return {
      hero: fallbackHero,
      services: fallbackServices,
      socialLinks: fallbackSocials,
      collabs: fallbackCollabs,
      portfolio: fallbackPortfolio,
      abroadTrips: [] as AbroadProductionTrip[],
    };
  }
}

export default async function HomePage() {
  const { hero, services, socialLinks, collabs, portfolio, abroadTrips } =
    await getData();

  return (
    <>
      <HomeIntro
        hero={hero}
        services={services}
        socialLinks={socialLinks}
        portfolioItems={portfolio}
      />
      {/* CollabScroll currently hidden — un-comment to bring it back. */}
      {/* <CollabScroll collabs={collabs} /> */}
      {/* z-10 so these sections paint over the position:fixed hero
          inside HomeIntro (which sits at z-0). Without this, the
          fixed hero would stay on top of every section the user
          scrolls into. */}
      <div className="relative z-10">
        {/* Admin can hide the entire Abroad Production banner via
            Settings → Home Page Sections. When hidden, Services
            naturally shifts up to take its place at the top of this
            block — no extra layout work needed. */}
        {!hero.abroad_section_hidden && (
          <AbroadProduction trips={abroadTrips} />
        )}
        {/* Services lifts in with a "grand-entrance" reveal — scale +
            translate + focus-pull blur over a longer easing. Pairs with
            the banner's scale-down so the hand-off reads as a single
            cinematic moment. Per-row stagger inside ServicesSpotlight
            layers on top. */}
        <RevealOnScroll className="reveal-grand">
          <ServicesSpotlight
            services={services}
            leadWhatsappNumber={hero.lead_whatsapp_number}
          />
        </RevealOnScroll>
        <PortfolioMasonry
          items={portfolio}
          headerImageUrl={hero.portfolio_header_image_url}
        />
      </div>
    </>
  );
}
