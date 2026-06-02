"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { NewsPost } from "@/lib/types";
import Lightbox from "./Lightbox";
import { IG_GRID_BATCH } from "@/lib/constants";

interface Props {
  posts: NewsPost[];
  account: string;
}

export default function IgGrid({ posts, account }: Props) {
  const [visibleCount, setVisibleCount] = useState(IG_GRID_BATCH);
  const [lightboxPost, setLightboxPost] = useState<NewsPost | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setVisibleCount(IG_GRID_BATCH);
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(t);
  }, [account, posts]);

  const closeLightbox = useCallback(() => setLightboxPost(null), []);

  const visible = posts.slice(0, visibleCount);
  const hasMore = posts.length > visibleCount;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center gap-3.5 py-20">
        <div className="flex gap-[7px]">
          <div className="loader-dot" />
          <div className="loader-dot" style={{ animationDelay: "0.2s" }} />
          <div className="loader-dot" style={{ animationDelay: "0.4s" }} />
        </div>
        <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-dim">
          Loading feed...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[3px] pb-16 w-full">
        {visible.map((post, i) => (
          <div
            key={post.id}
            className="relative overflow-hidden aspect-[4/5] bg-bg3 cursor-pointer group"
            style={{
              opacity: 0,
              animation: `fadeUp 0.4s ease ${30 + i * 35}ms forwards`,
            }}
            onClick={() => setLightboxPost(post)}
          >
            <Image
              src={post.media_url}
              alt={post.caption.slice(0, 80)}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-400 group-hover:scale-[1.04]"
            />

            {/* Video badge */}
            {post.media_type === "video" && (
              <div className="absolute top-2 right-2 text-white [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.8))]">
                <svg viewBox="0 0 24 24" fill="white" className="w-[18px] h-[18px]">
                  <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-[rgba(0,0,0,0.45)] flex items-center justify-center gap-7 opacity-0 transition-opacity duration-250 group-hover:opacity-100">
              <div className="flex items-center gap-[7px] text-[15px] font-bold text-white">
                <svg viewBox="0 0 24 24" fill="white" className="w-[18px] h-[18px]">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {post.like_count.toLocaleString()}
              </div>
              <div className="flex items-center gap-[7px] text-[15px] font-bold text-white">
                <svg viewBox="0 0 24 24" fill="white" className="w-[18px] h-[18px]">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                {post.comments_count.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center pb-20 pt-12">
        <button
          onClick={() => setVisibleCount((c) => c + 9)}
          disabled={!hasMore}
          className={`font-sans text-sm font-medium text-white border border-[rgba(240,244,255,0.2)] px-12 py-3.5 rounded-full bg-transparent cursor-pointer inline-flex items-center gap-2.5 transition-all duration-250 ${
            hasMore
              ? "hover:border-cyan hover:text-cyan hover:bg-[rgba(11,61,231,0.05)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(11,61,231,0.1)]"
              : "opacity-35 cursor-default"
          }`}
        >
          {hasMore ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Load More
            </>
          ) : (
            "All posts loaded"
          )}
        </button>
      </div>

      <Lightbox post={lightboxPost} account={account} onClose={closeLightbox} />
    </>
  );
}
