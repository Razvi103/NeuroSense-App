"use client";

import { useState, useCallback, useEffect } from "react";
import { TIME_WINDOWS } from "@/lib/constants";

interface UseEegNavigationOptions {
  durationSeconds: number;
  initialTimeWindow?: number;
}

export function useEegNavigation({ durationSeconds, initialTimeWindow = 10 }: UseEegNavigationOptions) {
  const [timeWindow, setTimeWindow] = useState(initialTimeWindow);
  const [timeOffset, setTimeOffset] = useState(0);
  const [gain, setGain] = useState(1);

  const maxOffset = Math.max(0, durationSeconds - timeWindow);

  const clampOffset = useCallback(
    (offset: number) => Math.max(0, Math.min(offset, maxOffset)),
    [maxOffset],
  );

  const scrollBy = useCallback(
    (delta: number) => {
      setTimeOffset((prev) => clampOffset(prev + delta));
    },
    [clampOffset],
  );

  const jumpTo = useCallback(
    (time: number) => {
      setTimeOffset(clampOffset(time - timeWindow / 2));
    },
    [clampOffset, timeWindow],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollBy(timeWindow * 0.5);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollBy(-timeWindow * 0.5);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setGain((g) => Math.min(g * 1.5, 20));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setGain((g) => Math.max(g / 1.5, 0.1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollBy, timeWindow]);

  const clampedOffset = clampOffset(timeOffset);
  if (clampedOffset !== timeOffset) {
    setTimeOffset(clampedOffset);
  }

  return {
    timeWindow,
    setTimeWindow: (tw: number) => {
      if (TIME_WINDOWS.includes(tw as (typeof TIME_WINDOWS)[number])) {
        setTimeWindow(tw);
      }
    },
    timeOffset,
    setTimeOffset: (offset: number) => setTimeOffset(clampOffset(offset)),
    gain,
    setGain,
    scrollBy,
    jumpTo,
    maxOffset,
    durationSeconds,
  };
}
