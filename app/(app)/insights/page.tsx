"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Activity, Filter } from "lucide-react";
import InsightCard from "@/components/InsightCard";
import { getInsights } from "@/services/api";
import { mockInsights, type Insight } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type Filter = "all" | "high" | "medium" | "low";

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getInsights()
      .then((data) => setInsights(data.length > 0 ? data : mockInsights))
      .catch(() => {
        console.warn("API unavailable — using mock data");
        setInsights(mockInsights);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? insights : insights.filter((i) => i.severity === filter);
  const counts = {
    all: insights.length,
    high: insights.filter((i) => i.severity === "high").length,
    medium: insights.filter((i) => i.severity === "medium").length,
    low: insights.filter((i) => i.severity === "low").length,
  };

  const filterOptions: { key: Filter; label: string; style: string }[] = [
    { key: "all", label: `All (${counts.all})`, style: "text-foreground border-border hover:bg-white/5" },
    { key: "high", label: `High Risk (${counts.high})`, style: "text-[#FF4D4F] border-[#FF4D4F]/30 hover:bg-[#FF4D4F]/10" },
    { key: "medium", label: `Medium (${counts.medium})`, style: "text-[#FFB020] border-[#FFB020]/30 hover:bg-[#FFB020]/10" },
    { key: "low", label: `Low (${counts.low})`, style: "text-primary border-primary/30 hover:bg-primary/10" },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" />
          AI Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generated operational insights and maintenance recommendations
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#FF4D4F]/10 border border-[#FF4D4F]/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#FF4D4F]">{counts.high}</p>
          <p className="text-xs text-[#FF4D4F]/70 mt-1">High Risk</p>
        </div>
        <div className="bg-[#FFB020]/10 border border-[#FFB020]/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#FFB020]">{counts.medium}</p>
          <p className="text-xs text-[#FFB020]/70 mt-1">Medium Risk</p>
        </div>
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{counts.low}</p>
          <p className="text-xs text-primary/70 mt-1">Low Priority</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {filterOptions.map(({ key, label, style }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              filter === key ? "ring-2 ring-primary/40 bg-secondary" : "",
              style
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Insights list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Activity className="w-8 h-8 animate-pulse text-primary" />
            <p className="text-sm">Analyzing plant data…</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No insights for this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
