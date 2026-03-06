"use client";

import { Upload, BarChart3, ShieldAlert, ClipboardCheck } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: <Upload className="w-5 h-5 text-orange-500" />,
    title: "Upload Plant Data",
    desc: "Upload inverter telemetry data or connect monitoring systems.",
  },
  {
    num: "02",
    icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
    title: "Data Analysis",
    desc: "Sunlytix processes telemetry signals to detect abnormal patterns.",
  },
  {
    num: "03",
    icon: <ShieldAlert className="w-5 h-5 text-orange-500" />,
    title: "Risk Prediction",
    desc: "Each inverter receives a risk score indicating the likelihood of failure.",
  },
  {
    num: "04",
    icon: <ClipboardCheck className="w-5 h-5 text-orange-500" />,
    title: "Operator Guidance",
    desc: "The platform generates clear explanations and recommended actions.",
  },
];

export default function StepsSection() {
  return (
    <section className="py-24 relative">
      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
        backgroundSize: "50px 50px",
      }} />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-14">
          How Sunlytix Works
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent z-0" />
              )}

                <div className="relative rounded-2xl border border-white/5 bg-black p-6 hover:border-orange-500/20 transition-all duration-300">
                <span className="text-[10px] font-bold tracking-[0.2em] text-orange-500/60 uppercase mb-3 block">
                  Step {s.num}
                </span>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/15 transition-colors">
                  {s.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
