"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ───────── colour tokens ───────── */
const C = {
  bg: "#000000",
  orange: "#FF6A00",
  soft: "#FFA94D",
  white: "#FFFFFF",
  dim: "#111111",
};

/* ───────── Sub-components ───────── */

/* ── Floating background particles ── */
function BackgroundParticles() {
  // ~75 tiny twinkling stars / dots spread across the scene
  const dots = [
    // Row 1 (y 5-40)
    { x: 15, y: 10, r: 0.9, dur: 4, del: 0 },
    { x: 85, y: 16, r: 1.1, dur: 5, del: 1.2 },
    { x: 145, y: 8, r: 0.7, dur: 3.8, del: 0.3 },
    { x: 230, y: 25, r: 1.3, dur: 4.5, del: 2 },
    { x: 310, y: 13, r: 0.6, dur: 5.2, del: 0.8 },
    { x: 380, y: 33, r: 1.0, dur: 3.5, del: 1.5 },
    { x: 610, y: 29, r: 1.1, dur: 4.5, del: 2.1 },
    { x: 660, y: 18, r: 0.8, dur: 3.2, del: 0.6 },
    // Row 2 (y 50-100)
    { x: 40, y: 58, r: 1.2, dur: 4, del: 0 },
    { x: 120, y: 73, r: 0.8, dur: 5, del: 1 },
    { x: 200, y: 66, r: 1.0, dur: 3.5, del: 0.5 },
    { x: 280, y: 80, r: 0.7, dur: 4.8, del: 2.2 },
    { x: 370, y: 95, r: 0.9, dur: 3.6, del: 1.7 },
    { x: 450, y: 88, r: 0.6, dur: 5.5, del: 0.4 },
    { x: 650, y: 95, r: 0.7, dur: 3, del: 1.5 },
    // Row 3 (y 110-160)
    { x: 25, y: 120, r: 0.8, dur: 5.3, del: 2.8 },
    { x: 80, y: 132, r: 0.9, dur: 5.5, del: 0.3 },
    { x: 155, y: 143, r: 1.1, dur: 4.1, del: 1.4 },
    { x: 250, y: 114, r: 0.6, dur: 5, del: 2.8 },
    { x: 450, y: 117, r: 1.0, dur: 4.3, del: 0.9 },
    { x: 550, y: 147, r: 0.5, dur: 5.5, del: 0.2 },
    { x: 620, y: 125, r: 1.0, dur: 3.9, del: 1.1 },
    { x: 670, y: 154, r: 0.7, dur: 4.6, del: 3.0 },
    // Row 4 (y 165-220)
    { x: 30, y: 183, r: 0.7, dur: 6, del: 3 },
    { x: 95, y: 198, r: 1.2, dur: 4.2, del: 0.7 },
    { x: 180, y: 176, r: 1.1, dur: 6, del: 1 },
    { x: 440, y: 205, r: 0.5, dur: 4.7, del: 3.2 },
    { x: 560, y: 191, r: 0.9, dur: 3.4, del: 1.9 },
    { x: 600, y: 220, r: 1.1, dur: 4.2, del: 0.7 },
    { x: 670, y: 183, r: 0.9, dur: 3.6, del: 1.4 },
    { x: 130, y: 213, r: 0.6, dur: 5.1, del: 2.5 },
    // Row 5 (y 230-280)
    { x: 50, y: 242, r: 1.0, dur: 4.4, del: 0.9 },
    { x: 160, y: 227, r: 1.3, dur: 4, del: 1.2 },
    { x: 230, y: 257, r: 0.8, dur: 5.8, del: 0.1 },
    { x: 480, y: 257, r: 0.7, dur: 5.8, del: 1.3 },
    { x: 570, y: 242, r: 1.0, dur: 3.5, del: 2.4 },
    { x: 620, y: 279, r: 1.0, dur: 4.9, del: 0.4 },
    { x: 660, y: 249, r: 0.6, dur: 5.4, del: 1.8 },
    { x: 15, y: 271, r: 0.9, dur: 4.0, del: 3.1 },
    // Row 6 (y 285-340)
    { x: 70, y: 300, r: 0.8, dur: 4.1, del: 2.1 },
    { x: 50, y: 323, r: 0.8, dur: 6, del: 0.8 },
    { x: 140, y: 308, r: 1.1, dur: 3.7, del: 0.5 },
    { x: 220, y: 330, r: 1.0, dur: 3.4, del: 0.1 },
    { x: 320, y: 300, r: 0.6, dur: 5.3, del: 1.9 },
    { x: 400, y: 323, r: 0.7, dur: 4.5, del: 2.7 },
    { x: 550, y: 308, r: 0.9, dur: 3.3, del: 0.6 },
    { x: 640, y: 330, r: 0.6, dur: 5, del: 1.8 },
    { x: 20, y: 334, r: 0.7, dur: 5.1, del: 2.3 },
    // Row 7 (y 345-400)
    { x: 45, y: 360, r: 1.0, dur: 4.3, del: 1.6 },
    { x: 100, y: 382, r: 1.0, dur: 3.8, del: 2.5 },
    { x: 140, y: 367, r: 0.9, dur: 4.6, del: 2.4 },
    { x: 265, y: 374, r: 0.8, dur: 5.0, del: 0.3 },
    { x: 400, y: 389, r: 0.8, dur: 4.1, del: 2.1 },
    { x: 470, y: 360, r: 1.1, dur: 3.5, del: 1.0 },
    { x: 530, y: 374, r: 0.8, dur: 3.3, del: 0.7 },
    { x: 610, y: 352, r: 1.0, dur: 4.8, del: 2.0 },
    { x: 660, y: 382, r: 0.7, dur: 5.6, del: 0.9 },
    // Row 8 (y 400-435)
    { x: 10, y: 410, r: 1.1, dur: 3.9, del: 1.6 },
    { x: 75, y: 422, r: 0.8, dur: 4.4, del: 2.6 },
    { x: 140, y: 407, r: 0.9, dur: 4.6, del: 2.4 },
    { x: 210, y: 425, r: 1.0, dur: 3.2, del: 0.8 },
    { x: 300, y: 410, r: 1.0, dur: 3.2, del: 0.4 },
    { x: 350, y: 433, r: 0.8, dur: 5.2, del: 1.1 },
    { x: 430, y: 418, r: 0.7, dur: 4.0, del: 2.9 },
    { x: 500, y: 430, r: 1.2, dur: 4.5, del: 0.6 },
    { x: 580, y: 407, r: 0.9, dur: 3.5, del: 0 },
    { x: 630, y: 433, r: 1.0, dur: 4.2, del: 1.3 },
    { x: 660, y: 415, r: 1.2, dur: 3.7, del: 0.5 },
    // Extra scattered bright ones
    { x: 70, y: 88, r: 1.4, dur: 4.4, del: 2.6 },
    { x: 310, y: 147, r: 1.5, dur: 5.0, del: 1.0 },
    { x: 550, y: 271, r: 1.4, dur: 3.8, del: 2.0 },
    { x: 190, y: 352, r: 1.3, dur: 4.7, del: 0.3 },
    { x: 460, y: 73, r: 1.5, dur: 5.2, del: 1.8 },
  ];
  return (
    <g>
      {dots.map((d, i) => (
        <motion.circle
          key={`bg-dot-${i}`}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={C.white}
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{
            duration: d.dur,
            delay: d.del,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </g>
  );
}

function Sun({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const cx = 520;
  const cy = 55;
  const rayCount = 12;

  return (
    <g
      onClick={onToggle}
      style={{ cursor: "pointer" }}
    >
      {/* Very wide soft ambient glow */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={90}
        fill="url(#sunOuterGlow)"
        animate={{ r: active ? 110 : 90, opacity: active ? 0.8 : 0.35 }}
        transition={{ duration: 0.5 }}
      />

      {/* Corona / mid glow */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={55}
        fill="url(#sunGlow)"
        animate={{ r: active ? 70 : 55, opacity: active ? 1 : 0.5 }}
        transition={{ duration: 0.4 }}
      />

      {/* Rotating rays */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {Array.from({ length: rayCount }).map((_, i) => {
          const angle = (i * 360) / rayCount;
          const rad = (angle * Math.PI) / 180;
          const inner = 36;
          const outer = active ? 65 : 52;
          return (
            <motion.line
              key={`ray-${i}`}
              x1={cx + Math.cos(rad) * inner}
              y1={cy + Math.sin(rad) * inner}
              x2={cx + Math.cos(rad) * outer}
              y2={cy + Math.sin(rad) * outer}
              stroke={C.orange}
              strokeWidth={i % 2 === 0 ? 2 : 1.2}
              strokeLinecap="round"
              animate={{
                opacity: [0.4, 0.9, 0.4],
                x2: cx + Math.cos(rad) * (active ? 68 : 52),
                y2: cy + Math.sin(rad) * (active ? 68 : 52),
              }}
              transition={{
                duration: 2 + (i % 3) * 0.5,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          );
        })}
      </motion.g>

      {/* Counter-rotating short rays */}
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8 + 22;
          const rad = (angle * Math.PI) / 180;
          return (
            <motion.line
              key={`ray2-${i}`}
              x1={cx + Math.cos(rad) * 38}
              y1={cy + Math.sin(rad) * 38}
              x2={cx + Math.cos(rad) * 47}
              y2={cy + Math.sin(rad) * 47}
              stroke={C.soft}
              strokeWidth={0.8}
              strokeLinecap="round"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.25 }}
            />
          );
        })}
      </motion.g>

      {/* Main sun body — gradient filled */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={32}
        fill="url(#sunBodyGrad)"
        animate={{ r: active ? 37 : 32 }}
        transition={{ duration: 0.4 }}
      />

      {/* Surface texture spots */}
      <motion.circle cx={cx - 8} cy={cy - 6} r={5} fill={C.soft} opacity={0.3}
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }} />
      <motion.circle cx={cx + 10} cy={cy + 4} r={4} fill={C.soft} opacity={0.25}
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }} />
      <motion.circle cx={cx + 2} cy={cy - 12} r={3} fill="#FFD080" opacity={0.2}
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} />
      <motion.circle cx={cx - 14} cy={cy + 8} r={3.5} fill={C.soft} opacity={0.2}
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 2 }} />

      {/* Bright highlight / specular */}
      <motion.circle
        cx={cx - 10}
        cy={cy - 10}
        r={10}
        fill={C.white}
        opacity={0.15}
        animate={{ opacity: active ? 0.25 : 0.15 }}
        transition={{ duration: 0.4 }}
      />

      {/* Pulse rings */}
      <motion.circle
        cx={cx} cy={cy} r={32}
        fill="none" stroke={C.orange} strokeWidth={1}
        animate={{ r: active ? [37, 58, 37] : [32, 48, 32], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx={cx} cy={cy} r={40}
        fill="none" stroke={C.soft} strokeWidth={0.5}
        animate={{ r: active ? [45, 72, 45] : [40, 60, 40], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      {/* Click hint text */}
      {!active && (
        <motion.text
          x={cx}
          y={150}
          textAnchor="middle"
          fill={C.white}
          fontSize={10}
          opacity={0.3}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Click the sun
        </motion.text>
      )}
    </g>
  );
}

function SolarPanel({ active }: { active: boolean }) {
  const cells = [];
  const panelX = 280;
  const panelY = 165;
  const cols = 6;
  const rows = 3;
  const cw = 18;
  const ch = 10;
  const gap = 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <motion.rect
          key={`cell-${r}-${c}`}
          x={panelX + c * (cw + gap)}
          y={panelY + r * (ch + gap)}
          width={cw}
          height={ch}
          rx={1}
          fill={C.dim}
          animate={{
            fill: active ? C.orange : C.dim,
            opacity: active ? [0.6, 1, 0.6] : 1,
          }}
          transition={{
            duration: 1.2,
            delay: active ? (r * cols + c) * 0.04 : 0,
            repeat: active ? Infinity : 0,
            repeatType: "reverse",
          }}
        />
      );
    }
  }

  return (
    <g>
      {/* Panel frame — tilted look via transform */}
      <motion.rect
        x={panelX - 4}
        y={panelY - 4}
        width={cols * (cw + gap) + 6}
        height={rows * (ch + gap) + 6}
        rx={3}
        fill="none"
        stroke={active ? C.orange : "#333"}
        strokeWidth={1.5}
        animate={{ stroke: active ? C.orange : "#333" }}
        transition={{ duration: 0.5 }}
      />
      {/* Panel stand */}
      <line
        x1={panelX + (cols * (cw + gap)) / 2}
        y1={panelY + rows * (ch + gap) + 4}
        x2={panelX + (cols * (cw + gap)) / 2}
        y2={panelY + rows * (ch + gap) + 20}
        stroke="#333"
        strokeWidth={2}
      />
      <line
        x1={panelX + 20}
        y1={panelY + rows * (ch + gap) + 20}
        x2={panelX + (cols * (cw + gap)) - 20}
        y2={panelY + rows * (ch + gap) + 20}
        stroke="#333"
        strokeWidth={2}
      />
      {/* Glow behind panel */}
      {active && (
        <motion.rect
          x={panelX - 10}
          y={panelY - 10}
          width={cols * (cw + gap) + 18}
          height={rows * (ch + gap) + 18}
          rx={6}
          fill="none"
          stroke={C.orange}
          strokeWidth={0.5}
          opacity={0.3}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {cells}
      {/* Label */}
      <text
        x={panelX + (cols * (cw + gap)) / 2}
        y={panelY - 14}
        textAnchor="middle"
        fill={active ? C.soft : "#444"}
        fontSize={9}
        fontFamily="monospace"
      >
        SOLAR PANEL
      </text>
    </g>
  );
}

function GridNode({ active }: { active: boolean }) {
  const cx = 340;
  const cy = 265;
  return (
    <g>
      {/* Outer ring */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={22}
        fill="none"
        stroke={active ? C.orange : "#333"}
        strokeWidth={1.5}
        animate={{
          r: active ? [22, 26, 22] : 22,
          stroke: active ? C.orange : "#333",
        }}
        transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
      />
      {/* Core */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={10}
        fill={active ? C.orange : C.dim}
        animate={{
          fill: active ? C.orange : C.dim,
          r: active ? [10, 13, 10] : 10,
        }}
        transition={{ duration: 1.5, repeat: active ? Infinity : 0 }}
      />
      {/* Lightning bolt icon */}
      <motion.text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill={active ? C.bg : "#444"}
        fontSize={12}
        fontWeight="bold"
      >
        ⚡
      </motion.text>
      {/* Label */}
      <text
        x={cx}
        y={cy - 30}
        textAnchor="middle"
        fill={active ? C.soft : "#444"}
        fontSize={9}
        fontFamily="monospace"
      >
        GRID NODE
      </text>
      {/* Glow */}
      {active && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={30}
          fill="url(#nodeGlow)"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </g>
  );
}

function House({
  x,
  y,
  label,
  powered,
}: {
  x: number;
  y: number;
  label: string;
  powered: boolean;
}) {
  return (
    <g>
      {/* Roof */}
      <polygon
        points={`${x},${y - 25} ${x - 28},${y} ${x + 28},${y}`}
        fill={powered ? "#1a1a1a" : C.dim}
        stroke={powered ? C.orange : "#333"}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x - 24}
        y={y}
        width={48}
        height={35}
        fill={powered ? "#0d0d0d" : C.dim}
        stroke={powered ? C.orange : "#333"}
        strokeWidth={1}
        rx={1}
      />
      {/* Door */}
      <rect x={x - 5} y={y + 18} width={10} height={17} fill="#1a1a1a" rx={1} />
      {/* Windows */}
      <motion.rect
        x={x - 18}
        y={y + 6}
        width={10}
        height={9}
        rx={1}
        fill={C.dim}
        animate={{ fill: powered ? C.soft : C.dim }}
        transition={{ duration: 0.6 }}
      />
      <motion.rect
        x={x + 8}
        y={y + 6}
        width={10}
        height={9}
        rx={1}
        fill={C.dim}
        animate={{ fill: powered ? C.soft : C.dim }}
        transition={{ duration: 0.6, delay: 0.15 }}
      />
      {/* Window glow */}
      {powered && (
        <>
          <motion.rect
            x={x - 20}
            y={y + 4}
            width={14}
            height={13}
            rx={2}
            fill="none"
            stroke={C.soft}
            strokeWidth={0.5}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.rect
            x={x + 6}
            y={y + 4}
            width={14}
            height={13}
            rx={2}
            fill="none"
            stroke={C.soft}
            strokeWidth={0.5}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
      {/* Label */}
      <text
        x={x}
        y={y + 50}
        textAnchor="middle"
        fill={powered ? C.soft : "#444"}
        fontSize={8}
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  );
}

function Building({
  x,
  y,
  powered,
}: {
  x: number;
  y: number;
  powered: boolean;
}) {
  const winRows = 5;
  const winCols = 3;
  const ww = 8;
  const wh = 6;
  const gapX = 4;
  const gapY = 5;
  const bw = winCols * (ww + gapX) + gapX;
  const bh = 70;

  return (
    <g>
      {/* Building body */}
      <rect
        x={x - bw / 2}
        y={y - bh + 35}
        width={bw}
        height={bh}
        fill={powered ? "#0d0d0d" : C.dim}
        stroke={powered ? C.orange : "#333"}
        strokeWidth={1}
        rx={2}
      />
      {/* Antenna */}
      <line
        x1={x}
        y1={y - bh + 35}
        x2={x}
        y2={y - bh + 20}
        stroke={powered ? C.orange : "#333"}
        strokeWidth={1}
      />
      <circle cx={x} cy={y - bh + 18} r={2} fill={powered ? C.orange : "#333"} />
      {/* Windows grid */}
      {Array.from({ length: winRows }).map((_, r) =>
        Array.from({ length: winCols }).map((_, c) => (
          <motion.rect
            key={`bw-${r}-${c}`}
            x={x - bw / 2 + gapX + c * (ww + gapX)}
            y={y - bh + 40 + r * (wh + gapY)}
            width={ww}
            height={wh}
            rx={0.5}
            fill={C.dim}
            animate={{
              fill: powered ? (Math.random() > 0.3 ? C.soft : C.dim) : C.dim,
            }}
            transition={{
              duration: 0.5,
              delay: powered ? r * 0.12 + c * 0.06 : 0,
            }}
          />
        ))
      )}
      {/* Label */}
      <text
        x={x}
        y={y + 50}
        textAnchor="middle"
        fill={powered ? C.soft : "#444"}
        fontSize={8}
        fontFamily="monospace"
      >
        BUILDING
      </text>
    </g>
  );
}

/* ── Animated energy path with dash-offset ── */
function EnergyLine({
  d,
  active,
  delay = 0,
}: {
  d: string;
  active: boolean;
  delay?: number;
}) {
  return (
    <>
      {/* Dim base path */}
      <path d={d} fill="none" stroke="#1a1a1a" strokeWidth={1.5} strokeLinecap="round" />
      {/* Animated flow */}
      <AnimatePresence>
        {active && (
          <motion.path
            d={d}
            fill="none"
            stroke={C.orange}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray="8 12"
            initial={{ strokeDashoffset: 200, opacity: 0 }}
            animate={{ strokeDashoffset: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              strokeDashoffset: { duration: 1.5, delay, ease: "linear", repeat: Infinity },
              opacity: { duration: 0.4, delay },
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Particles travelling from sun to panel ── */
function EnergyParticles({ active }: { active: boolean }) {
  if (!active) return null;

  const particles = [0, 1, 2, 3, 4];
  return (
    <>
      {particles.map((i) => (
        <motion.circle
          key={`p-${i}`}
          r={3}
          fill={C.orange}
          filter="url(#particleGlow)"
          initial={{ cx: 520, cy: 85, opacity: 0 }}
          animate={{
            cx: [520, 440, 370, 340],
            cy: [85, 115, 145, 160],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

/* ── AI Monitoring floating label ── */
function AILabel({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.g
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.rect
            x={265}
            y={290}
            width={150}
            height={24}
            rx={12}
            fill={C.bg}
            stroke={C.orange}
            strokeWidth={0.8}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.text
            x={340}
            y={306}
            textAnchor="middle"
            fill={C.orange}
            fontSize={9}
            fontFamily="monospace"
            letterSpacing={1.5}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            AI MONITORING ACTIVE
          </motion.text>
        </motion.g>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════
   Main Scene
   ═══════════════════════════════════ */
export default function SolarEnergyScene() {
  const [sunActive, setSunActive] = useState(false);
  const [phase, setPhase] = useState(0);
  // Phases: 0=idle  1=particles  2=panel  3=grid  4=houses  5=building  6=ai

  // When sun is clicked ON, stagger-activate each phase
  useEffect(() => {
    if (!sunActive) {
      setPhase(0);
      return;
    }

    // Stagger the activation so it cascades visually
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 300));   // particles
    timers.push(setTimeout(() => setPhase(2), 1000));  // panel
    timers.push(setTimeout(() => setPhase(3), 1800));  // grid
    timers.push(setTimeout(() => setPhase(4), 2500));  // houses
    timers.push(setTimeout(() => setPhase(5), 3200));  // building
    timers.push(setTimeout(() => setPhase(6), 3800));  // ai label

    return () => timers.forEach(clearTimeout);
  }, [sunActive]);

  const handleSunToggle = useCallback(() => {
    setSunActive((prev) => !prev);
  }, []);

  /* ── Paths ── */
  const panelToNode = "M 340 210 C 340 225, 340 240, 340 243";
  const nodeToHouse1 = "M 318 265 C 260 280, 200 320, 180 345";
  const nodeToHouse2 = "M 340 287 C 340 310, 340 325, 340 345";
  const nodeToBuilding = "M 362 265 C 420 280, 470 320, 500 330";

  return (
    <svg
      viewBox="0 0 680 440"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Sun body gradient — warm center to orange edge */}
        <radialGradient id="sunBodyGrad" cx="40%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFD080" stopOpacity={1} />
          <stop offset="40%" stopColor={C.orange} stopOpacity={1} />
          <stop offset="100%" stopColor="#CC5500" stopOpacity={1} />
        </radialGradient>
        {/* Sun corona glow */}
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.orange} stopOpacity={0.6} />
          <stop offset="60%" stopColor={C.orange} stopOpacity={0.15} />
          <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
        </radialGradient>
        {/* Sun wide ambient glow */}
        <radialGradient id="sunOuterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.orange} stopOpacity={0.25} />
          <stop offset="50%" stopColor={C.orange} stopOpacity={0.06} />
          <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
        </radialGradient>
        {/* Grid node glow */}
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.orange} stopOpacity={0.3} />
          <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
        </radialGradient>
        {/* Particle glow filter */}
        <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background subtle grid */}
      <pattern id="bgGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke={C.white} strokeWidth={0.15} strokeOpacity={0.08} />
      </pattern>
      <rect width="680" height="440" fill="url(#bgGrid)" />

      {/* ── BACKGROUND FLOATING DOTS ── */}
      <BackgroundParticles />

      {/* ── SUN ── */}
      <Sun active={sunActive} onToggle={handleSunToggle} />

      {/* ── ENERGY PARTICLES (sun → panel) ── */}
      <EnergyParticles active={phase >= 1} />

      {/* ── SOLAR PANEL ── */}
      <SolarPanel active={phase >= 2} />

      {/* ── Energy line: panel → node ── */}
      <EnergyLine d={panelToNode} active={phase >= 2} delay={0.3} />

      {/* ── GRID NODE ── */}
      <GridNode active={phase >= 3} />

      {/* ── Energy lines: node → destinations ── */}
      <EnergyLine d={nodeToHouse1} active={phase >= 4} delay={0} />
      <EnergyLine d={nodeToHouse2} active={phase >= 4} delay={0.2} />
      <EnergyLine d={nodeToBuilding} active={phase >= 5} delay={0} />

      {/* ── HOUSES & BUILDING ── */}
      <House x={180} y={365} label="HOUSE 1" powered={phase >= 4} />
      <House x={340} y={365} label="HOUSE 2" powered={phase >= 4} />
      <Building x={500} y={365} powered={phase >= 5} />

      {/* ── AI Label ── */}
      <AILabel visible={phase >= 6} />
    </svg>
  );
}
