"use client";

import { AlertTriangle, BatteryLow, Search } from "lucide-react";

const problems = [
  {
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    title: "Reactive Monitoring",
    desc: "Most plants detect inverter problems only after alarms trigger.",
  },
  {
    icon: <BatteryLow className="w-5 h-5 text-orange-500" />,
    title: "Energy Loss",
    desc: "Unexpected inverter failures reduce power generation and plant efficiency.",
  },
  {
    icon: <Search className="w-5 h-5 text-orange-500" />,
    title: "Manual Investigation",
    desc: "Operators spend hours analyzing telemetry data to identify problems.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-24 relative">
      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          Why Solar Plants Need Better Failure Detection
        </h2>
        <p className="text-gray-500 text-center max-w-2xl mx-auto mb-14">
          Traditional monitoring approaches leave operators reacting to problems
          instead of preventing them.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/5 bg-black p-7 hover:border-orange-500/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500/15 transition-colors">
                {p.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
