import { type Insight } from "@/lib/mockData";
import { AlertTriangle, AlertCircle, Info, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  insight: Insight;
}

const severityConfig = {
  high: {
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    dot: "bg-red-500",
    label: "High Risk",
  },
  medium: {
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: AlertCircle,
    iconColor: "text-yellow-500",
    dot: "bg-yellow-500",
    label: "Medium Risk",
  },
  low: {
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Info,
    iconColor: "text-blue-500",
    dot: "bg-blue-500",
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
  const cfg = severityConfig[insight.severity];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow",
        cfg.border
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("mt-0.5 flex-shrink-0", cfg.iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", cfg.badge)}>
              {cfg.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-secondary text-muted-foreground">
              {insight.inverterId}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatTimestamp(insight.timestamp)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <Wrench className="w-3.5 h-3.5 text-primary" />
              {insight.actionRequired}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
