import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AITypeIcon } from "./AITypeIcon";
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Lock,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, Client } from "@/lib/storage";
import type { AITypeId, AIType, LeadAIActivation } from "@/lib/aiTypes";
import { 
  AI_TYPES, 
  isAIAvailableForPlan, 
  getAllAITypes,
  getPlanUpgradeInfo 
} from "@/lib/aiTypes";

interface SelectAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  client: Client | undefined;
  existingActivations: LeadAIActivation[];
  onConfirm: (aiTypeId: AITypeId) => Promise<{ success: boolean; message: string }>;
  onNavigateToWhatsApp?: () => void;
}

export function SelectAIModal({
  open,
  onOpenChange,
  lead,
  client,
  existingActivations,
  onConfirm,
  onNavigateToWhatsApp,
}: SelectAIModalProps) {
  const [selectedAI, setSelectedAI] = useState<AITypeId | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const poolsRemaining = client ? client.poolsLimit - client.poolsUsed : 0;
  const isLowPools = poolsRemaining <= 10;
  const canActivateAny = poolsRemaining > 0 && client?.status === 'active';

  // Get already active AI types
  const activeAITypes = new Set(
    existingActivations
      .filter(a => a.status === 'active' || a.status === 'paused')
      .map(a => a.aiTypeId)
  );

  const handleConfirm = async () => {
    if (!selectedAI) return;
    
    setIsActivating(true);
    setResult(null);
    
    const res = await onConfirm(selectedAI);
    setResult(res);
    
    if (res.success) {
      // Check if the activated AI is conversational (commercial or reactivation)
      const aiType = AI_TYPES[selectedAI];
      const isConversational = aiType?.conversational;
      
      // Close modal and navigate immediately for conversational AIs
      // The activeConversation pointer is already set in storage by activateAITypeForLead
      onOpenChange(false);
      setResult(null);
      setSelectedAI(null);
      
      // Navigate immediately for conversational AIs (no delay)
      if (isConversational && onNavigateToWhatsApp) {
        onNavigateToWhatsApp();
      }
    }
    
    setIsActivating(false);
  };

  const handleClose = () => {
    if (!isActivating) {
      onOpenChange(false);
      setResult(null);
      setSelectedAI(null);
    }
  };

  const getAIStatus = (aiType: AIType): 'available' | 'active' | 'blocked' => {
    if (activeAITypes.has(aiType.id)) return 'active';
    if (!client || !isAIAvailableForPlan(aiType.id, client.plan)) return 'blocked';
    return 'available';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            Ativar IA para {lead.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escolha qual IA você deseja ativar para este lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pool Info */}
          <Alert className={cn(
            "border",
            isLowPools ? "bg-warning/10 border-warning/30" : "bg-muted border-border"
          )}>
            <Zap className={cn(
              "h-4 w-4",
              isLowPools ? "text-warning" : "text-primary"
            )} />
            <AlertDescription className="text-sm">
              Pools disponíveis: <span className={cn(
                "font-mono font-semibold",
                isLowPools ? "text-warning" : "text-primary"
              )}>{poolsRemaining}</span> de {client?.poolsLimit || 0}
              <span className="text-muted-foreground ml-2">
                • Plano: <span className="font-medium text-foreground">{client?.plan}</span>
              </span>
            </AlertDescription>
          </Alert>

          {/* AI Selection */}
          <ScrollArea className="max-h-[350px] pr-4">
            <div className="space-y-2">
              {getAllAITypes().map((aiType) => {
                const status = getAIStatus(aiType);
                const isSelected = selectedAI === aiType.id;
                const isBlocked = status === 'blocked';
                const isAlreadyActive = status === 'active';
                const isDisabled = isBlocked || isAlreadyActive || !canActivateAny;
                
                const upgradeInfo = client 
                  ? getPlanUpgradeInfo(client.plan, aiType.requiredPlan)
                  : { needsUpgrade: true, targetPlan: aiType.requiredPlan };

                return (
                  <div
                    key={aiType.id}
                    className={cn(
                      "relative flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer",
                      isSelected && !isDisabled
                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                        : isDisabled
                          ? "bg-muted/30 border-border opacity-60 cursor-not-allowed"
                          : "bg-card hover:bg-accent/30 border-border hover:border-primary/30"
                    )}
                    onClick={() => !isDisabled && setSelectedAI(aiType.id)}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "p-2.5 rounded-lg flex-shrink-0",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <AITypeIcon 
                        aiTypeId={aiType.id} 
                        className={isSelected ? aiType.color : "text-muted-foreground"}
                        size="lg"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn(
                          "font-medium",
                          isSelected ? "text-foreground" : "text-foreground"
                        )}>
                          {aiType.name}
                        </p>
                        
                        {/* Status badges */}
                        {isAlreadyActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                            Ativa
                          </span>
                        )}
                        {isBlocked && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            {upgradeInfo.targetPlan}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {aiType.description}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={cn(
                          "flex items-center gap-1",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}>
                          <Zap className="h-3 w-3" />
                          {aiType.poolCost} pool
                        </span>
                        {aiType.conversational && (
                          <span className="text-muted-foreground">
                            • WhatsApp
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && !isDisabled && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    )}

                    {/* Upgrade CTA for blocked */}
                    {isBlocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-3 right-3 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Would trigger upgrade flow
                        }}
                      >
                        Upgrade
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Result feedback */}
          {result && (
            <Alert className={cn(
              "border",
              result.success 
                ? "bg-primary/10 border-primary/30" 
                : "bg-destructive/10 border-destructive/30"
            )}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription className={cn(
                "text-sm",
                result.success ? "text-primary" : "text-destructive"
              )}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isActivating}
          >
            Cancelar
          </Button>
          <Button
            variant="iara"
            onClick={handleConfirm}
            disabled={isActivating || !selectedAI || !canActivateAny || result?.success}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {isActivating ? "Ativando..." : "Ativar IA Selecionada"}
          </Button>
        </div>

        {!canActivateAny && (
          <p className="text-xs text-destructive text-center">
            {client?.status !== 'active' 
              ? "Cliente inativo. Não é possível ativar IAs."
              : "Sem pools disponíveis. Faça upgrade do plano."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
