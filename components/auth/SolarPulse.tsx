"use client";

import { motion } from "framer-motion";

export default function SolarPulse() {
  const rings = [0, 1, 2, 3, 4];

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Center glow */}
      <div className="absolute w-32 h-32 rounded-full bg-orange-500/10 blur-3xl" />

      {/* Expanding pulse rings */}
      {rings.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-orange-500/20"
          initial={{ width: 40, height: 40, opacity: 0.6 }}
          animate={{
            width: [40, 500],
            height: [40, 500],
            opacity: [0.4, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "linear",
          }}
        />
      ))}

      {/* Inner static glow */}
      <motion.div
        className="absolute w-16 h-16 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,106,0,0.3) 0%, rgba(255,106,0,0) 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Orbiting dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute w-2 h-2 rounded-full bg-orange-400"
          style={{
            boxShadow: "0 0 10px rgba(255,106,0,0.5)",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-orange-400"
            style={{
              transform: `translateX(${80 + i * 40}px)`,
              boxShadow: "0 0 8px rgba(255,106,0,0.6)",
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
