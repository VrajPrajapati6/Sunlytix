"use client";

import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 relative">
      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
          Start Monitoring Your Solar Plant{" "}
          <span className="text-orange-500">Smarter</span>
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Join operators who prevent failures before they happen.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-7 py-3.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-400 hover:shadow-[0_0_30px_rgba(255,106,0,0.35)] transition-all"
          >
            Create Account
          </Link>
          <Link
            href="#demo"
            className="px-7 py-3.5 text-sm font-semibold text-white border border-white/20 rounded-lg hover:border-orange-500/60 hover:text-orange-400 transition-all"
          >
            Explore Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
