"use client";

import { useRef, useCallback } from "react";
import type { SeizureEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TimelineBarProps {
  durationSeconds: number;
  timeOffset: number;
  timeWindow: number;
  seizureEvents: SeizureEvent[];
  onSeek: (time: number) => void;
}

export function TimelineBar({
  durationSeconds,
  timeOffset,
  timeWindow,
  seizureEvents,
  onSeek,
}: TimelineBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      onSeek(ratio * durationSeconds);
    },
    [durationSeconds, onSeek],
  );

  const viewportLeft = (timeOffset / durationSeconds) * 100;
  const viewportWidth = (timeWindow / durationSeconds) * 100;

  return (
    <div className="space-y-1.5">
      <div
        ref={barRef}
        className="relative h-8 cursor-pointer rounded-lg bg-surface border border-border overflow-hidden"
        onClick={handleClick}
      >
        {seizureEvents.map((event) => {
          const left = (event.startTime / durationSeconds) * 100;
          const width = ((event.endTime - event.startTime) / durationSeconds) * 100;
          return (
            <div
              key={event.id}
              className="absolute top-0 h-full bg-amber-accent/30"
              style={{ left: `${left}%`, width: `${Math.max(width, 0.3)}%` }}
            />
          );
        })}

        <div
          className={cn(
            "absolute top-0 h-full border-x-2 border-text-primary/60",
            "bg-text-primary/5",
          )}
          style={{
            left: `${viewportLeft}%`,
            width: `${viewportWidth}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted font-mono px-1">
        <span>0:00</span>
        <span>{formatTimeline(durationSeconds / 4)}</span>
        <span>{formatTimeline(durationSeconds / 2)}</span>
        <span>{formatTimeline((durationSeconds * 3) / 4)}</span>
        <span>{formatTimeline(durationSeconds)}</span>
      </div>
    </div>
  );
}

function formatTimeline(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
