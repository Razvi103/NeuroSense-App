"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ChannelData, SeizureEvent } from "@/lib/types";
import { CHANNEL_COLORS } from "@/lib/constants";

interface ChannelCanvasProps {
  channels: ChannelData[];
  visibleChannels: Set<string>;
  timeOffset: number;
  timeWindow: number;
  gain: number;
  seizureEvents: SeizureEvent[];
  onTimeClick?: (time: number) => void;
}

export function ChannelCanvas({
  channels,
  visibleChannels,
  timeOffset,
  timeWindow,
  gain,
  seizureEvents,
  onTimeClick,
}: ChannelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
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
    const visible = channels.filter((ch) => visibleChannels.has(ch.label));
    const numChannels = visible.length;
    if (numChannels === 0) return;

    const channelHeight = h / numChannels;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    const secondsPerGrid = timeWindow <= 10 ? 1 : timeWindow <= 30 ? 2 : 5;
    const startSecond = Math.ceil(timeOffset / secondsPerGrid) * secondsPerGrid;

    ctx.strokeStyle = "rgba(226, 232, 240, 0.8)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    for (let t = startSecond; t < timeOffset + timeWindow; t += secondsPerGrid) {
      const x = labelWidth + ((t - timeOffset) / timeWindow) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "10px var(--font-jetbrains-mono), monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${t.toFixed(0)}s`, x, h - 4);
    }

    ctx.strokeStyle = "rgba(226, 232, 240, 0.5)";
    for (let i = 1; i < numChannels; i++) {
      const y = i * channelHeight;
      ctx.beginPath();
      ctx.moveTo(labelWidth, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    for (const event of seizureEvents) {
      if (event.endTime < timeOffset || event.startTime > timeOffset + timeWindow) continue;
      const x1 = labelWidth + Math.max(0, (event.startTime - timeOffset) / timeWindow) * plotW;
      const x2 = labelWidth + Math.min(1, (event.endTime - timeOffset) / timeWindow) * plotW;
      ctx.fillStyle = "rgba(217, 119, 6, 0.15)";
      ctx.fillRect(x1, 0, x2 - x1, h);
      ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, 0, x2 - x1, h);
    }

    visible.forEach((channel, idx) => {
      const yCenter = idx * channelHeight + channelHeight / 2;
      const color = CHANNEL_COLORS[channels.indexOf(channel) % CHANNEL_COLORS.length];

      ctx.fillStyle = "#475569";
      ctx.font = "11px var(--font-jetbrains-mono), monospace";
      ctx.textAlign = "right";
      ctx.fillText(channel.label, labelWidth - 8, yCenter + 4);

      const startSample = Math.floor(timeOffset * channel.sampleRate);
      const endSample = Math.ceil((timeOffset + timeWindow) * channel.sampleRate);
      const totalSamples = endSample - startSample;
      const step = Math.max(1, Math.floor(totalSamples / plotW));

      const amplitude = (channelHeight * 0.4 * gain) / (channel.physicalMax - channel.physicalMin);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      let firstPoint = true;
      for (let i = startSample; i < endSample && i < channel.samples.length; i += step) {
        const x = labelWidth + ((i / channel.sampleRate - timeOffset) / timeWindow) * plotW;
        const value = channel.samples[i] || 0;
        const y = yCenter - value * amplitude;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });
  }, [channels, visibleChannels, timeOffset, timeWindow, gain, seizureEvents]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const scrollAmount = (e.deltaY / 100) * (timeWindow * 0.1);
      const newOffset = Math.max(0, timeOffset + scrollAmount);
      onTimeClick?.(newOffset + timeWindow / 2);
    },
    [timeOffset, timeWindow, onTimeClick],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const labelWidth = 52;
      const plotW = rect.width - labelWidth;
      const relX = e.clientX - rect.left - labelWidth;
      if (relX < 0) return;
      const clickTime = timeOffset + (relX / plotW) * timeWindow;
      onTimeClick?.(clickTime);
    },
    [timeOffset, timeWindow, onTimeClick],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair"
        onWheel={handleWheel}
        onClick={handleClick}
      />
    </div>
  );
}
