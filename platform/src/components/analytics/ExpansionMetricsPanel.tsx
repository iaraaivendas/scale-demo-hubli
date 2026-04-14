import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  Zap,
  Users,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import type { ExpansionMetrics } from "@/lib/expansionMetrics";

interface ExpansionMetricsPanelProps {
  metrics: ExpansionMetrics;
  className?: string;
}

export function ExpansionMetricsPanel({ metrics, className }: ExpansionMetricsPanelProps) {
  const nrrStatus = metrics.nrr >= 110 ? 'excellent' : metrics.nrr >= 100 ? 'good' : 'warning';
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Métricas de Expansão
        </h2>
        <span className="text-xs text-muted-foreground">
          Atualizado agora
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NRR */}
        <Card className="iara-card-glow">
          <div className="flex items-start justify-between mb-2">
            <div className={cn(
              "rounded-lg p-2",
              nrrStatus === 'excellent' ? "bg-primary/20" :
              nrrStatus === 'good' ? "bg-info/20" : "bg-warning/20"
            )}>
              <TrendingUp className={cn(
                "h-5 w-5",
                nrrStatus === 'excellent' ? "text-primary" :
                nrrStatus === 'good' ? "text-info" : "text-warning"
              )} />
            </div>
            {metrics.nrr >= 100 && (
              <ArrowUpRight className="h-4 w-4 text-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            NRR
          </p>
          <p className={cn(
            "text-3xl font-bold font-mono-data mt-1",
            nrrStatus === 'excellent' ? "text-primary glow-text" :
            nrrStatus === 'good' ? "text-info" : "text-warning"
          )}>
            {metrics.nrr}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Net Revenue Retention
          </p>
        </Card>

        {/* Expansion MRR */}
        <Card className="iara-card-glow">
          <div className="flex items-start justify-between mb-2">
            <div className="rounded-lg p-2 bg-primary/20">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Expansion MRR
          </p>
          <p className="text-3xl font-bold text-primary font-mono-data mt-1">
            R$ {metrics.expansionMRR.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Upgrades + Cross-sells
          </p>
        </Card>

        {/* Pool Utilization */}
        <Card className="iara-card-glow">
          <div className="flex items-start justify-between mb-2">
            <div className={cn(
              "rounded-lg p-2",
              metrics.poolUtilization >= 80 ? "bg-destructive/20" :
              metrics.poolUtilization >= 60 ? "bg-warning/20" : "bg-muted"
            )}>
              <Zap className={cn(
                "h-5 w-5",
                metrics.poolUtilization >= 80 ? "text-destructive" :
                metrics.poolUtilization >= 60 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            {metrics.poolUtilization >= 80 && (
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            )}
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Utilização Pools
          </p>
          <p className={cn(
            "text-3xl font-bold font-mono-data mt-1",
            metrics.poolUtilization >= 80 ? "text-destructive" :
            metrics.poolUtilization >= 60 ? "text-warning" : "text-foreground"
          )}>
            {metrics.poolUtilization}%
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                metrics.poolUtilization >= 100 ? "bg-destructive" :
                metrics.poolUtilization >= 80 ? "bg-gradient-to-r from-warning to-destructive" :
                metrics.poolUtilization >= 60 ? "bg-warning" : "bg-primary"
              )}
              style={{ width: `${Math.min(metrics.poolUtilization, 100)}%` }}
            />
          </div>
        </Card>

        {/* Attach Rate */}
        <Card className="iara-card-glow">
          <div className="flex items-start justify-between mb-2">
            <div className="rounded-lg p-2 bg-info/20">
              <Users className="h-5 w-5 text-info" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Attach Rate
          </p>
          <p className="text-3xl font-bold text-info font-mono-data mt-1">
            {metrics.attachRate}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Módulos complementares
          </p>
        </Card>
      </div>
    </div>
  );
}
