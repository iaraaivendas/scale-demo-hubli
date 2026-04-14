// I.ARA Scale - Pools Status Card
// Componente visual para exibição do status de pools

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type PoolStatus,
  type PoolAlertLevel,
  getAlertColorClass,
  getAlertBgClass,
  getProgressBarClass,
  formatPoolsDisplay,
  formatUsagePercent,
  POOL_THRESHOLDS,
} from '@/lib/pools';

interface PoolsStatusCardProps {
  status: PoolStatus;
  planName?: string;
  onPurchasePools?: () => void;
  onUpgradePlan?: () => void;
  compact?: boolean;
}

function getAlertIcon(level: PoolAlertLevel) {
  switch (level) {
    case 'blocked':
      return XCircle;
    case 'critical':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    default:
      return CheckCircle;
  }
}

export function PoolsStatusCard({ 
  status, 
  planName,
  onPurchasePools, 
  onUpgradePlan,
  compact = false,
}: PoolsStatusCardProps) {
  const AlertIcon = getAlertIcon(status.alertLevel);
  const colorClass = getAlertColorClass(status.alertLevel);
  const bgClass = getAlertBgClass(status.alertLevel);
  const progressClass = getProgressBarClass(status.alertLevel);
  
  // Limitar progresso visual a 100%
  const progressValue = Math.min(status.usagePercent, 100);

  if (compact) {
    return (
      <Card className="iara-card-glow p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg p-2", bgClass)}>
              <Zap className={cn("h-5 w-5", colorClass)} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Pools</p>
              <p className={cn("text-lg font-bold font-mono-data", colorClass)}>
                {formatPoolsDisplay(status.poolsUsed)}/{formatPoolsDisplay(status.poolsTotal)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-2xl font-bold font-mono-data", colorClass)}>
              {formatUsagePercent(status.usagePercent)}
            </p>
          </div>
        </div>
        <Progress 
          value={progressValue} 
          className="mt-3 h-2"
          indicatorClassName={progressClass}
        />
      </Card>
    );
  }

  return (
    <Card className="iara-card-glow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl p-3", bgClass)}>
            <Zap className={cn("h-6 w-6", colorClass)} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pools de Ativação</h3>
            {planName && (
              <p className="text-sm text-muted-foreground">Plano {planName}</p>
            )}
          </div>
        </div>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm", bgClass)}>
          <AlertIcon className={cn("h-4 w-4", colorClass)} />
          <span className={colorClass}>
            {status.alertLevel === 'blocked' ? 'Bloqueado' :
             status.alertLevel === 'critical' ? 'Crítico' :
             status.alertLevel === 'warning' ? 'Atenção' : 'Normal'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Consumo</span>
          <span className={cn("text-lg font-bold font-mono-data", colorClass)}>
            {formatUsagePercent(status.usagePercent)}
          </span>
        </div>
        <Progress 
          value={progressValue} 
          className="h-3"
          indicatorClassName={progressClass}
        />
        {/* Threshold markers */}
        <div className="relative mt-1 h-2">
          <div 
            className="absolute h-2 w-px bg-warning/50" 
            style={{ left: `${POOL_THRESHOLDS.WARNING}%` }}
          />
          <div 
            className="absolute h-2 w-px bg-destructive/50" 
            style={{ left: `${POOL_THRESHOLDS.CRITICAL}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Inclusos no Plano
          </p>
          <p className="text-xl font-bold font-mono-data text-foreground">
            {formatPoolsDisplay(status.poolsIncluded)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Adicionais
          </p>
          <p className="text-xl font-bold font-mono-data text-foreground">
            +{formatPoolsDisplay(status.poolsAdditional)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Consumidos
          </p>
          <p className={cn("text-xl font-bold font-mono-data", colorClass)}>
            {formatPoolsDisplay(status.poolsUsed)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Restantes
          </p>
          <p className={cn(
            "text-xl font-bold font-mono-data",
            status.poolsRemaining > 0 ? "text-primary" : "text-destructive"
          )}>
            {formatPoolsDisplay(status.poolsRemaining)}
          </p>
        </div>
      </div>

      {/* Alert Message */}
      <div className={cn(
        "p-3 rounded-lg flex items-start gap-2 mb-4",
        bgClass
      )}>
        <AlertIcon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", colorClass)} />
        <p className={cn("text-sm", colorClass)}>
          {status.alertMessage}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {status.canPurchaseMore && onPurchasePools && (
          <Button 
            variant="iara-outline" 
            className="flex-1"
            onClick={onPurchasePools}
          >
            <Plus className="h-4 w-4 mr-2" />
            Comprar Pools
          </Button>
        )}
        {(!status.canPurchaseMore || status.alertLevel === 'blocked') && onUpgradePlan && (
          <Button 
            variant="iara" 
            className="flex-1"
            onClick={onUpgradePlan}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Fazer Upgrade
          </Button>
        )}
      </div>
    </Card>
  );
}
