import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type WidgetVariant } from "@/lib/widgets";

interface KPIWidgetProps {
  value: string | number;
  label?: string;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon?: LucideIcon;
  variant?: WidgetVariant;
  className?: string;
}

const variantStyles: Record<WidgetVariant, { bg: string; text: string; icon: string }> = {
  default: { bg: 'bg-muted', text: 'text-foreground', icon: 'text-muted-foreground' },
  primary: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success', icon: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', icon: 'text-warning' },
  info: { bg: 'bg-info/10', text: 'text-info', icon: 'text-info' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive', icon: 'text-destructive' },
};

export function KPIWidget({
  value,
  label,
  prefix = '',
  suffix = '',
  change,
  icon: Icon,
  variant = 'default',
  className,
}: KPIWidgetProps) {
  const styles = variantStyles[variant];
  
  // Format value if numeric
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('pt-BR')
    : value;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {Icon && (
        <div className={cn("p-3 rounded-xl", styles.bg)}>
          <Icon className={cn("h-6 w-6", styles.icon)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {label && (
          <p className="text-sm text-muted-foreground truncate">{label}</p>
        )}
        <div className="flex items-baseline gap-1">
          <p className={cn("text-2xl font-bold font-mono-data truncate", styles.text)}>
            {prefix}{formattedValue}{suffix}
          </p>
          {change !== undefined && (
            <span className={cn(
              "text-xs font-medium",
              change >= 0 ? "text-success" : "text-destructive"
            )}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
