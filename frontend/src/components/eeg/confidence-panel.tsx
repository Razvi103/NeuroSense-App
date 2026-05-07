"use client";

import { useRef, useEffect } from "react";
import type { ConfidenceFrame } from "@/lib/types";

interface ConfidencePanelProps {
  frames: ConfidenceFrame[];
  timeOffset: number;
  timeWindow: number;
  durationSeconds: number;
}

function getConfidenceColor(value: number): string {
  if (value < 0.3) return `rgba(16, 185, 129, ${0.3 + value})`;
  if (value < 0.6) return `rgba(245, 158, 11, ${0.3 + value * 0.5})`;
  return `rgba(244, 63, 94, ${0.4 + value * 0.5})`;
}

export function ConfidencePanel({
  frames,
  timeOffset,
  timeWindow,
}: ConfidencePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const labelWidth = 52;
    const plotW = w - labelWidth;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#64748b";
    ctx.font = "10px var(--font-jetbrains-mono), monospace";
    ctx.textAlign = "right";
    ctx.fillText("conf", labelWidth - 8, h / 2 + 4);

    const startT = Math.floor(timeOffset);
    const endT = Math.ceil(timeOffset + timeWindow);

    for (let t = startT; t < endT && t < frames.length; t++) {
      const frame = frames[t];
      if (!frame) continue;

      const x = labelWidth + ((t - timeOffset) / timeWindow) * plotW;
      const barWidth = Math.max(1, plotW / timeWindow);

      ctx.fillStyle = getConfidenceColor(frame.value);
      ctx.fillRect(x, 0, barWidth + 0.5, h);
    }
  }, [frames, timeOffset, timeWindow]);

  return (
    <div ref={containerRef} className="h-6 w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
