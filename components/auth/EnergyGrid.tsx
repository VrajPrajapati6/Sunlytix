"use client";

import { useEffect, useRef } from "react";

export default function EnergyGrid() {
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

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const gridSize = 60;
      const cols = Math.ceil(w / gridSize) + 1;
      const rows = Math.ceil(h / gridSize) + 1;

      // Moving grid lines
      const offsetX = (time * 0.3) % gridSize;
      const offsetY = (time * 0.2) % gridSize;

      ctx.strokeStyle = "rgba(255, 106, 0, 0.06)";
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let i = 0; i < cols; i++) {
        const x = i * gridSize - offsetX;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Horizontal lines
      for (let i = 0; i < rows; i++) {
        const y = i * gridSize - offsetY;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Glowing intersection points
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSize - offsetX;
          const y = j * gridSize - offsetY;
          const pulse = Math.sin(time * 0.02 + i * 0.5 + j * 0.3) * 0.5 + 0.5;
          
          if (pulse > 0.7) {
            const radius = pulse * 2;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
            gradient.addColorStop(0, `rgba(255, 106, 0, ${pulse * 0.4})`);
            gradient.addColorStop(1, "rgba(255, 106, 0, 0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Energy flow lines (horizontal beams)
      for (let i = 0; i < 3; i++) {
        const y = (h / 4) * (i + 1);
        const beamX = ((time * 2 + i * 200) % (w + 200)) - 100;
        const gradient = ctx.createLinearGradient(beamX - 100, y, beamX + 100, y);
        gradient.addColorStop(0, "rgba(255, 106, 0, 0)");
        gradient.addColorStop(0.5, "rgba(255, 106, 0, 0.15)");
        gradient.addColorStop(1, "rgba(255, 106, 0, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(beamX - 100, y);
        ctx.lineTo(beamX + 100, y);
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
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.8 }}
    />
  );
}
