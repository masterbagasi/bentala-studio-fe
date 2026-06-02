import type { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { NewsPost } from "@/lib/types";
import PageHero from "@/components/about/PageHero";
import NewsFeed from "./NewsFeed";
import FollowBand from "@/components/news/FollowBand";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from("bsi_seo").select("*").eq("page", "news").single();
      if (data) {
        return {
          title: data.meta_title,
          description: data.meta_description,
          openGraph: { title: data.meta_title, description: data.meta_description, images: data.og_image_url ? [data.og_image_url] : [] },
        };
      }
    } catch (err) {
      console.error("[NewsPage] Failed to fetch SEO data:", err);
    }
  }
  return {
    title: "News — Bentala Project Indonesia",
    description: "Berita dan insight internasional yang berkaitan dengan Indonesia.",
  };
}

const fallbackPosts: NewsPost[] = [
  // ── Instagram ──────────────────────────────────────────────────────────────
  { id: "ig-1",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Diaspora Indonesia kini semakin mendominasi panggung global. #Indonesia #BPI", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 842,  comments_count: 34,  posted_at: "2025-04-15T10:00:00+07:00", is_published: true, sort_order: 1  },
  { id: "ig-2",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Seoul dan Jakarta — dua kota yang saling mempengaruhi budaya pop dunia.", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 1204, comments_count: 67,  posted_at: "2025-04-13T08:30:00+07:00", is_published: true, sort_order: 2  },
  { id: "ig-3",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1520716083928-3c735c6d9c5c?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Fashion Indonesia goes international. #IndonesianFashion #GlobalStyle", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 976,  comments_count: 45,  posted_at: "2025-04-11T14:00:00+07:00", is_published: true, sort_order: 3  },
  { id: "ig-4",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Bali bukan hanya destinasi wisata — ia adalah pusat kreativitas global.", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 2103, comments_count: 112, posted_at: "2025-04-05T16:00:00+07:00", is_published: true, sort_order: 4  },
  { id: "ig-5",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Kuliner Indonesia kini punya tempat di meja makan dunia. #IndonesianFood", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 887,  comments_count: 56,  posted_at: "2025-04-03T12:00:00+07:00", is_published: true, sort_order: 5  },
  { id: "ig-6",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Nusantara — menarik perhatian dunia sebagai proyek kota masa depan. #IKN", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 2341, comments_count: 178, posted_at: "2025-03-28T14:00:00+07:00", is_published: true, sort_order: 6  },
  { id: "ig-7",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Musik Indonesia menembus chart global — dari pop hingga indie elektronik. #IndonesianMusic", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 1567, comments_count: 89,  posted_at: "2025-03-25T09:00:00+07:00", is_published: true, sort_order: 7  },
  { id: "ig-8",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Keindahan alam Indonesia yang terus menginspirasi kreator konten dunia.", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 3102, comments_count: 204, posted_at: "2025-03-20T15:30:00+07:00", is_published: true, sort_order: 8  },
  { id: "ig-9",  account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Brand lokal Indonesia kini bersaing di pasar Eropa dan Amerika. #BrandLokal", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 743,  comments_count: 31,  posted_at: "2025-03-17T11:00:00+07:00", is_published: true, sort_order: 9  },
  { id: "ig-10", account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "London menyambut influencer Indonesia dengan tangan terbuka. #London #Indonesia", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 1890, comments_count: 143, posted_at: "2025-03-12T08:00:00+07:00", is_published: true, sort_order: 10 },
  { id: "ig-11", account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Kyoto dan Yogyakarta — dua kota bersejarah yang punya energi yang sama.", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 2678, comments_count: 187, posted_at: "2025-03-08T13:00:00+07:00", is_published: true, sort_order: 11 },
  { id: "ig-12", account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Paris Fashion Week — dan Indonesia ada di sana. #PFW #IndonesianDesigner", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 4210, comments_count: 312, posted_at: "2025-03-03T17:00:00+07:00", is_published: true, sort_order: 12 },
  { id: "ig-13", account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Film pendek karya sineas Indonesia masuk festival internasional. #Cinema #Film", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 1123, comments_count: 76,  posted_at: "2025-02-27T10:00:00+07:00", is_published: true, sort_order: 13 },
  { id: "ig-14", account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Generasi muda Indonesia membangun startup yang diakui Silicon Valley.", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 987,  comments_count: 54,  posted_at: "2025-02-22T09:30:00+07:00", is_published: true, sort_order: 14 },
  { id: "ig-15", account: "bpi_ig", media_url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=600&fit=crop", media_type: "image", thumbnail_url: null, caption: "Olahraga dan identitas — atlet Indonesia di pentas dunia. #Sports #Indonesia", permalink: "https://instagram.com/bentalaprojectindonesia", like_count: 3450, comments_count: 230, posted_at: "2025-02-18T14:00:00+07:00", is_published: true, sort_order: 15 },

  // ── TikTok ─────────────────────────────────────────────────────────────────
  { id: "tt-1",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Indonesia di mata dunia #BPI #Indonesia #Viral", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 12400, comments_count: 234,  posted_at: "2025-04-15T10:00:00+07:00", is_published: true, sort_order: 1  },
  { id: "tt-2",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Bali goes international #Bali #Travel", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 28900, comments_count: 412,  posted_at: "2025-04-13T08:00:00+07:00", is_published: true, sort_order: 2  },
  { id: "tt-3",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Kuliner Indonesia go global! #Food", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 45200, comments_count: 678,  posted_at: "2025-04-11T14:00:00+07:00", is_published: true, sort_order: 3  },
  { id: "tt-4",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1520716083928-3c735c6d9c5c?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Fashion lokal yang mendunia ✨ #IndonesianFashion #OOTD", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 19300, comments_count: 301,  posted_at: "2025-04-09T12:00:00+07:00", is_published: true, sort_order: 4  },
  { id: "tt-5",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Landscape Indonesia yang bikin bule takjub 🌿 #Nature #Indonesia", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 67800, comments_count: 891,  posted_at: "2025-04-07T09:00:00+07:00", is_published: true, sort_order: 5  },
  { id: "tt-6",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "POV: content creator Indonesia di Paris 🗼 #Paris #Travel", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 54100, comments_count: 743,  posted_at: "2025-04-04T16:00:00+07:00", is_published: true, sort_order: 6  },
  { id: "tt-7",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Indonesia meets Japan 🇮🇩🇯🇵 #Japan #Culture #Indonesia", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 38600, comments_count: 512,  posted_at: "2025-04-01T10:30:00+07:00", is_published: true, sort_order: 7  },
  { id: "tt-8",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "London calling 📞 ekspat Indonesia cerita soal hidup di UK #London #Expat", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 22100, comments_count: 389,  posted_at: "2025-03-28T14:00:00+07:00", is_published: true, sort_order: 8  },
  { id: "tt-9",  account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Tembok Berlin saksi bisu perjuangan diaspora Indonesia 🇩🇪 #Berlin #Diaspora", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 16700, comments_count: 278,  posted_at: "2025-03-24T11:00:00+07:00", is_published: true, sort_order: 9  },
  { id: "tt-10", account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Film Indonesia yang harus kamu tonton sebelum tidur 🎬 #Film #Review", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 31500, comments_count: 467,  posted_at: "2025-03-20T19:00:00+07:00", is_published: true, sort_order: 10 },
  { id: "tt-11", account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Brand Indonesia yang bikin orang luar negeri penasaran 🔥 #BrandLokal", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 43200, comments_count: 623,  posted_at: "2025-03-16T08:00:00+07:00", is_published: true, sort_order: 11 },
  { id: "tt-12", account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Atlet Indonesia di Olimpiade — kebanggaan kita bersama 🥇 #Sports", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 89400, comments_count: 1204, posted_at: "2025-03-12T15:00:00+07:00", is_published: true, sort_order: 12 },
  { id: "tt-13", account: "bpi_tt", media_url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=750&fit=crop", media_type: "image", thumbnail_url: null, caption: "Startup Indonesia yang lagi booming di Asia Tenggara 💡 #Startup #Tech", permalink: "https://tiktok.com/@bentalaprojectindonesia", like_count: 27800, comments_count: 445,  posted_at: "2025-03-08T10:00:00+07:00", is_published: true, sort_order: 13 },
];

async function getData() {
  if (!isSupabaseConfigured || !supabase) return fallbackPosts;
  try {
    const { data } = await supabase.from("bsi_news_feed").select("*").eq("is_published", true).order("sort_order");
    return (data as NewsPost[]) || fallbackPosts;
  } catch (err) {
    console.error("[NewsPage] Failed to fetch posts:", err);
    return fallbackPosts;
  }
}

export default async function NewsPage() {
  const posts = await getData();

  return (
    <>
      <PageHero
        eyebrow="Bentala Project Indonesia"
        title={
          <>
            International
            <br />
            <span className="text-cyan">News</span>
          </>
        }
      />
      <NewsFeed posts={posts} />
      <FollowBand />
    </>
  );
}
