"use client";

import Link from "next/link";
import { TrendingUp, Thermometer, ShieldAlert, MessageSquare } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Gradient glow behind hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm text-gray-400">
                AI-Powered Solar Monitoring
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight">
              Predict Solar Inverter Failures{" "}
              <span className="text-orange-500">Before They Happen</span>
            </h1>

            <p className="mt-8 text-lg lg:text-xl text-gray-400 leading-relaxed max-w-lg">
              Sunlytix helps solar plant operators detect inverter risks early
              and take preventive action before power generation is affected.
            </p>

            <div className="flex items-center gap-4 mt-10">
              <Link
                href="/dashboard"
                className="px-8 py-3.5 text-base font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-400 hover:shadow-[0_0_24px_rgba(255,106,0,0.35)] transition-all"
              >
                Get Started
              </Link>
              <Link
                href="#demo"
                className="px-8 py-3.5 text-base font-semibold text-white border border-white/20 rounded-lg hover:border-orange-500/60 hover:text-orange-400 transition-all"
              >
                View Demo
              </Link>
            </div>
          </div>

          {/* Right — Dashboard Preview */}
          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-gray-500">
                  Sunlytix Dashboard
                </span>
              </div>

              {/* Mock cards */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <MockStatCard
                  label="Risk Score"
                  value="0.82"
                  color="text-red-400"
                  icon={<ShieldAlert className="w-4 h-4" />}
                />
                <MockStatCard
                  label="Efficiency"
                  value="86%"
                  color="text-yellow-400"
                  icon={<TrendingUp className="w-4 h-4" />}
                />
                <MockStatCard
                  label="Temperature"
                  value="72°C"
                  color="text-orange-400"
                  icon={<Thermometer className="w-4 h-4" />}
                />
              </div>

              {/* Mock trend chart */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 mb-5">
                <p className="text-xs text-gray-500 mb-4">
                  Risk Trend — Last 7 Days
                </p>
                <div className="flex items-end gap-2 h-28">
                  {[35, 38, 42, 55, 60, 72, 82].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-orange-500/40 to-orange-500/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* AI explanation box */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="text-orange-400 font-medium">
                      AI Insight:
                    </span>{" "}
                    INV-21 shows sustained temperature rise and declining
                    efficiency. Recommend scheduling inspection within 48 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Glow underneath */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-orange-500/10 blur-2xl rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockStatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center gap-1.5 mb-3 text-gray-500">
        {icon}
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
