"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Send,
  Paperclip,
  FileUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { askAssistant } from "@/services/api";
import { mockAssistantResponses } from "@/lib/mockData";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/* ─── Suggestions ─── */
const SUGGESTIONS = [
  "Which inverter has the highest failure risk?",
  "Why is INV-21 degrading?",
  "Which inverter needs maintenance first?",
  "Give me a plant health overview",
];

/* ─── Helpers ─── */
function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    // Headings (lines ending with no bullet, all-caps or short bold lines)
    const trimmed = line.trim();
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return (
        <p key={li} className="font-semibold text-[#FF6A00] mt-3 mb-1">
          {trimmed.slice(2, -2)}
        </p>
      );
    }
    // Bullets
    if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      const bullet = trimmed.replace(/^[•\-]\s*/, "");
      return (
        <div key={li} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-[#FF6A00] mt-0.5 text-xs">●</span>
          <span>{renderInlineBold(bullet)}</span>
        </div>
      );
    }
    // Numbered lists
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <div key={li} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-[#FF6A00] font-medium text-xs mt-0.5 min-w-[16px]">
            {trimmed.match(/^\d+/)?.[0]}.
          </span>
          <span>{renderInlineBold(trimmed.replace(/^\d+\.\s*/, ""))}</span>
        </div>
      );
    }
    // Empty lines
    if (!trimmed) return <div key={li} className="h-2" />;
    // Normal text
    return <p key={li}>{renderInlineBold(trimmed)}</p>;
  });
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Prompt Input ─── */
interface PromptInputProps {
  large?: boolean;
  input: string;
  setInput: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSend: () => void;
  loading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

function PromptInput({ large = false, input, setInput, handleKeyDown, handleSend, loading, inputRef }: PromptInputProps) {
  return (
    <div
      className={cn(
        "bg-[#111111] border border-[#1F1F1F] rounded-2xl transition-all duration-300",
        "focus-within:border-[#FF6A00]/50 focus-within:shadow-[0_0_20px_rgba(255,106,0,0.1)]",
        large ? "p-5" : "p-3"
      )}
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Sunlytix AI about your solar plant..."
        disabled={loading}
        rows={1}
        className={cn(
          "w-full bg-transparent text-white placeholder:text-[#555] outline-none resize-none",
          "disabled:opacity-50 transition-all duration-200",
          large ? "text-base" : "text-sm"
        )}
      />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1F1F1F]">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <Paperclip className="w-3.5 h-3.5" />
            Attach telemetry data
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <FileUp className="w-3.5 h-3.5" />
            Import inverter report
          </button>
        </div>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className={cn(
            "flex items-center justify-center rounded-xl transition-all duration-200",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            large
              ? "w-10 h-10 bg-[#FF6A00] hover:bg-[#e65f00] text-white shadow-[0_0_15px_rgba(255,106,0,0.3)]"
              : "w-9 h-9 bg-[#FF6A00] hover:bg-[#e65f00] text-white"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1F1F1F] flex items-center justify-center flex-shrink-0">
        <Image src="/favicon.png" alt="AI" width={20} height={20} className="rounded-full" />
      </div>
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-2xl rounded-tl-md px-5 py-3.5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#FF6A00]">Sunlytix AI</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
          <span>Analyzing inverter data</span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 bg-[#FF6A00] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 bg-[#FF6A00] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 bg-[#FF6A00] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                     MAIN ASSISTANT PAGE                        */
/* ═══════════════════════════════════════════════════════════════ */

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

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
      let answer: string;
      try {
        answer = await askAssistant(q);
      } catch {
        const lowerQ = q.toLowerCase();
        if (lowerQ.includes("risk") || lowerQ.includes("highest")) {
          answer = mockAssistantResponses.risk;
        } else if (lowerQ.includes("inv-21") || lowerQ.includes("degrading") || lowerQ.includes("degrad")) {
          answer = lowerQ.includes("degrad") ? mockAssistantResponses.degrading : mockAssistantResponses["inv-21"];
        } else if (lowerQ.includes("inspect") || lowerQ.includes("first") || lowerQ.includes("maintenance")) {
          answer = mockAssistantResponses.inspect;
        } else if (lowerQ.includes("overview") || lowerQ.includes("plant") || lowerQ.includes("health")) {
          answer = mockAssistantResponses.overview;
        } else {
          answer = mockAssistantResponses.default;
        }
      }
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
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               EMPTY STATE — CENTERED PROMPT                 */
  /* ═══════════════════════════════════════════════════════════ */
  if (!hasConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-4.5rem)] relative overflow-hidden">
        {/* Radial background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle,rgba(255,106,0,0.06)_0%,transparent_70%)]" />
        </div>

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/favicon.png"
              alt="Sunlytix Logo"
              width={56}
              height={56}
              className="rounded-xl"
            />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center tracking-tight">
            Ask Sunlytix AI
          </h1>
          <p className="text-sm sm:text-base text-[#9CA3AF] mt-3 text-center max-w-md">
            Analyze inverter health, detect anomalies, and get maintenance insights.
          </p>

          {/* Prompt Input */}
          <div className="w-full max-w-[640px] mt-8">
            <PromptInput large input={input} setInput={setInput} handleKeyDown={handleKeyDown} handleSend={() => handleSend()} loading={loading} inputRef={inputRef} />
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-[640px]">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="group flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm text-white bg-[#111111] border border-[#1F1F1F] rounded-full hover:border-[#FF6A00]/60 hover:shadow-[0_0_12px_rgba(255,106,0,0.1)] transition-all duration-200"
              >
                <span>{s}</span>
                <ArrowRight className="w-3 h-3 text-[#555] group-hover:text-[#FF6A00] transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════ */
  /*               CHAT STATE — CONVERSATION VIEW                */
  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] relative overflow-hidden">
      {/* Radial background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(circle,rgba(255,106,0,0.04)_0%,transparent_70%)]" />
      </div>

      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#1F1F1F] bg-[#000000]/80 backdrop-blur-sm relative z-10">
        <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1F1F1F] flex items-center justify-center">
          <Image src="/favicon.png" alt="AI" width={20} height={20} className="rounded-full" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-1.5">
            Sunlytix AI
            <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" />
          </p>
          <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Online — Solar Monitoring Assistant
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 relative z-10">
        <div className="max-w-[900px] mx-auto space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-3 animate-fade-in-up",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#111111] border border-[#1F1F1F] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Image src="/favicon.png" alt="AI" width={20} height={20} className="rounded-full" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#FF6A00] text-white px-4 py-3 rounded-tr-md"
                    : "bg-[#111111] border border-[#1F1F1F] text-[#E5E5E5] px-5 py-4 rounded-tl-md"
                )}
              >
                <div className={msg.role === "assistant" ? "space-y-0.5" : ""}>
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
                {msg.role === "user" && (
                  <p className="text-[10px] text-white/60 mt-1.5 text-right">{formatTime(msg.timestamp)}</p>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#FF6A00] flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold">
                  U
                </div>
              )}
            </div>
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Bottom input bar */}
      <div className="px-4 py-3 border-t border-[#1F1F1F] bg-[#000000]/80 backdrop-blur-sm relative z-10">
        <div className="max-w-[900px] mx-auto">
          <PromptInput input={input} setInput={setInput} handleKeyDown={handleKeyDown} handleSend={() => handleSend()} loading={loading} inputRef={inputRef} />
        </div>
      </div>
    </div>
  );
}
