"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";

const SolarEnergyScene = dynamic(
  () => import("@/components/auth/SolarEnergyScene"),
  { ssr: false }
);

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Panel — Form (40%) */}
      <div className="w-full lg:w-[40%] min-h-screen flex flex-col relative z-10">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Gradient overlay along right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-500/5 to-transparent hidden lg:block" />

        {/* Content */}
        <div className="relative flex flex-col flex-1 px-8 sm:px-12 lg:px-14 py-8">
          {/* Header — Logo */}
          <Link href="/" className="flex items-center gap-3 mb-auto">
            <Image
              src="/favicon.png"
              alt="Sunlytix"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className="text-white font-bold text-xl tracking-tight">
              Sunlytix
            </span>
          </Link>

          {/* Form Area */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-full max-w-sm">
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <LoginForm
                    key="login"
                    onSwitchToSignup={() => setMode("signup")}
                  />
                ) : (
                  <SignupForm
                    key="signup"
                    onSwitchToLogin={() => setMode("login")}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto text-center">
            <p className="text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} Sunlytix. AI-Powered Solar
              Monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* Divider line */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />

      {/* Right Panel — Visualization (60%) */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden items-center justify-center bg-black">
        <SolarEnergyScene />

        {/* Branding text */}
        <div className="absolute bottom-6 right-8">
          <p
            className="text-sm tracking-[0.3em] text-gray-600 font-[var(--font-orbitron)]"
          >
            SUNLYTIX
          </p>
        </div>
      </div>

      {/* Mobile scene — below form */}
      <div className="lg:hidden w-full h-[350px] bg-black">
        <SolarEnergyScene />
      </div>
    </div>
  );
}
