import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import type { ModuleUsage } from "@/lib/expansionMetrics";

interface UsageHeatmapProps {
  modules: ModuleUsage[];
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: "text-primary",
  down: "text-destructive",
  stable: "text-muted-foreground",
};

function getHeatColor(percent: number): string {
  if (percent >= 80) return "bg-primary";
  if (percent >= 60) return "bg-primary/70";
  if (percent >= 40) return "bg-primary/50";
  if (percent >= 20) return "bg-primary/30";
  return "bg-primary/10";
}

export function UsageHeatmap({ modules, className }: UsageHeatmapProps) {
  return (
    <Card className={cn("iara-card-glow", className)}>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Heatmap de Uso por Módulo</h3>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const TrendIcon = trendIcons[module.trend];
          return (
            <div key={module.module} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {module.module}
                  </span>
                  <TrendIcon
                    className={cn("h-3 w-3", trendColors[module.trend])}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Último uso: {new Date(module.lastUsed).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="font-mono-data text-sm font-semibold text-foreground">
                    {module.usagePercent}%
                  </span>
                </div>
              </div>
              
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    getHeatColor(module.usagePercent)
                  )}
                  style={{ width: `${module.usagePercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Intensidade de uso</p>
        <div className="flex items-center gap-1">
          <div className="flex-1 h-2 rounded bg-primary/10" />
          <div className="flex-1 h-2 rounded bg-primary/30" />
          <div className="flex-1 h-2 rounded bg-primary/50" />
          <div className="flex-1 h-2 rounded bg-primary/70" />
          <div className="flex-1 h-2 rounded bg-primary" />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">Baixo</span>
          <span className="text-[10px] text-muted-foreground">Alto</span>
        </div>
      </div>
    </Card>
  );
}
