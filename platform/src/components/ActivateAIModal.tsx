import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, Client } from "@/lib/storage";

interface ActivateAIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  client: Client | undefined;
  onConfirm: () => Promise<{ success: boolean; message: string }>;
}

export function ActivateAIModal({
  open,
  onOpenChange,
  lead,
  client,
  onConfirm,
}: ActivateAIModalProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const totalPools = client ? (client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0) : 0;
  const poolsRemaining = totalPools - (client?.poolsUsed || 0);
  const isLowPools = poolsRemaining <= 10;
  const canActivate = poolsRemaining > 0 && client?.status === 'active';

  const handleConfirm = async () => {
    setIsActivating(true);
    setResult(null);
    
    const res = await onConfirm();
    setResult(res);
    
    if (res.success) {
      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
      }, 1500);
    }
    
    setIsActivating(false);
  };

  const handleClose = () => {
    if (!isActivating) {
      onOpenChange(false);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            Ativar IA Comercial
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Você está prestes a ativar a IA para o lead <span className="font-medium text-foreground">{lead.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pool consumption warning */}
          <Alert className={cn(
            "border",
            isLowPools ? "bg-warning/10 border-warning/30" : "bg-muted border-border"
          )}>
            <AlertTriangle className={cn(
              "h-4 w-4",
              isLowPools ? "text-warning" : "text-muted-foreground"
            )} />
            <AlertDescription className="text-sm">
              <strong>Esta ação consome 1 pool.</strong>
              <br />
              <span className="text-muted-foreground">
                Pools disponíveis: <span className={cn(
                  "font-mono font-semibold",
                  isLowPools ? "text-warning" : "text-primary"
                )}>{poolsRemaining}</span> de {totalPools}
              </span>
            </AlertDescription>
          </Alert>

          {/* What happens next */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">O que acontece ao ativar:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                A IA iniciará contato via WhatsApp automaticamente
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                O lead será movido para a aba WhatsApp
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Você poderá acompanhar a conversa em tempo real
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                A ativação será registrada no histórico
              </li>
            </ul>
          </div>

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

        <DialogFooter className="gap-2 sm:gap-0">
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
            disabled={isActivating || !canActivate || result?.success}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {isActivating ? "Ativando..." : "Confirmar Ativação"}
          </Button>
        </DialogFooter>

        {!canActivate && (
          <p className="text-xs text-destructive text-center">
            {client?.status !== 'active' 
              ? "Cliente inativo. Não é possível ativar a IA."
              : "Sem pools disponíveis. Faça upgrade do plano."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
