"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-7 right-7 z-[888] w-11 h-11 bg-[rgba(8,9,13,0.85)] backdrop-blur-[12px] border border-[rgba(11,61,231,0.3)] rounded-full flex items-center justify-center cursor-pointer text-cyan transition-all duration-300 hover:bg-cyan hover:border-cyan hover:text-bg hover:shadow-[0_0_24px_rgba(11,61,231,0.4)] ${
        show
          ? "opacity-100 pointer-events-auto translate-y-0"
          : "opacity-0 pointer-events-none translate-y-3"
      }`}
      title="Back to top"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
