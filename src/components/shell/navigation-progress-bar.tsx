"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = () => {
    setIsVisible(true);
    setProgress(15);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        const step = Math.max(2, (90 - prev) / 6);
        return Math.min(85, prev + step);
      });
    }, 120);
  };

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 250);
  };

  // When pathname or searchParams change, mark progress as complete
  useEffect(() => {
    if (isVisible) {
      completeProgress();
    }
  }, [pathname, searchParams]);

  // Global click listener on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Only handle internal relative dashboard navigations
      if (
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !target.getAttribute("target") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const currentFullPath = window.location.pathname + window.location.search;
        if (href !== currentFullPath) {
          startProgress();
        }
      }
    };

    window.addEventListener("click", handleClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        className="h-full bg-gradient-to-r from-[#B99558] via-[#89652D] to-[#B99558] transition-all duration-200 ease-out shadow-[0_0_8px_rgba(185,149,88,0.8)]"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

export default NavigationProgressBar;
