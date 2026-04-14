import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, AlertTriangle, ArrowUpRight } from "lucide-react";

interface PoolThresholdBarProps {
  used: number;
  limit: number;
  plan: string;
  onUpgrade?: () => void;
  className?: string;
}

export function PoolThresholdBar({
  used,
  limit,
  plan,
  onUpgrade,
  className,
}: PoolThresholdBarProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [hasShownDialog, setHasShownDialog] = useState(false);
  
  const percentage = Math.round((used / limit) * 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 100;

  // Auto-trigger upgrade dialog at 80%
  useEffect(() => {
    if (percentage >= 80 && !hasShownDialog) {
      setShowUpgradeDialog(true);
      setHasShownDialog(true);
    }
  }, [percentage, hasShownDialog]);

  const getBarColor = () => {
    if (isCritical) return "bg-destructive";
    if (isWarning) return "bg-gradient-to-r from-warning via-orange-500 to-destructive";
    if (percentage >= 60) return "bg-gradient-to-r from-primary to-warning";
    return "bg-gradient-to-r from-primary/70 to-primary";
  };

  const getNextPlan = () => {
    if (plan === 'ESSENCIAL') return 'GROWTH';
    if (plan === 'GROWTH') return 'PRO';
    return 'ENTERPRISE';
  };

  return (
    <>
      <Card className={cn("iara-card-glow", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg p-2 transition-colors",
              isCritical ? "bg-destructive/20" :
              isWarning ? "bg-warning/20" : "bg-primary/20"
            )}>
              <Zap className={cn(
                "h-5 w-5",
                isCritical ? "text-destructive animate-pulse" :
                isWarning ? "text-warning" : "text-primary"
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">Consumo de Pools</p>
              <p className="text-xs text-muted-foreground">Plano {plan}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold font-mono-data">
              <span className={cn(
                isCritical ? "text-destructive" :
                isWarning ? "text-warning" : "text-primary"
              )}>
                {used.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-lg">
                /{limit.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Threshold Progress Bar */}
        <div className="relative">
          <div className="h-4 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                getBarColor()
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          {/* Threshold Markers */}
          <div className="absolute top-0 left-[80%] h-full w-0.5 bg-warning/50" />
          <div className="absolute top-0 left-full -translate-x-0.5 h-full w-0.5 bg-destructive/50" />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {percentage}% utilizado
          </span>
          <div className="flex gap-4">
            <span className="text-xs text-warning">80% alerta</span>
            <span className="text-xs text-destructive">100% limite</span>
          </div>
        </div>

        {/* Warning/Critical Messages */}
        {isWarning && !isCritical && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-warning">
                Atenção: 80% da franquia utilizada
              </p>
              <p className="text-xs text-muted-foreground">
                Considere upgrade para evitar interrupção do serviço.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-warning text-warning hover:bg-warning/10"
              onClick={() => setShowUpgradeDialog(true)}
            >
              Upgrade
            </Button>
          </div>
        )}

        {isCritical && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                Limite atingido!
              </p>
              <p className="text-xs text-muted-foreground">
                A IA está pausada. Faça upgrade para continuar.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowUpgradeDialog(true)}
            >
              Upgrade Agora
            </Button>
          </div>
        )}
      </Card>

      {/* Upgrade Authorization Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Autorização de Upgrade
            </DialogTitle>
            <DialogDescription>
              Seu consumo de pools atingiu {percentage}% da franquia. 
              Recomendamos upgrade para o plano {getNextPlan()}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Plano Atual</span>
                <span className="font-medium">{plan}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pools Usados</span>
                <span className="font-mono-data">{used.toLocaleString()}/{limit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plano Recomendado</span>
                <span className="font-medium text-primary">{getNextPlan()}</span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Com o plano <strong>{getNextPlan()}</strong>, você terá:
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                  <span>+100% de pools mensais</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                  <span>Funcionalidades avançadas de IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Continuar no Plano Atual
            </Button>
            <Button
              variant="iara"
              onClick={() => {
                setShowUpgradeDialog(false);
                onUpgrade?.();
              }}
            >
              Solicitar Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
