"use client";

import { MessageSquare, Bot, User } from "lucide-react";

const questions = [
  "Which inverters have the highest risk today?",
  "Why is inverter INV-21 showing abnormal behavior?",
  "What maintenance action should be taken?",
];

export default function AssistantSection() {
  return (
    <section className="py-24">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-12">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ask Questions About Your Solar Plant
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            An intelligent AI assistant that understands your plant data and
            provides actionable answers.
          </p>
        </div>

        {/* Chat mockup */}
        <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl shadow-black/50">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-white/[0.01]">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Sunlytix AI Assistant
              </p>
              <p className="text-[10px] text-green-400">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4">
            {/* User questions */}
            {questions.map((q, i) => (
              <div key={i} className="flex justify-end">
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className="rounded-2xl rounded-tr-md bg-orange-500/10 border border-orange-500/10 px-4 py-2.5">
                    <p className="text-sm text-gray-200">{q}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}

            {/* AI response */}
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/5 px-4 py-3">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Based on today&apos;s telemetry data,{" "}
                    <span className="text-orange-400 font-medium">INV-21</span>{" "}
                    has the highest risk score of{" "}
                    <span className="text-red-400 font-medium">0.82</span>. The
                    primary contributing factors are elevated module temperature
                    (72°C) and declining conversion efficiency (86%). I recommend
                    scheduling a thermal inspection and checking the cooling
                    system within the next 24–48 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
              <input
                type="text"
                placeholder="Ask about your solar plant..."
                className="flex-1 bg-transparent text-sm text-gray-400 placeholder-gray-600 outline-none"
                readOnly
              />
              <button className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center hover:bg-orange-400 transition-colors">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
