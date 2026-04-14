import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScoreBadgeProps {
  score: number;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, showIcon = true, size = "md", className }: ScoreBadgeProps) {
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  
  const styles = {
    high: {
      bg: "bg-primary/20 border-primary/30",
      text: "text-primary glow-text",
      icon: TrendingUp,
    },
    medium: {
      bg: "bg-warning/20 border-warning/30",
      text: "text-warning",
      icon: Minus,
    },
    low: {
      bg: "bg-muted border-border",
      text: "text-muted-foreground",
      icon: TrendingDown,
    },
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const Icon = styles[level].icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-mono-data font-semibold",
        styles[level].bg,
        sizes[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], styles[level].text)} />}
      <span className={styles[level].text}>{score}</span>
    </div>
  );
}
