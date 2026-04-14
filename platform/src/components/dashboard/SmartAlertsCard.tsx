import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SmartAlert } from '@/lib/dashboardData';

interface SmartAlertsCardProps {
  alerts: SmartAlert[];
  onAction?: (alert: SmartAlert) => void;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    iconColor: 'text-primary',
    textColor: 'text-primary',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    iconColor: 'text-warning',
    textColor: 'text-warning',
  },
  danger: {
    icon: XCircle,
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    iconColor: 'text-destructive',
    textColor: 'text-destructive',
  },
  info: {
    icon: Info,
    bg: 'bg-info/10',
    border: 'border-info/30',
    iconColor: 'text-info',
    textColor: 'text-info',
  },
};

export function SmartAlertsCard({ alerts, onAction }: SmartAlertsCardProps) {
  if (alerts.length === 0) {
    return null;
  }
  
  return (
    <Card className="iara-card-glow">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Alertas Inteligentes
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
          {alerts.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = alertConfig[alert.type];
          const Icon = config.icon;
          
          return (
            <div
              key={alert.id}
              className={cn(
                "p-4 rounded-lg border transition-all hover:scale-[1.01]",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", config.bg)}>
                  <Icon className={cn("h-5 w-5", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold", config.textColor)}>
                    {alert.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {alert.message}
                  </p>
                  {alert.threshold && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Limite: {alert.threshold}% | Atual: {alert.value.toFixed(1)}%
                    </p>
                  )}
                </div>
                {onAction && alert.type !== 'success' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("shrink-0", config.textColor)}
                    onClick={() => onAction(alert)}
                  >
                    Ver
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
