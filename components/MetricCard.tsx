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
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  healthy: {
    card: "bg-card border-green-200 dark:border-green-800",
    icon: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    value: "text-green-600 dark:text-green-400",
  },
  medium: {
    card: "bg-card border-yellow-200 dark:border-yellow-800",
    icon: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    value: "text-yellow-600 dark:text-yellow-400",
  },
  high: {
    card: "bg-card border-red-200 dark:border-red-800",
    icon: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
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
        "rounded-xl border p-5 shadow-sm flex items-start gap-4 transition-shadow hover:shadow-md",
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
              trend.positive ? "text-green-600 dark:text-green-400" : "text-red-500"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
