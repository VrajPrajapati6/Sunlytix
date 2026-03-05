"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sun } from "lucide-react";
import { askAssistant } from "@/services/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const STARTER_SUGGESTIONS = [
  "Which inverter has the highest risk?",
  "Why is INV-21 degrading?",
  "Which inverter should be inspected first?",
  "Give me a plant overview",
];

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Simple markdown-like formatter for bold text
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm the **Sunlytix AI Assistant**. I can help you analyze inverter health, predict failures, and provide maintenance recommendations.\n\nTry asking about a specific inverter or the overall plant status.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const answer = await askAssistant(q);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answer,
        timestamp: new Date(),
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#121826] border border-[#2A3448] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2A3448] bg-[#1A2236]/80 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-full bg-[#4F8CFF]/10 flex items-center justify-center">
          <Sun className="w-5 h-5 text-[#4F8CFF]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Sunlytix AI Assistant</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Online — Powered by predictive ML
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5",
                msg.role === "user"
                  ? "bg-[#4F8CFF] text-white"
                  : "bg-[#1A2236] text-foreground"
              )}
            >
              {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed whitespace-pre-line shadow-sm",
                msg.role === "user"
                  ? "bg-[#4F8CFF] text-white rounded-tr-sm"
                  : "bg-[#1A2236] text-[#E6EAF2] rounded-tl-sm border border-[#2A3448]"
              )}
            >
              {renderContent(msg.content)}
              <p
                className={cn(
                  "text-[10px] mt-1.5",
                  msg.role === "user" ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <div className="w-7 h-7 rounded-full bg-[#1A2236] flex items-center justify-center mt-0.5">
              <Bot className="w-3.5 h-3.5 text-foreground" />
            </div>
            <div className="bg-[#1A2236] border border-[#2A3448] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-[#4F8CFF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-[#4F8CFF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-[#4F8CFF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3">
          <div className="flex flex-col gap-2">
            {STARTER_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="w-full text-left text-sm px-4 py-3 rounded-lg bg-[#1A2236] text-[#E6EAF2] border border-[#2A3448] hover:bg-[#26314A] hover:border-[#4F8CFF] transition-all duration-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-[#2A3448] bg-[#121826]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about inverter health, risk predictions..."
            disabled={loading}
            className="flex-1 px-4 py-3 text-sm bg-[#1A2236] border border-[#2A3448] rounded-xl outline-none focus:ring-1 focus:ring-[#4F8CFF] text-[#E6EAF2] placeholder:text-[#6B7280] disabled:opacity-50 transition-all duration-200"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-[#4F8CFF] text-white hover:bg-[#3A74E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
