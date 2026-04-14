import { cn } from "@/lib/utils";
import { AlertTriangle, Zap, Package } from "lucide-react";
import { getPoolAlertLevel } from "@/lib/plans";

interface PoolsIndicatorProps {
  used: number;
  included: number;
  additional?: number;
  className?: string;
}

export function PoolsIndicator({ 
  used, 
  included, 
  additional = 0, 
  className 
}: PoolsIndicatorProps) {
  const total = included + additional;
  const remaining = total - used;
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const alertLevel = getPoolAlertLevel(used, total);

  const isWarning = alertLevel === 'warning70' || alertLevel === 'warning90';
  const isCritical = alertLevel === 'critical';

  return (
    <div className={cn("iara-card-glow", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "rounded-lg p-2",
            isCritical ? "bg-destructive/20 text-destructive" :
            isWarning ? "bg-warning/20 text-warning" :
            "bg-primary/20 text-primary"
          )}>
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Pools IA</p>
            <p className="text-xs text-muted-foreground">Ativações disponíveis</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono-data">
            <span className={cn(
              isCritical ? "text-destructive" :
              isWarning ? "text-warning" :
              "text-primary"
            )}>
              {remaining.toLocaleString()}
            </span>
            <span className="text-muted-foreground text-lg">/{total.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="progress-iara">
        <div
          className={cn(
            "progress-iara-fill",
            isCritical && "!bg-destructive",
            isWarning && !isCritical && "!bg-gradient-to-r !from-warning !to-orange-400"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{included.toLocaleString()} inclusos</span>
          {additional > 0 && (
            <span className="flex items-center gap-1 text-info">
              <Package className="h-3 w-3" />
              +{additional.toLocaleString()} adicionais
            </span>
          )}
        </div>
        <span className={cn(
          "text-xs font-medium",
          isCritical ? "text-destructive" :
          isWarning ? "text-warning" :
          "text-primary"
        )}>
          {percentage}% utilizado
        </span>
      </div>

      {alertLevel === 'warning70' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 p-3">
          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
          <p className="text-xs text-warning">
            70% da franquia utilizada. Considere adquirir pools adicionais.
          </p>
        </div>
      )}

      {alertLevel === 'warning90' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 animate-pulse" />
          <p className="text-xs text-destructive">
            90% da franquia utilizada! Adquira pools adicionais ou faça upgrade.
          </p>
        </div>
      )}

      {isCritical && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 animate-pulse" />
          <p className="text-xs text-destructive">
            Limite atingido! Faça upgrade para continuar usando a IA.
          </p>
        </div>
      )}
    </div>
  );
}

