"use client";

import { useEffect, useRef } from "react";

export function EegWaveBg({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const lines = [
      { color: "rgba(6,182,212,0.12)", freq: 0.8, amp: 30, speed: 0.015, yOffset: 0.3 },
      { color: "rgba(6,182,212,0.08)", freq: 1.2, amp: 20, speed: 0.02, yOffset: 0.45 },
      { color: "rgba(34,211,238,0.06)", freq: 2.0, amp: 15, speed: 0.025, yOffset: 0.6 },
      { color: "rgba(6,182,212,0.10)", freq: 0.5, amp: 40, speed: 0.01, yOffset: 0.75 },
    ];

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const line of lines) {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < w; x += 2) {
          const normalizedX = x / w;
          const y =
            h * line.yOffset +
            Math.sin(normalizedX * Math.PI * 2 * line.freq + time * line.speed * 60) * line.amp +
            Math.sin(normalizedX * Math.PI * 6 + time * line.speed * 30) * (line.amp * 0.3) +
            Math.sin(normalizedX * Math.PI * 14 + time * line.speed * 90) * (line.amp * 0.1);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
