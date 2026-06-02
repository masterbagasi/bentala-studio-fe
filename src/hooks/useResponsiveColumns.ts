"use client";

import { useEffect, useState } from "react";

function getColCount(width: number): number {
  if (width < 640) return 2;   // Mobile
  if (width < 768) return 3;   // Tablet kecil
  if (width < 1024) return 4;  // Tablet
  if (width < 1280) return 5;  // Desktop kecil
  if (width < 1536) return 6;  // Desktop
  if (width < 1920) return 7;  // Desktop besar
  return 8;                    // Ultra-wide (max)
}

export function useResponsiveColumns(): number {
  const [colCount, setColCount] = useState<number>(() =>
    typeof window === "undefined" ? 2 : getColCount(window.innerWidth)
  );

  useEffect(() => {
    // Sync after hydration in case SSR returned wrong value
    setColCount(getColCount(window.innerWidth));

    let timeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setColCount(getColCount(window.innerWidth));
      }, 200); // debounce 200ms
    };

    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return colCount;
}
