import { MessageSquare, Sparkles } from "lucide-react";
import ChatUI from "@/components/ChatUI";

export default function AssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#E6EAF2] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#4F8CFF]" />
          AI Assistant
        </h1>
        <p className="text-sm text-[#9AA4B2] mt-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#4F8CFF]" />
          Powered by Sunlytix predictive AI — Ask anything about your solar plant
        </p>
      </div>


      {/* Chat UI — takes remaining height */}
      <div className="flex-1 min-h-[500px]">
        <ChatUI />
      </div>
    </div>
  );
}
