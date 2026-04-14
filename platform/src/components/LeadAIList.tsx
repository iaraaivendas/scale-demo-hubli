import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AITypeIcon } from "./AITypeIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Play, 
  Pause, 
  StopCircle, 
  Lock, 
  Plus,
  MessageCircle,
  Zap
} from "lucide-react";
import type { LeadAIActivation, AITypeId } from "@/lib/aiTypes";
import { AI_TYPES, isAIAvailableForPlan, type AIType } from "@/lib/aiTypes";
import type { Client } from "@/lib/storage";

interface LeadAIListProps {
  activations: LeadAIActivation[];
  clientPlan: Client['plan'];
  onActivateAI: () => void;
  onPauseAI: (activationId: string) => void;
  onResumeAI: (activationId: string) => void;
  onFinishAI: (activationId: string) => void;
  onViewConversation: (aiTypeId: AITypeId) => void;
  className?: string;
}

const statusConfig: Record<LeadAIActivation['status'], {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  active: {
    label: 'Ativa',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  paused: {
    label: 'Pausada',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
  },
  finished: {
    label: 'Finalizada',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
  },
  blocked: {
    label: 'Bloqueada',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
};

export function LeadAIList({
  activations,
  clientPlan,
  onActivateAI,
  onPauseAI,
  onResumeAI,
  onFinishAI,
  onViewConversation,
  className,
}: LeadAIListProps) {
  // Get active/paused activations
  const activeActivations = activations.filter(a => a.status === 'active' || a.status === 'paused');
  const finishedActivations = activations.filter(a => a.status === 'finished');
  
  // Get available but not activated AIs
  const activatedAITypes = new Set(activeActivations.map(a => a.aiTypeId));
  const availableAIs = Object.values(AI_TYPES).filter(ai => 
    !activatedAITypes.has(ai.id) && isAIAvailableForPlan(ai.id, clientPlan)
  );
  const blockedAIs = Object.values(AI_TYPES).filter(ai => 
    !isAIAvailableForPlan(ai.id, clientPlan)
  );

  return (
    <Card className={cn("iara-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">IAs do Lead</h3>
        </div>
        <Button
          variant="iara"
          size="sm"
          onClick={onActivateAI}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Ativar IA
        </Button>
      </div>

      <ScrollArea className="max-h-[350px]">
        <div className="space-y-3">
          {/* Active/Paused AIs */}
          {activeActivations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                IAs Ativas ({activeActivations.length})
              </p>
              {activeActivations.map((activation) => {
                const aiType = AI_TYPES[activation.aiTypeId];
                const status = statusConfig[activation.status];
                
                return (
                  <div
                    key={activation.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      status.bgColor,
                      status.borderColor
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        activation.status === 'active' ? 'bg-primary/20' : 'bg-muted'
                      )}>
                        <AITypeIcon 
                          aiTypeId={activation.aiTypeId} 
                          className={aiType.color}
                          size="md"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {aiType.name}
                          </p>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            status.bgColor,
                            status.color
                          )}>
                            {status.label}
                          </span>
                        </div>
                        {activation.lastInteraction && (
                          <p className="text-xs text-muted-foreground">
                            Última interação: {new Date(activation.lastInteraction).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* View Conversation (only for conversational AIs) */}
                      {aiType.conversational && activation.status === 'active' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onViewConversation(activation.aiTypeId)}
                              className="text-primary hover:text-primary"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-popover border-border">
                            <p className="text-xs">Ver conversa</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      {/* Pause/Resume */}
                      {activation.status === 'active' ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onPauseAI(activation.id)}
                              className="text-warning hover:text-warning"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-popover border-border">
                            <p className="text-xs">Pausar IA</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onResumeAI(activation.id)}
                              className="text-primary hover:text-primary"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-popover border-border">
                            <p className="text-xs">Retomar IA</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      {/* Finish */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onFinishAI(activation.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <StopCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-popover border-border">
                          <p className="text-xs">Finalizar IA</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Available AIs (not activated) */}
          {availableAIs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Disponíveis para Ativar
              </p>
              {availableAIs.map((aiType) => (
                <div
                  key={aiType.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border bg-muted/30 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={onActivateAI}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <AITypeIcon 
                        aiTypeId={aiType.id} 
                        className="text-muted-foreground"
                        size="md"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">
                        {aiType.name}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {aiType.poolCost} pool • {aiType.requiredPlan}
                      </p>
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          {/* Blocked AIs (need upgrade) */}
          {blockedAIs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Requer Upgrade
              </p>
              {blockedAIs.map((aiType) => (
                <Tooltip key={aiType.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 opacity-60 cursor-not-allowed">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <AITypeIcon 
                            aiTypeId={aiType.id} 
                            className="text-muted-foreground"
                            size="md"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">
                            {aiType.name}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            Disponível no plano {aiType.requiredPlan}
                          </p>
                        </div>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[250px] bg-popover border-border">
                    <p className="text-xs">
                      <strong>{aiType.name}</strong> está disponível no plano {aiType.requiredPlan}. 
                      Faça upgrade para desbloquear.
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          {/* Finished AIs History */}
          {finishedActivations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Histórico ({finishedActivations.length})
              </p>
              {finishedActivations.slice(0, 3).map((activation) => {
                const aiType = AI_TYPES[activation.aiTypeId];
                
                return (
                  <div
                    key={activation.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                  >
                    <div className="flex items-center gap-2">
                      <AITypeIcon 
                        aiTypeId={activation.aiTypeId} 
                        className="text-muted-foreground"
                        size="sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {aiType.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {activation.finishedAt 
                        ? new Date(activation.finishedAt).toLocaleDateString('pt-BR')
                        : new Date(activation.activatedAt).toLocaleDateString('pt-BR')
                      }
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {activeActivations.length === 0 && availableAIs.length === 0 && blockedAIs.length === 0 && (
            <div className="text-center py-6">
              <Zap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma IA configurada
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onActivateAI}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Ativar Primeira IA
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
