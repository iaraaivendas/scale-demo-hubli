import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock,
  MessageCircle,
  Pause,
  ArrowRightLeft 
} from "lucide-react";
import type { AIActivation } from "@/lib/storage";

interface AIActivationHistoryProps {
  activations: AIActivation[];
  className?: string;
}

const statusConfig = {
  pending: { label: "Pendente", icon: Clock, className: "text-warning" },
  active: { label: "Ativo", icon: MessageCircle, className: "text-primary" },
  paused: { label: "Pausado", icon: Pause, className: "text-muted-foreground" },
  transferred: { label: "Transferido", icon: ArrowRightLeft, className: "text-info" },
  completed: { label: "Concluído", icon: CheckCircle2, className: "text-primary" },
};

export function AIActivationHistory({ activations, className }: AIActivationHistoryProps) {
  if (activations.length === 0) {
    return (
      <Card className={cn("iara-card", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Histórico de IA</h3>
        </div>
        <div className="text-center py-8">
          <Zap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma ativação registrada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ative a IA para este lead para ver o histórico
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("iara-card", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Histórico de IA</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {activations.length} {activations.length === 1 ? 'ativação' : 'ativações'}
        </span>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {activations.map((activation, index) => {
            const statusInfo = statusConfig[activation.conversationStatus];
            const StatusIcon = statusInfo.icon;
            const date = new Date(activation.activatedAt);
            
            return (
              <div
                key={activation.id}
                className={cn(
                  "relative pl-6 pb-4",
                  index !== activations.length - 1 && "border-l border-border ml-2"
                )}
              >
                {/* Timeline dot */}
                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                
                <div className="space-y-2">
                  {/* Date and time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {date.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      {date.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  {/* Activation info */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {activation.activatedByName}
                        </span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        statusInfo.className
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>
                    
                    {activation.poolConsumed && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Zap className="h-3 w-3" />
                        <span>1 pool consumido</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
