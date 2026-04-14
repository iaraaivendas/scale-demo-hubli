import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  PLANS, 
  ADDITIONAL_POOLS_PACKAGES, 
  MAX_ADDITIONAL_POOLS_PER_MONTH,
  formatCurrency,
  getPoolAlertLevel,
  getNextPlan,
  canPurchaseAdditionalPools,
  type PlanId 
} from "@/lib/plans";
import type { Client } from "@/lib/storage";
import { 
  Zap, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight,
  Package,
  CreditCard,
  Crown,
  ShoppingCart,
} from "lucide-react";

interface PlanDashboardProps {
  client: Client;
  activeUsers: number;
  onUpgrade?: () => void;
  onPurchasePools?: (packageId: string) => void;
  className?: string;
}

export function PlanDashboard({
  client,
  activeUsers,
  onUpgrade,
  onPurchasePools,
  className,
}: PlanDashboardProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showPoolsDialog, setShowPoolsDialog] = useState(false);

  const plan = PLANS[client.plan];
  const poolsIncluded = client.poolsIncluded || plan.poolsIncluded;
  const poolsAdditional = client.poolsAdditional || 0;
  const totalPools = poolsIncluded + poolsAdditional;
  const poolsRemaining = totalPools - client.poolsUsed;
  const poolPercentage = totalPools > 0 ? Math.round((client.poolsUsed / totalPools) * 100) : 0;
  const alertLevel = getPoolAlertLevel(client.poolsUsed, totalPools);
  const userLimit = client.userLimit || plan.userLimit;
  const monthlyPrice = client.monthlyPrice || plan.monthlyPrice;
  const nextPlan = getNextPlan(client.plan);

  const canBuyMorePools = poolsAdditional < MAX_ADDITIONAL_POOLS_PER_MONTH;

  return (
    <>
      <div className={cn("space-y-6", className)}>
        {/* Plan Header */}
        <Card className="iara-card-glow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                client.plan === 'PRO' ? "bg-primary/20" :
                client.plan === 'GROWTH' ? "bg-info/20" :
                "bg-muted"
              )}>
                <Crown className={cn(
                  "h-6 w-6",
                  client.plan === 'PRO' ? "text-primary" :
                  client.plan === 'GROWTH' ? "text-info" :
                  "text-muted-foreground"
                )} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{plan.displayName}</h2>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary font-mono-data">
                {formatCurrency(monthlyPrice)}
              </p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Pools Inclusos</span>
              </div>
              <p className="text-lg font-bold font-mono-data">{poolsIncluded.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-info" />
                <span className="text-xs text-muted-foreground">Pools Adicionais</span>
              </div>
              <p className="text-lg font-bold font-mono-data text-info">{poolsAdditional.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-warning" />
                <span className="text-xs text-muted-foreground">Consumidos</span>
              </div>
              <p className="text-lg font-bold font-mono-data text-warning">{client.poolsUsed.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Usuários</span>
              </div>
              <p className="text-lg font-bold font-mono-data">
                <span className="text-purple-400">{activeUsers}</span>
                <span className="text-muted-foreground text-sm">/{userLimit}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Pool Consumption Card */}
        <Card className="iara-card-glow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Consumo de Pools</h3>
            <span className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              alertLevel === 'critical' ? "bg-destructive/20 text-destructive" :
              alertLevel === 'warning90' ? "bg-destructive/10 text-destructive" :
              alertLevel === 'warning70' ? "bg-warning/20 text-warning" :
              "bg-primary/20 text-primary"
            )}>
              {poolPercentage}% utilizado
            </span>
          </div>

          {/* Progress Bar with Markers */}
          <div className="relative mb-4">
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  alertLevel === 'critical' ? "bg-destructive" :
                  alertLevel === 'warning90' ? "bg-gradient-to-r from-warning to-destructive" :
                  alertLevel === 'warning70' ? "bg-gradient-to-r from-primary to-warning" :
                  "bg-gradient-to-r from-primary/70 to-primary"
                )}
                style={{ width: `${Math.min(poolPercentage, 100)}%` }}
              />
            </div>
            {/* Threshold markers */}
            <div className="absolute top-0 left-[70%] h-full w-0.5 bg-warning/50" />
            <div className="absolute top-0 left-[90%] h-full w-0.5 bg-destructive/50" />
          </div>

          <div className="flex justify-between text-xs mb-4">
            <span className="text-muted-foreground">
              <span className={cn(
                "font-mono-data font-bold text-lg",
                alertLevel === 'critical' ? "text-destructive" :
                alertLevel === 'warning90' || alertLevel === 'warning70' ? "text-warning" :
                "text-primary"
              )}>
                {poolsRemaining.toLocaleString()}
              </span>
              {" "}pools restantes
            </span>
            <div className="flex gap-4">
              <span className="text-warning">70% alerta</span>
              <span className="text-destructive">90% crítico</span>
            </div>
          </div>

          {/* Alert Messages */}
          {alertLevel === 'warning70' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warning">
                  70% da franquia utilizada
                </p>
                <p className="text-xs text-muted-foreground">
                  Considere adquirir pools adicionais para evitar interrupções.
                </p>
              </div>
              {canBuyMorePools && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-warning text-warning hover:bg-warning/10"
                  onClick={() => setShowPoolsDialog(true)}
                >
                  Comprar Pools
                </Button>
              )}
            </div>
          )}

          {alertLevel === 'warning90' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  90% da franquia utilizada - Crítico!
                </p>
                <p className="text-xs text-muted-foreground">
                  Adquira pools adicionais ou faça upgrade do plano agora.
                </p>
              </div>
              <div className="flex gap-2">
                {canBuyMorePools && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPoolsDialog(true)}
                  >
                    Comprar Pools
                  </Button>
                )}
                {nextPlan && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowUpgradeDialog(true)}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          )}

          {alertLevel === 'critical' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  Limite de pools atingido!
                </p>
                <p className="text-xs text-muted-foreground">
                  {canBuyMorePools 
                    ? "A IA está pausada. Adquira pools adicionais ou faça upgrade."
                    : "Limite máximo de pools adicionais atingido. Faça upgrade do plano para continuar."}
                </p>
              </div>
              {!canBuyMorePools ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  Upgrade Obrigatório
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPoolsDialog(true)}
                  >
                    Comprar Pools
                  </Button>
                  {nextPlan && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowUpgradeDialog(true)}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {canBuyMorePools && (
            <Button
              variant="iara-outline"
              className="flex-1"
              onClick={() => setShowPoolsDialog(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Comprar Pools Adicionais
            </Button>
          )}
          {nextPlan && (
            <Button
              variant="iara"
              className="flex-1"
              onClick={() => setShowUpgradeDialog(true)}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Purchase Pools Dialog */}
      <Dialog open={showPoolsDialog} onOpenChange={setShowPoolsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Comprar Pools Adicionais
            </DialogTitle>
            <DialogDescription>
              Você pode adicionar até {MAX_ADDITIONAL_POOLS_PER_MONTH.toLocaleString()} pools adicionais por mês.
              Atualmente: {poolsAdditional.toLocaleString()} contratados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {ADDITIONAL_POOLS_PACKAGES.map((pkg) => {
              const { allowed, message } = canPurchaseAdditionalPools(poolsAdditional, pkg);
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors",
                    allowed 
                      ? "border-border hover:border-primary cursor-pointer"
                      : "border-border opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (allowed) {
                      onPurchasePools?.(pkg.id);
                      setShowPoolsDialog(false);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        +{pkg.pools.toLocaleString()} pools
                      </p>
                      <p className="text-xs text-muted-foreground">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary font-mono-data">
                        {formatCurrency(pkg.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(pkg.price / pkg.pools)}/pool
                      </p>
                    </div>
                  </div>
                  {!allowed && (
                    <p className="mt-2 text-xs text-destructive">{message}</p>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPoolsDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      {nextPlan && (
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Upgrade para {nextPlan.displayName}
              </DialogTitle>
              <DialogDescription>
                Aumente sua capacidade e desbloqueie recursos avançados.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Plano Atual</span>
                  <span className="font-medium">{plan.displayName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Pools Inclusos</span>
                  <span className="font-mono-data">{poolsIncluded.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Limite Usuários</span>
                  <span className="font-mono-data">{userLimit}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Novo Plano</span>
                  <span className="font-medium text-primary">{nextPlan.displayName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Pools Inclusos</span>
                  <span className="font-mono-data text-primary">
                    {nextPlan.poolsIncluded.toLocaleString()}
                    <span className="text-xs ml-1 text-muted-foreground">
                      (+{(nextPlan.poolsIncluded - poolsIncluded).toLocaleString()})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Limite Usuários</span>
                  <span className="font-mono-data text-primary">
                    {nextPlan.userLimit}
                    <span className="text-xs ml-1 text-muted-foreground">
                      (+{nextPlan.userLimit - userLimit})
                    </span>
                  </span>
                </div>
                <div className="pt-3 border-t border-primary/20">
                  <div className="flex justify-between">
                    <span className="font-medium">Nova Mensalidade</span>
                    <span className="text-xl font-bold text-primary font-mono-data">
                      {formatCurrency(nextPlan.monthlyPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Recursos inclusos:</p>
                <ul className="space-y-1">
                  {nextPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3 text-primary" />
                      {feature}
                    </li>
                  ))}
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
      )}
    </>
  );
}
