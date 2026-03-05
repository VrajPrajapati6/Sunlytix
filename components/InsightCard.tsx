import { type Insight } from "@/lib/mockData";
import { AlertTriangle, AlertCircle, Info, Clock, Wrench } from "lucide-react";
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
