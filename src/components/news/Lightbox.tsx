"use client";

import { useEffect } from "react";
import { NewsPost } from "@/lib/types";

interface Props {
  post: NewsPost | null;
  account: string;
  onClose: () => void;
}

export default function Lightbox({ post, account, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (post) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [post]);

  if (!post) return null;

  const date = new Date(post.posted_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const accountHandle =
    account === "bpi_ig" ? "@bentalaprojectindonesia" : "@bentalaprojectindonesia";

  const viewLabel =
    account === "bpi_tt" ? "View on TikTok →" : "View on Instagram →";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[rgba(0,0,0,0.92)] flex items-center justify-center p-5 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="bg-bg2 rounded-2xl max-w-[900px] w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden relative max-h-[90vh] border-[0.5px] border-[rgba(240,244,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 bg-[rgba(0,0,0,0.5)] border-none text-white w-8 h-8 rounded-full cursor-pointer text-sm flex items-center justify-center transition-colors hover:bg-[rgba(255,255,255,0.2)]"
        >
          &#x2715;
        </button>

        {/* Media */}
        <div className="bg-bg flex items-center justify-center min-h-[300px]">
          {post.media_type === "video" ? (
            <video
              src={post.media_url}
              controls
              autoPlay
              muted
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url}
              alt=""
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          )}
        </div>

        {/* Body */}
        <div className="p-7 flex flex-col gap-3 overflow-y-auto">
          <div className="flex justify-between items-center">
            <div className="text-[13px] font-bold text-cyan">{accountHandle}</div>
            <div className="text-[11px] text-dim">{date}</div>
          </div>
          <p className="text-sm font-normal text-white leading-[1.7] flex-1">
            {post.caption}
          </p>
          <div className="text-[13px] text-dim">
            {post.like_count > 0 && (
              <span>&#x2764;&#xFE0F; {post.like_count.toLocaleString()} likes</span>
            )}
            {post.like_count > 0 && post.comments_count > 0 && <span> &middot; </span>}
            {post.comments_count > 0 && (
              <span>&#x1F4AC; {post.comments_count} comments</span>
            )}
          </div>
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold tracking-[0.08em] text-cyan no-underline border-[0.5px] border-[rgba(11,61,231,0.25)] px-[18px] py-2.5 rounded-lg text-center transition-all hover:bg-[rgba(11,61,231,0.08)]"
          >
            {viewLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
