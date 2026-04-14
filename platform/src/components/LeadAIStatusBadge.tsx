import { cn } from "@/lib/utils";
import type { LeadAIStatus } from "@/lib/storage";
import { 
  Circle, 
  Zap, 
  MessageCircle, 
  Calendar, 
  Archive,
  HelpCircle 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadAIStatusBadgeProps {
  status: LeadAIStatus;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<LeadAIStatus, { 
  label: string; 
  icon: typeof Circle;
  className: string;
  bgClassName: string;
  tooltip: string;
}> = {
  not_activated: { 
    label: "Não ativado", 
    icon: Circle,
    className: "text-warning",
    bgClassName: "bg-warning/20 border-warning/30",
    tooltip: "A IA ainda não foi ativada para este lead. Clique em 'Ativar IA' para começar o atendimento automatizado."
  },
  ai_active: { 
    label: "IA ativa", 
    icon: Zap,
    className: "text-info",
    bgClassName: "bg-info/20 border-info/30",
    tooltip: "A IA está ativa e pronta para interagir com este lead. Aguardando primeira mensagem do lead."
  },
  in_conversation: { 
    label: "Em conversa", 
    icon: MessageCircle,
    className: "text-primary",
    bgClassName: "bg-primary/20 border-primary/30",
    tooltip: "A IA está em uma conversa ativa com este lead. Acompanhe pelo WhatsApp."
  },
  scheduled: { 
    label: "Agendado", 
    icon: Calendar,
    className: "text-purple-400",
    bgClassName: "bg-purple-400/20 border-purple-400/30",
    tooltip: "Uma reunião ou demonstração foi agendada com este lead. Próximo passo: confirmar presença."
  },
  archived: { 
    label: "Arquivado", 
    icon: Archive,
    className: "text-muted-foreground",
    bgClassName: "bg-muted border-border",
    tooltip: "Este lead foi arquivado. A IA não está mais ativa e a conversa está em modo leitura."
  },
};

export function LeadAIStatusBadge({ 
  status, 
  className, 
  showLabel = true,
  size = 'md' 
}: LeadAIStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.not_activated;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border font-medium cursor-help transition-all",
            config.bgClassName,
            config.className,
            sizeClasses[size],
            className
          )}
        >
          <Icon className={cn(iconSizes[size], "flex-shrink-0")} />
          {showLabel && <span>{config.label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-[250px] text-center bg-popover border-border"
      >
        <p className="text-xs">{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Color indicators for quick status overview
export function LeadAIStatusDot({ status, className }: { status: LeadAIStatus; className?: string }) {
  const colorMap: Record<LeadAIStatus, string> = {
    not_activated: "bg-warning",
    ai_active: "bg-info",
    in_conversation: "bg-primary animate-pulse",
    scheduled: "bg-purple-400",
    archived: "bg-muted-foreground",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span 
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full cursor-help",
            colorMap[status] || colorMap.not_activated,
            className
          )} 
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-popover border-border">
        <p className="text-xs">{statusConfig[status]?.label || "Desconhecido"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
