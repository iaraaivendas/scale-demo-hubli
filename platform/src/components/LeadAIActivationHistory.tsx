import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AITypeIcon } from "./AITypeIcon";
import { 
  Zap, 
  User, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Pause,
  Play,
  StopCircle
} from "lucide-react";
import type { LeadAIActivation } from "@/lib/aiTypes";
import { AI_TYPES } from "@/lib/aiTypes";

interface LeadAIActivationHistoryProps {
  activations: LeadAIActivation[];
  className?: string;
}

const statusConfig = {
  active: { label: "Ativo", icon: Play, className: "text-primary" },
  paused: { label: "Pausado", icon: Pause, className: "text-warning" },
  finished: { label: "Finalizado", icon: CheckCircle2, className: "text-muted-foreground" },
  blocked: { label: "Bloqueado", icon: StopCircle, className: "text-destructive" },
};

export function LeadAIActivationHistory({ activations, className }: LeadAIActivationHistoryProps) {
  if (activations.length === 0) {
    return (
      <Card className={cn("iara-card", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Histórico de Ativações</h3>
        </div>
        <div className="text-center py-8">
          <Zap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma ativação registrada
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ative uma IA para este lead para ver o histórico
          </p>
        </div>
      </Card>
    );
  }

  // Sort by date descending
  const sortedActivations = [...activations].sort(
    (a, b) => new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime()
  );

  return (
    <Card className={cn("iara-card", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Histórico de Ativações</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {activations.length} {activations.length === 1 ? 'ativação' : 'ativações'}
        </span>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {sortedActivations.map((activation, index) => {
            const statusInfo = statusConfig[activation.status];
            const StatusIcon = statusInfo.icon;
            const date = new Date(activation.activatedAt);
            const aiType = AI_TYPES[activation.aiTypeId];
            
            return (
              <div
                key={activation.id}
                className={cn(
                  "relative pl-6 pb-4",
                  index !== sortedActivations.length - 1 && "border-l border-border ml-2"
                )}
              >
                {/* Timeline dot */}
                <div className={cn(
                  "absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                  activation.status === 'active' ? "bg-primary" : "bg-muted-foreground"
                )} />
                
                <div className="space-y-2">
                  {/* AI Type and Status */}
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded-md",
                      activation.status === 'active' ? "bg-primary/20" : "bg-muted"
                    )}>
                      <AITypeIcon 
                        aiTypeId={activation.aiTypeId} 
                        className={activation.status === 'active' ? aiType.color : "text-muted-foreground"}
                        size="sm"
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {aiType.name}
                    </span>
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      statusInfo.className
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

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
                        <span className="text-sm text-foreground">
                          {activation.activatedByName}
                        </span>
                      </div>
                    </div>
                    
                    {activation.poolConsumed && (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <Zap className="h-3 w-3" />
                        <span>1 pool consumido</span>
                      </div>
                    )}

                    {activation.lastInteraction && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Última interação: {new Date(activation.lastInteraction).toLocaleDateString('pt-BR')}
                        </span>
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
