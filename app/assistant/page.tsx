import { MessageSquare, Sparkles } from "lucide-react";
import ChatUI from "@/components/ChatUI";

export default function AssistantPage() {
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          AI Assistant
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Powered by Sunlytix predictive AI — Ask anything about your solar plant
        </p>
      </div>

      {/* Example prompts banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-primary mb-2">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Which inverter has the highest risk?",
            "Why is INV-21 degrading?",
            "Which inverter should be inspected first?",
            "Give me a plant overview",
          ].map((q) => (
            <span
              key={q}
              className="px-2.5 py-1 bg-card border border-border rounded-full text-xs text-muted-foreground"
            >
              &ldquo;{q}&rdquo;
            </span>
          ))}
        </div>
      </div>

      {/* Chat UI — takes remaining height */}
      <div className="flex-1 min-h-[500px]">
        <ChatUI />
      </div>
    </div>
  );
}
