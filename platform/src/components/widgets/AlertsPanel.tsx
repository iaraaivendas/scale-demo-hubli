import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Check,
  Bell,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlertsData } from '@/contexts/DataContext';
import { type AlertInstance } from '@/lib/alertEngine';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface AlertsPanelProps {
  className?: string;
  maxVisible?: number;
}

const levelConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-info/10',
    textColor: 'text-info',
    borderColor: 'border-info/20',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
    borderColor: 'border-warning/20',
  },
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    borderColor: 'border-destructive/20',
  },
};

// Visual config for opportunity types
const opportunityConfig = {
  upsell: {
    icon: ArrowUpCircle,
    label: 'Upsell',
    badgeClass: 'bg-primary/20 text-primary border-primary/30',
  },
  cross_sell: {
    icon: LayoutGrid,
    label: 'Cross-sell',
    badgeClass: 'bg-accent/20 text-accent-foreground border-accent/30',
  },
};

export function AlertsPanel({ className, maxVisible = 5 }: AlertsPanelProps) {
  const { realtimeAlerts, acknowledgeAlert, dismissAlert } = useAlertsData();
  const [isExpanded, setIsExpanded] = useState(true);

  const unacknowledged = realtimeAlerts.filter(a => !a.acknowledged);
  const acknowledged = realtimeAlerts.filter(a => a.acknowledged);

  const visibleAlerts = unacknowledged.slice(0, maxVisible);
  const hiddenCount = unacknowledged.length - maxVisible;

  if (realtimeAlerts.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Alertas em Tempo Real</span>
              {unacknowledged.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unacknowledged.length}
                </Badge>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2">
          {/* Unacknowledged Alerts */}
          {visibleAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}

          {/* Hidden count indicator */}
          {hiddenCount > 0 && (
            <div className="text-center text-sm text-muted-foreground py-2">
              +{hiddenCount} alertas ocultos
            </div>
          )}

          {/* Acknowledged section */}
          {acknowledged.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Alertas reconhecidos ({acknowledged.length})
              </p>
              {acknowledged.slice(0, 3).map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  compact
                  onDismiss={() => dismissAlert(alert.id)}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

interface AlertCardProps {
  alert: AlertInstance;
  compact?: boolean;
  onAcknowledge?: () => void;
  onDismiss: () => void;
}

function AlertCard({
  alert,
  compact = false,
  onAcknowledge,
  onDismiss,
}: AlertCardProps) {
  const config = levelConfig[alert.level];
  const isOpportunity = alert.opportunity_type && (alert.type === 'upsell_opportunity' || alert.type === 'cross_sell_opportunity');
  const oppConfig = alert.opportunity_type ? opportunityConfig[alert.opportunity_type] : null;
  const DisplayIcon = isOpportunity && oppConfig ? oppConfig.icon : config.icon;

  const timeAgo = getTimeAgo(new Date(alert.triggeredAt));

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-2 rounded-lg opacity-60',
          config.bgColor
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <DisplayIcon className={cn('h-3 w-3 shrink-0', isOpportunity ? 'text-primary' : config.textColor)} />
          <span className="text-xs truncate">{alert.message}</span>
          {isOpportunity && oppConfig && (
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-semibold', oppConfig.badgeClass)}>
              {oppConfig.label}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all',
        config.bgColor,
        config.borderColor,
        'animate-in slide-in-from-top-2 duration-300'
      )}
    >
      <DisplayIcon className={cn('h-5 w-5 shrink-0 mt-0.5', isOpportunity ? 'text-primary' : config.textColor)} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{alert.message}</p>
          {isOpportunity && oppConfig && (
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-semibold whitespace-nowrap', oppConfig.badgeClass)}>
              {oppConfig.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground capitalize">
            {isOpportunity ? (alert.opportunity_type === 'upsell' ? 'upsell' : 'cross-sell') : alert.type}
          </span>
        </div>
        {alert.suggested_script && (
          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary/30 pl-2">
            {alert.suggested_script}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onAcknowledge && !alert.acknowledged && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onAcknowledge}
          >
            <Check className="h-4 w-4 text-success" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();

  if (diff < 60000) {
    return 'agora';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} min atrás`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}h atrás`;
  } else {
    return new Date(date).toLocaleDateString('pt-BR');
  }
}

// Compact badge for header/toolbar use
export function AlertsBadge({ className }: { className?: string }) {
  const { realtimeAlerts } = useAlertsData();
  const unacknowledged = realtimeAlerts.filter(a => !a.acknowledged);
  const critical = unacknowledged.filter(a => a.level === 'critical');

  if (unacknowledged.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      <Bell className="h-5 w-5" />
      <span
        className={cn(
          'absolute -top-1 -right-1 flex items-center justify-center',
          'min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold',
          critical.length > 0
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-warning text-warning-foreground'
        )}
      >
        {unacknowledged.length}
      </span>
    </div>
  );
}
