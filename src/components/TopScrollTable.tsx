"use client";

import { useEffect, useRef, useState } from "react";

export function TopScrollTable({ children }: { children: React.ReactNode }) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableContentRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const [scrollWidth, setScrollWidth] = useState(0);

  useEffect(() => {
    const updateScrollWidth = () => {
      setScrollWidth(tableContentRef.current?.scrollWidth ?? 0);
    };

    updateScrollWidth();

    const observer = new ResizeObserver(updateScrollWidth);
    if (tableContentRef.current) {
      observer.observe(tableContentRef.current);
    }

    window.addEventListener("resize", updateScrollWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScrollWidth);
    };
  }, [children]);

  function syncScroll(source: HTMLDivElement, target: HTMLDivElement | null) {
    if (!target || isSyncingRef.current) return;

    isSyncingRef.current = true;
    target.scrollLeft = source.scrollLeft;
    window.requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }

  return (
    <div className="max-w-full min-w-0">
      <div
        ref={topScrollRef}
        onScroll={(event) => syncScroll(event.currentTarget, tableScrollRef.current)}
        className="custom-scrollbar mb-2 max-w-full overflow-x-auto overflow-y-hidden rounded-md border border-slate-200 bg-slate-50"
      >
        <div style={{ width: Math.max(scrollWidth, 1), height: 14 }} />
      </div>

      <div
        ref={tableScrollRef}
        onScroll={(event) => syncScroll(event.currentTarget, topScrollRef.current)}
        className="no-bottom-scrollbar max-w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200"
      >
        <div ref={tableContentRef} className="w-max min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
