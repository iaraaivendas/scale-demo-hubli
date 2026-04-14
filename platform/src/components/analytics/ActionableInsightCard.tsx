import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  AlertTriangle,
  UserMinus,
  Target,
  Building2,
  ArrowRight,
  Zap,
  Users,
} from "lucide-react";
import type { ActionableInsight } from "@/lib/expansionMetrics";

interface ActionableInsightCardProps {
  insight: ActionableInsight;
  onAction?: (insight: ActionableInsight) => void;
}

const insightConfig = {
  usage_peak: {
    icon: Zap,
    bgColor: "bg-destructive/10",
    iconColor: "text-destructive",
    borderColor: "border-destructive/30",
  },
  technical_maturity: {
    icon: Target,
    bgColor: "bg-info/10",
    iconColor: "text-info",
    borderColor: "border-info/30",
  },
  churn_risk: {
    icon: UserMinus,
    bgColor: "bg-warning/10",
    iconColor: "text-warning",
    borderColor: "border-warning/30",
  },
  demographic_fit: {
    icon: Building2,
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    borderColor: "border-primary/30",
  },
  upsell_ready: {
    icon: TrendingUp,
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    borderColor: "border-primary/30",
  },
  cross_sell: {
    icon: Users,
    bgColor: "bg-secondary/20",
    iconColor: "text-secondary-foreground",
    borderColor: "border-secondary/30",
  },
};

const severityColors = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-warning text-warning-foreground",
  low: "bg-muted text-muted-foreground",
};

export function ActionableInsightCard({ insight, onAction }: ActionableInsightCardProps) {
  const config = insightConfig[insight.type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "iara-card-glow relative overflow-hidden transition-all hover:shadow-lg",
        config.borderColor,
        "border-l-4"
      )}
    >
      {/* Severity Badge */}
      <div className="absolute top-3 right-3">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
            severityColors[insight.severity]
          )}
        >
          {insight.severity === 'high' ? 'Urgente' : insight.severity === 'medium' ? 'Atenção' : 'Info'}
        </span>
      </div>

      <div className="flex gap-4">
        {/* Icon */}
        <div className={cn("flex-shrink-0 rounded-xl p-3", config.bgColor)}>
          <Icon className={cn("h-6 w-6", config.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Signal */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sinal Detectado
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {insight.signal}
            </span>
          </div>

          {/* Insight */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.insight}
          </p>

          {/* Entity Info */}
          {insight.entityName && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {insight.entityType === 'client' ? 'Cliente:' : 'Lead:'}
              </span>
              <span className="text-sm font-medium text-foreground">
                {insight.entityName}
              </span>
              {insight.score && (
                <span className={cn(
                  "ml-2 px-2 py-0.5 rounded-full text-xs font-mono font-semibold",
                  insight.score >= 80 ? "bg-primary/20 text-primary" :
                  insight.score >= 60 ? "bg-warning/20 text-warning" :
                  "bg-muted text-muted-foreground"
                )}>
                  Score: {insight.score}
                </span>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              variant="iara"
              size="sm"
              className="gap-2"
              onClick={() => onAction?.(insight)}
            >
              {insight.actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
