"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-cyan">
        Something went wrong
      </p>
      <h2 className="font-sans text-[clamp(28px,4vw,52px)] font-bold text-white leading-none">
        Unexpected Error
      </h2>
      <p className="text-[rgba(240,244,255,0.5)] text-sm max-w-sm" role="alert">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="font-sans text-sm font-medium text-white border border-[rgba(240,244,255,0.2)] px-10 py-3 rounded-full transition-all hover:border-cyan hover:text-cyan"
      >
        Try again
      </button>
    </div>
  );
}
