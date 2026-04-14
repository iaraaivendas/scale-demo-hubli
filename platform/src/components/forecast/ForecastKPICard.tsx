import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/financialData";

interface ForecastKPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  isCurrency?: boolean;
  isPercent?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function ForecastKPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  isCurrency = false,
  isPercent = false,
  className,
  size = 'md',
  variant = 'default',
}: ForecastKPICardProps) {
  const formattedValue = isCurrency
    ? formatCurrency(value)
    : isPercent
    ? `${value.toFixed(1)}%`
    : value.toLocaleString('pt-BR');

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  const trendColor = trend === 'up' 
    ? 'text-primary' 
    : trend === 'down' 
    ? 'text-destructive' 
    : 'text-muted-foreground';

  const variantStyles = {
    default: 'bg-card',
    success: 'bg-primary/5 border-primary/20',
    warning: 'bg-warning/5 border-warning/20',
    danger: 'bg-destructive/5 border-destructive/20',
  };

  const valueStyles = {
    default: 'text-foreground',
    success: 'text-primary',
    warning: 'text-warning',
    danger: 'text-destructive',
  };

  const sizeStyles = {
    sm: { card: 'p-3', title: 'text-xs', value: 'text-xl' },
    md: { card: 'p-4', title: 'text-sm', value: 'text-2xl' },
    lg: { card: 'p-6', title: 'text-sm', value: 'text-3xl' },
  };

  return (
    <Card className={cn(
      "border border-border rounded-xl transition-all duration-200 hover:shadow-lg",
      variantStyles[variant],
      sizeStyles[size].card,
      className
    )}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-muted-foreground uppercase tracking-wider",
            sizeStyles[size].title
          )}>
            {title}
          </span>
          {trend && (
            <div className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              {trendValue && <span className="text-xs font-medium">{trendValue}</span>}
            </div>
          )}
        </div>
        
        <p className={cn(
          "font-bold font-mono-data",
          sizeStyles[size].value,
          valueStyles[variant]
        )}>
          {formattedValue}
        </p>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
