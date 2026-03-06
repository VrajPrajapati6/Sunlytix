"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="w-full flex items-center justify-between px-8 lg:px-12 h-20">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="/favicon.png"
            alt="Sunlytix Logo"
            width={44}
            height={44}
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <span className="text-white font-bold text-2xl leading-tight tracking-tight">
              Sunlytix
            </span>
            <span className="text-xs text-gray-500 leading-tight">
              Predict. Prevent. Power the Sun.
            </span>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth"
            className="px-6 py-2.5 text-base text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            Login
          </Link>
          <Link
            href="/auth"
            className="px-6 py-2.5 text-base font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(255,106,0,0.3)] transition-all"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
