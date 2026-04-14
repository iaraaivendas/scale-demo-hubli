import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { type WidgetVariant } from "@/lib/widgets";

interface ProgressWidgetProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  showPercentage?: boolean;
  variant?: WidgetVariant;
  size?: 'sm' | 'md' | 'lg';
  formatValue?: (value: number, max: number) => string;
  className?: string;
}

const variantClasses: Record<WidgetVariant, string> = {
  default: 'bg-foreground',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export function ProgressWidget({
  value,
  max = 100,
  label,
  showValue = true,
  showPercentage = true,
  variant = 'primary',
  size = 'md',
  formatValue,
  className,
}: ProgressWidgetProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const defaultFormat = (val: number, maxVal: number) => {
    if (maxVal >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M / ${(maxVal / 1000000).toFixed(1)}M`;
    }
    if (maxVal >= 1000) {
      return `${(val / 1000).toFixed(1)}K / ${(maxVal / 1000).toFixed(1)}K`;
    }
    return `${val.toLocaleString('pt-BR')} / ${maxVal.toLocaleString('pt-BR')}`;
  };

  const valueFormatter = formatValue || defaultFormat;

  // Determine color based on percentage for visual feedback
  const getProgressVariant = () => {
    if (percentage >= 100) return variant;
    if (percentage >= 90) return 'warning';
    if (percentage >= 70) return variant;
    return variant;
  };

  const currentVariant = getProgressVariant();

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
        <div className="flex items-center gap-2 text-sm">
          {showValue && (
            <span className="text-muted-foreground">
              {valueFormatter(value, max)}
            </span>
          )}
          {showPercentage && (
            <span className={cn(
              "font-mono-data font-semibold",
              percentage >= 100 ? "text-success" :
              percentage >= 90 ? "text-warning" :
              "text-foreground"
            )}>
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={sizeClasses[size]}
        indicatorClassName={variantClasses[currentVariant]}
      />
    </div>
  );
}
