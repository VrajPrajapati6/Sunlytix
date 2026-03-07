"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Loader2, Sparkles, AlertTriangle, AlertCircle, Info, Activity, Wrench } from "lucide-react";
import { type Insight } from "@/lib/mockData";
import { cn } from "@/lib/utils";

interface InsightTableProps {
  insights: Insight[];
}

const severityConfig = {
  high: {
    badge: "bg-orange-500/20 text-orange-500 border border-orange-500/30",
    label: "High Risk",
  },
  medium: {
    badge: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    label: "Medium Risk",
  },
  low: {
    badge: "bg-white/5 text-gray-400 border border-white/10",
    label: "Healthy",
  },
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

type SortField = keyof Pick<Insight, "id" | "title" | "inverterId" | "severity" | "timestamp" | "actionRequired">;
type SortDir = "asc" | "desc";

function InsightRow({ insight, index }: { insight: Insight; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ rootCause: string; suggestedSolution: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedSeverity = (insight.severity || "low").toLowerCase() as keyof typeof severityConfig;
  const cfg = severityConfig[normalizedSeverity] || severityConfig.low;
  
  const canAnalyze = insight.severity === "high" || insight.severity === "medium";

  async function handleAnalyze() {
    if (analysisResult) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/explain/${insight.inverterId}`, { method: "POST" });
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

  const toggleExpand = () => {
    if (!canAnalyze) return;
    setIsExpanded(!isExpanded);
    if (!isExpanded && !analysisResult && !analyzing) {
      handleAnalyze();
    }
  };

  return (
    <>
      <tr
        onClick={toggleExpand}
        className={cn(
          "border-b border-border last:border-0 transition-colors",
          canAnalyze ? "cursor-pointer hover:bg-white/10" : "hover:bg-white/[0.05]",
          index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]",
          isExpanded ? "bg-white/[0.03]" : ""
        )}
      >
        <td className="px-4 py-3 font-semibold text-foreground max-w-[200px] truncate" title={insight.title}>
          {insight.title}
        </td>
        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
          <div className="flex flex-col">
            <span className="text-foreground">{insight.inverterId}</span>
            <span className="text-muted-foreground opacity-70">{insight.plant}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]" title={insight.description}>
          {insight.description}
        </td>
        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
          {formatTimestamp(insight.timestamp)}
        </td>
        <td className="px-4 py-3">
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", cfg.badge)}>
            {cfg.label}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          {canAnalyze && (
            <div className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          )}
        </td>
      </tr>
      {isExpanded && canAnalyze && (
        <tr className={cn(
          "border-b border-border",
          index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
        )}>
          <td colSpan={6} className="p-0">
            <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <h4 className="text-sm font-bold text-foreground">AI Root Cause Analysis (RAG)</h4>
              </div>

              {analyzing ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground bg-background py-3 px-5 rounded-lg border border-border w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="font-medium">Querying Knowledge Base...</span>
                </div>
              ) : error ? (
                <div className="text-sm text-orange-500 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 max-w-2xl">
                  Failed to analyze: {error}
                </div>
              ) : analysisResult ? (
                <div className="space-y-3 max-w-3xl">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Diagnosed Root Cause</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{analysisResult.rootCause}</p>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Wrench className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Suggested Solution</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{analysisResult.suggestedSolution}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function InsightTable({ insights }: InsightTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "timestamp" || field === "severity" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    
    // Severity weight for sorting
    const sevWeight = { high: 3, medium: 2, low: 1 };
    
    return insights
      .filter(
        (inv) =>
          inv.title.toLowerCase().includes(q) ||
          inv.inverterId.toLowerCase().includes(q) ||
          inv.description.toLowerCase().includes(q) ||
          inv.actionRequired.toLowerCase().includes(q) ||
          (inv.severity || "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortField === "severity") {
          const wA = sevWeight[(a.severity as keyof typeof sevWeight) || "low"];
          const wB = sevWeight[(b.severity as keyof typeof sevWeight) || "low"];
          const cmp = wA - wB;
          return sortDir === "asc" ? cmp : -cmp;
        }
        
        if (sortField === "timestamp") {
          const tA = new Date(a.timestamp).getTime();
          const tB = new Date(b.timestamp).getTime();
          const cmp = tA - tB;
          return sortDir === "asc" ? cmp : -cmp;
        }
        
        if (sortField === "inverterId") {
          const cmp = a.inverterId.localeCompare(b.inverterId);
          if (cmp !== 0) return sortDir === "asc" ? cmp : -cmp;
          const cmpPlant = (a.plant || "").localeCompare(b.plant || "");
          return sortDir === "asc" ? cmpPlant : -cmpPlant;
        }

        const av = a[sortField] || "";
        const bv = b[sortField] || "";
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [insights, search, sortField, sortDir]);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40 ml-1.5" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary ml-1.5" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary ml-1.5" />
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search insights..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-white placeholder:text-gray-500 transition-all duration-200"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Showing {filtered.length} of {insights.length} insights
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.02]">
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center">
                  Title
                  <SortIcon field="title" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort("inverterId")}
              >
                <div className="flex items-center">
                  Inverter / Plant
                  <SortIcon field="inverterId" />
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort("timestamp")}
              >
                <div className="flex items-center">
                  Timestamp
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort("severity")}
              >
                <div className="flex items-center">
                  Severity
                  <SortIcon field="severity" />
                </div>
              </th>
              <th className="w-8 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((insight, idx) => (
              <InsightRow key={insight.id} insight={insight} index={idx} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No insights match your search.
          </div>
        )}
      </div>
    </div>
  );
}
