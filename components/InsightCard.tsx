"use client";

import { useState } from "react";
import { type Insight } from "@/lib/mockData";
import { AlertTriangle, AlertCircle, Info, Clock, Wrench, ChevronDown, ChevronUp, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: Insight;
}

const severityConfig = {
  high: {
    border: "border-[#FF4D4F]/30 bg-card hover:border-[#FF4D4F]/50",
    badge: "bg-[#FF4D4F]/20 text-[#FF4D4F]",
    icon: AlertTriangle,
    iconColor: "text-[#FF4D4F]",
    dot: "bg-[#FF4D4F]",
    label: "High Risk",
  },
  medium: {
    border: "border-[#FFB020]/30 bg-card hover:border-[#FFB020]/50",
    badge: "bg-[#FFB020]/20 text-[#FFB020]",
    icon: AlertCircle,
    iconColor: "text-[#FFB020]",
    dot: "bg-[#FFB020]",
    label: "Medium Risk",
  },
  low: {
    border: "border-primary/30 bg-card hover:border-primary/50",
    badge: "bg-primary/20 text-primary",
    icon: Info,
    iconColor: "text-primary",
    dot: "bg-primary",
    label: "Low Priority",
  },
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function InsightCard({ insight }: InsightCardProps) {
  const normalizedSeverity = (insight.severity || "low").toLowerCase() as keyof typeof severityConfig;
  const cfg = severityConfig[normalizedSeverity] || severityConfig.low;
  const Icon = cfg.icon;

  const [isExpanded, setIsExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ rootCause: string; suggestedSolution: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (analysisResult) return; // Already analyzed
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`/api/explain/${insight.inverterId}`, {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to analyze root cause");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze = insight.severity === "high" || insight.severity === "medium";

  return (
    <div
      className={cn(
        "bg-card border rounded-xl shadow-sm transition-all print:border-gray-300 print:break-inside-avoid print:shadow-none",
        cfg.border,
        isExpanded ? "ring-2 ring-primary/20" : "hover:shadow-md"
      )}
    >
      <div 
        className={cn("p-5 flex items-start gap-4", canAnalyze && "cursor-pointer print:cursor-auto")} 
        onClick={() => {
          if (canAnalyze) {
            setIsExpanded(!isExpanded);
            if (!isExpanded && !analysisResult && !analyzing) {
              handleAnalyze();
            }
          }
        }}
      >
        <div className={cn("mt-0.5 flex-shrink-0", cfg.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground print:text-black">{insight.title}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold print:text-xs", cfg.badge)}>
                {cfg.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-secondary text-muted-foreground print:bg-transparent print:border print:border-gray-200">
                {insight.inverterId}
              </span>
            </div>
            {canAnalyze && (
              <div className="text-muted-foreground print:hidden">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed print:text-gray-700">{insight.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground print:text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {formatTimestamp(insight.timestamp)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium print:text-gray-700">
              <Wrench className="w-3.5 h-3.5 text-primary print:text-gray-500" />
              {insight.actionRequired}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable RAG Section */}
      {isExpanded && canAnalyze && (
        <div className="px-5 pb-5 border-t border-border pt-4 bg-secondary/30 rounded-b-xl print:bg-transparent print:border-t-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground print:text-black">AI Root Cause Analysis (RAG)</h4>
          </div>

          {analyzing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-background rounded-lg border border-border print:hidden">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Querying Knowledge Base...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              Failed to analyze: {error}
            </div>
          ) : analysisResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg border border-border print:border-gray-200 print:bg-white">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider print:text-gray-500">Diagnosed Root Cause</span>
                <p className="text-sm text-foreground mt-1 leading-relaxed print:text-gray-800">{analysisResult.rootCause}</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 print:border-gray-200 print:bg-white">
                <span className="text-xs font-bold text-primary uppercase tracking-wider print:text-gray-500">Suggested Solution</span>
                <p className="text-sm text-foreground mt-1 leading-relaxed print:text-gray-800">{analysisResult.suggestedSolution}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
