"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";

// Lazy-load below-the-fold sections for faster initial load
const ProblemSection = dynamic(() => import("@/components/landing/ProblemSection"));
const SolutionSection = dynamic(() => import("@/components/landing/SolutionSection"));
const StepsSection = dynamic(() => import("@/components/landing/StepsSection"));
const DashboardPreview = dynamic(() => import("@/components/landing/DashboardPreview"));
const TechnologySection = dynamic(() => import("@/components/landing/TechnologySection"));
const AssistantSection = dynamic(() => import("@/components/landing/AssistantSection"));
const CTASection = dynamic(() => import("@/components/landing/CTASection"));

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <motion.div
        className="min-h-screen bg-black text-white antialiased"
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
      <LandingNavbar />
      <HeroSection />

      {/* Divider */}
      <div className="w-full px-8 lg:px-12">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <ProblemSection />

      <div className="w-full px-8 lg:px-12">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <SolutionSection />
      <StepsSection />

      <div className="w-full px-8 lg:px-12">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <DashboardPreview />

      <div className="w-full px-8 lg:px-12">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <TechnologySection />
      <AssistantSection />

      <div className="w-full px-8 lg:px-12">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <CTASection />
    </motion.div>
    </>
  );
}
