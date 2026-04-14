import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PrivacyToggle } from "./PrivacyToggle";
import { usePrivacy, type PrivacyWidget } from "@/contexts/PrivacyContext";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "warning" | "info" | "success";
  prefix?: string;
  suffix?: string;
  className?: string;
  /** When true, the value is already formatted and shouldn't have prefix/suffix applied */
  isROI?: boolean;
  /** Privacy widget key - enables privacy toggle when set */
  privacyKey?: PrivacyWidget;
}

export function KPICard({
  label,
  value,
  change,
  icon: Icon,
  variant = "default",
  prefix = "",
  suffix = "",
  className,
  isROI = false,
  privacyKey,
}: KPICardProps) {
  const { isVisible, toggleVisibility, maskCurrency } = usePrivacy();

  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/20 text-primary",
    warning: "bg-warning/20 text-warning",
    info: "bg-info/20 text-info",
    success: "bg-primary/20 text-primary",
  };

  const valueVariants = {
    default: "text-foreground",
    primary: "gradient-text-iara",
    warning: "text-warning",
    info: "text-info",
    success: "text-primary",
  };

  // Format displayed value with privacy masking
  const getDisplayValue = () => {
    if (isROI) return value;
    
    // If privacy key is set and hidden, mask the value
    if (privacyKey && !isVisible(privacyKey)) {
      // Handle currency values (has R$ prefix)
      if (prefix === "R$ " && typeof value === 'number') {
        return maskCurrency(value, privacyKey);
      }
      return '•••••';
    }
    
    return `${prefix}${typeof value === 'number' ? value.toLocaleString('pt-BR') : value}${suffix}`;
  };

  return (
    <Card className={cn("iara-card-glow group transition-all duration-300 hover:border-primary/30", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {label}
            </p>
            {privacyKey && (
              <PrivacyToggle
                isVisible={isVisible(privacyKey)}
                onToggle={() => toggleVisibility(privacyKey)}
              />
            )}
          </div>
          <p className={cn(
            "text-2xl lg:text-3xl font-bold font-mono-data truncate transition-all duration-200",
            isROI ? "" : valueVariants[variant],
            privacyKey && !isVisible(privacyKey) && "text-muted-foreground"
          )}>
            {getDisplayValue()}
          </p>
        </div>
        {Icon && (
          <div className={cn(
            "rounded-lg p-2.5 transition-all duration-300 group-hover:scale-110 flex-shrink-0",
            iconVariants[variant]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {typeof change === "number" && privacyKey && isVisible(privacyKey) && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              change >= 0 ? "text-primary" : "text-destructive"
            )}
          >
            {change >= 0 ? "+" : ""}{change}%
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
      {typeof change === "number" && !privacyKey && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              change >= 0 ? "text-primary" : "text-destructive"
            )}
          >
            {change >= 0 ? "+" : ""}{change}%
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </Card>
  );
}
