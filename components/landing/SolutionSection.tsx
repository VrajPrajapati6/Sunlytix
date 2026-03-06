"use client";

import { ShieldCheck, Eye, BellRing } from "lucide-react";

const features = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-orange-500" />,
    title: "Early Risk Detection",
    desc: "Identify performance degradation days before a shutdown.",
  },
  {
    icon: <Eye className="w-5 h-5 text-orange-500" />,
    title: "Operational Insights",
    desc: "Understand why an inverter is behaving abnormally.",
  },
  {
    icon: <BellRing className="w-5 h-5 text-orange-500" />,
    title: "Actionable Alerts",
    desc: "Receive clear maintenance guidance for high-risk inverters.",
  },
];

export default function SolutionSection() {
  return (
    <section className="py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            A Smarter Way to Monitor Solar Inverters
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Sunlytix analyzes inverter telemetry data and identifies early warning
            signs so operators can take action before failures occur.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-7 hover:border-orange-500/20 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
            >
              {/* Subtle corner glow */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
