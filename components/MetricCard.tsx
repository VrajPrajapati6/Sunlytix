import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "healthy" | "medium" | "high";
  trend?: { value: string; positive: boolean };
}

const variantStyles = {
  default: {
    card: "bg-card border-border",
    icon: "bg-primary/20 text-primary shadow-[0_0_15px_rgba(79,140,255,0.3)]",
    value: "text-foreground",
  },
  healthy: {
    card: "bg-card border-[#00E5A8]/20",
    icon: "bg-[#00E5A8]/20 text-[#00E5A8] shadow-[0_0_15px_rgba(0,229,168,0.3)]",
    value: "text-[#00E5A8]",
  },
  medium: {
    card: "bg-card border-[#FFB020]/20",
    icon: "bg-[#FFB020]/20 text-[#FFB020] shadow-[0_0_15px_rgba(255,176,32,0.3)]",
    value: "text-[#FFB020]",
  },
  high: {
    card: "bg-card border-[#FF4D4F]/30",
    icon: "bg-[#FF4D4F]/20 text-[#FF4D4F] shadow-[0_0_15px_rgba(255,77,79,0.4)]",
    value: "text-[#FF4D4F]",
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  trend,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-xl border p-5 shadow-sm flex items-start gap-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1",
        styles.card
      )}
    >
      <div className={cn("p-2.5 rounded-lg flex-shrink-0", styles.icon)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
        <p className={cn("text-3xl font-bold mt-1 leading-none", styles.value)}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
        {trend && (
          <p
            className={cn(
              "text-xs font-medium mt-1.5",
              trend.positive ? "text-[#00E5A8]" : "text-[#FF4D4F]"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
