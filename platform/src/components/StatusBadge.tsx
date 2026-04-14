import { cn } from "@/lib/utils";
import type { Lead, Client } from "@/lib/storage";

type Status = Lead["status"] | Client["status"];

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: { label: "Ativo", className: "status-active" },
  inactive: { label: "Inativo", className: "status-inactive" },
  new: { label: "Novo", className: "bg-info/20 text-info border border-info/30" },
  qualified: { label: "Qualificado", className: "status-active" },
  nurturing: { label: "Nutrição", className: "bg-secondary text-secondary-foreground border border-border" },
  cold: { label: "Frio", className: "bg-muted text-muted-foreground border border-border" },
  converted: { label: "Convertido", className: "bg-primary/20 text-primary border border-primary/30" },
  lost: { label: "Perdido", className: "bg-destructive/20 text-destructive border border-destructive/30" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
