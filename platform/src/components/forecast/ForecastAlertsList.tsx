import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ForecastAlert } from "@/lib/forecastEngine";

interface ForecastAlertsListProps {
  alerts: ForecastAlert[];
  className?: string;
}

export function ForecastAlertsList({ alerts, className }: ForecastAlertsListProps) {
  if (alerts.length === 0) return null;

  const getIcon = (type: ForecastAlert['type']) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info':
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getBgColor = (type: ForecastAlert['type']) => {
    switch (type) {
      case 'danger':
        return 'bg-destructive/10 border-destructive/30';
      case 'warning':
        return 'bg-warning/10 border-warning/30';
      case 'info':
        return 'bg-info/10 border-info/30';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Alertas do Forecast
      </h3>
      <div className="space-y-2">
        {alerts.map(alert => (
          <Card
            key={alert.id}
            className={cn(
              "p-4 border transition-all hover:shadow-md",
              getBgColor(alert.type)
            )}
          >
            <div className="flex items-start gap-3">
              {getIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{alert.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
