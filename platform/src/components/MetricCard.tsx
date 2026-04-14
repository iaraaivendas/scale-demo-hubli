import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "warning" | "success";
  className?: string;
  subtitle?: string;
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  variant = "default",
  className,
  subtitle,
}: MetricCardProps) {
  const variants = {
    default: "border-border",
    primary: "border-primary/30 glow-border",
    warning: "border-warning/30",
    success: "border-primary/30",
  };

  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/20 text-primary",
    warning: "bg-warning/20 text-warning",
    success: "bg-primary/20 text-primary",
  };

  return (
    <div
      className={cn(
        "iara-card-glow group rounded-xl transition-all duration-200 hover:border-primary/50 hover:shadow-lg",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="metric-label">{label}</p>
          <p className={cn(
            "metric-value",
            variant === "primary" && "gradient-text-iara"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-lg p-2.5 transition-all duration-300 group-hover:scale-110",
            iconVariants[variant]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {typeof change === "number" && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              change >= 0 ? "text-primary" : "text-destructive"
            )}
          >
            {change >= 0 ? "+" : ""}{change}%
          </span>
          <span className="text-sm text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </div>
  );
}
