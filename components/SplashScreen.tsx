"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const brandName = "SUNLYTIX";
const taglineParts = [
  { text: "Predict", color: "text-gray-300" },
  { text: "•", color: "text-orange-500" },
  { text: "Prevent", color: "text-gray-300" },
  { text: "•", color: "text-orange-500" },
  { text: "Power the Sun", color: "text-gray-300" },
];

// Floating particles component
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: Math.random() * 300 - 150,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-orange-500"
          style={{ width: p.size, height: p.size }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            x: p.x,
            y: p.y,
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay + 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 0: Logo appears (0s)
    // Phase 1: Brand name (0.8s after logo)
    // Phase 2: Tagline (after brand stagger completes ~1.8s)
    // Phase 3: Glow pulse (after tagline ~2.5s)
    // Phase 4: Fade out (after glow ~3.5s)

    const timers = [
      setTimeout(() => setPhase(1), 1100),   // Start brand name
      setTimeout(() => setPhase(2), 2200),   // Start tagline
      setTimeout(() => setPhase(3), 3200),   // Start glow pulse
      setTimeout(() => setPhase(4), 4200),   // Start fade out
      setTimeout(() => onComplete(), 5000),  // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 5 && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Particles */}
          <Particles />

          {/* Background radial glow */}
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,106,0,0.08) 0%, transparent 70%)",
            }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: phase >= 3 ? [1, 1.3, 1] : 1,
              opacity: phase >= 0 ? [0, 0.6, phase >= 3 ? 0.8 : 0.4] : 0,
            }}
            transition={{ duration: phase >= 3 ? 1.2 : 1.5, ease: "easeInOut" }}
          />

          {/* Logo */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            {/* Orange glow behind logo */}
            <motion.div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: "rgba(255,106,0,0.2)" }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: phase >= 3 ? [1, 1.5, 1.2] : 1,
                opacity: phase >= 3 ? [0.3, 0.6, 0] : 0.3,
              }}
              transition={{
                duration: phase >= 3 ? 1 : 0.8,
                ease: "easeInOut",
                delay: phase >= 3 ? 0 : 0.5,
              }}
            />
            <Image
              src="/favicon.png"
              alt="Sunlytix Logo"
              width={220}
              height={220}
              className="relative z-10 rounded-2xl"
              priority
            />
          </motion.div>

          {/* Brand Name */}
          <div className="relative z-10 mt-8 flex overflow-hidden">
            {brandName.split("").map((letter, i) => (
              <motion.span
                key={i}
                className={`text-6xl sm:text-7xl font-bold tracking-[0.2em] font-[var(--font-orbitron)] ${
                  letter === "S" || letter === "U" || letter === "N"
                    ? "text-orange-500"
                    : "text-white"
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  phase >= 1
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 30 }
                }
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: "easeOut",
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Orange underline */}
          <motion.div
            className="relative z-10 mt-3 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent"
            initial={{ width: 0, opacity: 0 }}
            animate={
              phase >= 1
                ? { width: 280, opacity: 1 }
                : { width: 0, opacity: 0 }
            }
            transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
          />

          {/* Tagline */}
          <motion.div
            className="relative z-10 mt-5 flex items-center gap-2"
            initial={{ opacity: 0, y: 15 }}
            animate={
              phase >= 2
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 15 }
            }
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {taglineParts.map((part, i) => (
              <motion.span
                key={i}
                className={`text-sm sm:text-base tracking-[0.2em] uppercase font-medium ${part.color}`}
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                {part.text}
              </motion.span>
            ))}
          </motion.div>

          {/* Bottom loading bar */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 4, ease: "easeInOut" }}
            />
          </motion.div>

          {/* Fade out overlay */}
          {phase >= 4 && (
            <motion.div
              className="absolute inset-0 bg-black z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
