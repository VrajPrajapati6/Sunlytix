"use client";

import { useEffect, useRef, useCallback } from "react";

export default function CursorWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const ripplesRef = useRef<
    { x: number; y: number; radius: number; maxRadius: number; opacity: number; speed: number }[]
  >([]);
  const trailRef = useRef<{ x: number; y: number; age: number; opacity: number }[]>([]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Add trail point
    trailRef.current.push({
      x: mouseRef.current.x,
      y: mouseRef.current.y,
      age: 0,
      opacity: 0.6,
    });
    if (trailRef.current.length > 50) trailRef.current.shift();

    // Randomly spawn ripple on movement
    if (Math.random() > 0.85) {
      ripplesRef.current.push({
        x: mouseRef.current.x,
        y: mouseRef.current.y,
        radius: 0,
        maxRadius: 60 + Math.random() * 80,
        opacity: 0.5,
        speed: 1 + Math.random() * 2,
      });
    }
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spawn burst of ripples on click
    for (let i = 0; i < 3; i++) {
      ripplesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius: 100 + i * 60,
        opacity: 0.7 - i * 0.15,
        speed: 2 + i * 0.5,
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // --- Cursor glow ---
      if (mx > 0 && my > 0 && mx < w && my < h) {
        const glowGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 150);
        glowGrad.addColorStop(0, "rgba(255, 106, 0, 0.12)");
        glowGrad.addColorStop(0.4, "rgba(255, 106, 0, 0.04)");
        glowGrad.addColorStop(1, "rgba(255, 106, 0, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(mx, my, 150, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright dot
        const coreGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 8);
        coreGrad.addColorStop(0, "rgba(255, 180, 80, 0.5)");
        coreGrad.addColorStop(1, "rgba(255, 106, 0, 0)");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(mx, my, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Cursor trail ---
      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const t = trailRef.current[i];
        t.age++;
        t.opacity *= 0.94;

        if (t.opacity < 0.01) {
          trailRef.current.splice(i, 1);
          continue;
        }

        const size = t.opacity * 3;
        const trailGrad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, size * 3);
        trailGrad.addColorStop(0, `rgba(255, 140, 50, ${t.opacity * 0.4})`);
        trailGrad.addColorStop(1, "rgba(255, 106, 0, 0)");
        ctx.fillStyle = trailGrad;
        ctx.beginPath();
        ctx.arc(t.x, t.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Ripples ---
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.radius += r.speed;
        r.opacity *= 0.97;

        if (r.radius >= r.maxRadius || r.opacity < 0.01) {
          ripplesRef.current.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(255, 106, 0, ${r.opacity * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Second inner ring
        if (r.radius > 10) {
          ctx.strokeStyle = `rgba(255, 180, 80, ${r.opacity * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // --- Magnetic lines from cursor to nearby area ---
      if (mx > 0 && my > 0 && mx < w && my < h) {
        const lineCount = 6;
        const time = Date.now() * 0.001;
        for (let i = 0; i < lineCount; i++) {
          const angle = (Math.PI * 2 * i) / lineCount + time * 0.3;
          const len = 40 + Math.sin(time * 2 + i) * 20;
          const ex = mx + Math.cos(angle) * len;
          const ey = my + Math.sin(angle) * len;

          ctx.strokeStyle = `rgba(255, 106, 0, ${0.15 + Math.sin(time + i) * 0.05})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(mx, my);

          // Curved line via control point
          const cpx = mx + Math.cos(angle + 0.5) * len * 0.5;
          const cpy = my + Math.sin(angle + 0.5) * len * 0.5;
          ctx.quadraticCurveTo(cpx, cpy, ex, ey);
          ctx.stroke();

          // End dot
          ctx.fillStyle = `rgba(255, 140, 50, ${0.4 + Math.sin(time * 3 + i) * 0.2})`;
          ctx.beginPath();
          ctx.arc(ex, ey, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [handleMouseMove, handleClick]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-20 cursor-none"
    />
  );
}
