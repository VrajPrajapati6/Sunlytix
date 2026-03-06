"use client";

import { BrainCircuit, Lightbulb, MessageSquareText } from "lucide-react";

const techCards = [
  {
    icon: <BrainCircuit className="w-5 h-5 text-orange-500" />,
    title: "Machine Learning Models",
    desc: "Predict inverter failures using patterns learned from historical telemetry data.",
  },
  {
    icon: <Lightbulb className="w-5 h-5 text-orange-500" />,
    title: "Explainable Predictions",
    desc: "Identify the key factors contributing to inverter risk scores.",
  },
  {
    icon: <MessageSquareText className="w-5 h-5 text-orange-500" />,
    title: "Intelligent Insight Generation",
    desc: "Generate operational summaries and answer plant health questions using retrieval-based AI insights.",
  },
];

export default function TechnologySection() {
  return (
    <section className="py-24 relative">
      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              Technology
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Powered by Advanced Data Intelligence
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {techCards.map((c, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/5 bg-black p-7 hover:border-orange-500/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500/15 transition-colors">
                {c.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {c.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
