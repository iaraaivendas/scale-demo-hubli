// I.ARA Scale - Pools Purchase Modal
// Modal para compra de pools adicionais

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Check, 
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getAvailablePoolPackages, 
  POOL_PACKAGE_PRICES_CENTAVOS,
  type PoolStatus,
} from '@/lib/pools';
import { formatCurrency } from '@/lib/plans';

interface PoolsPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAdditionalPools: number;
  poolStatus: PoolStatus;
  onPurchase: (packageSize: 500 | 1000) => Promise<boolean>;
  onUpgrade: () => void;
}

export function PoolsPurchaseModal({
  open,
  onOpenChange,
  currentAdditionalPools,
  poolStatus,
  onPurchase,
  onUpgrade,
}: PoolsPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<500 | 1000 | null>(null);
  const [loading, setLoading] = useState(false);
  
  const packages = getAvailablePoolPackages(currentAdditionalPools);
  const anyAvailable = packages.some(p => p.available);
  const allRequireUpsell = packages.every(p => p.requiresUpsell);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    try {
      const success = await onPurchase(selectedPackage);
      if (success) {
        onOpenChange(false);
        setSelectedPackage(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Comprar Pools Adicionais
          </DialogTitle>
          <DialogDescription>
            Adicione mais ativações ao seu plano mensal
          </DialogDescription>
        </DialogHeader>

        {/* Current Status */}
        <div className="p-3 rounded-lg bg-muted/50 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pools adicionais contratados:</span>
            <span className="font-bold font-mono-data">
              {currentAdditionalPools}/1.000
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Disponível para compra:</span>
            <span className="font-bold font-mono-data text-primary">
              +{poolStatus.maxAdditionalAllowed}
            </span>
          </div>
        </div>

        {/* Upsell Required Message */}
        {allRequireUpsell && (
          <div className="p-4 rounded-lg bg-warning/20 border border-warning/30 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning">Upsell obrigatório</p>
                <p className="text-sm text-warning/80 mt-1">
                  Você atingiu o limite de pools adicionais (1.000/mês). 
                  Para mais ativações, faça upgrade do seu plano.
                </p>
              </div>
            </div>
            <Button 
              variant="iara" 
              className="w-full mt-4"
              onClick={onUpgrade}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Fazer Upgrade do Plano
            </Button>
          </div>
        )}

        {/* Package Options */}
        {!allRequireUpsell && (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={cn(
                  "p-4 cursor-pointer transition-all",
                  pkg.available 
                    ? "hover:border-primary/50" 
                    : "opacity-50 cursor-not-allowed",
                  selectedPackage === pkg.pools && pkg.available && "border-primary bg-primary/5"
                )}
                onClick={() => {
                  if (pkg.available) {
                    setSelectedPackage(pkg.pools as 500 | 1000);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      pkg.available ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Zap className={cn(
                        "h-5 w-5",
                        pkg.available ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        +{pkg.pools.toLocaleString('pt-BR')} Pools
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(pkg.price)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {pkg.available ? (
                      selectedPackage === pkg.pools ? (
                        <Badge variant="default" className="bg-primary">
                          <Check className="h-3 w-3 mr-1" />
                          Selecionado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Disponível</Badge>
                      )
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Indisponível
                      </Badge>
                    )}
                  </div>
                </div>
                
                {!pkg.available && (
                  <p className="text-xs text-destructive mt-2">
                    {pkg.message}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          {!allRequireUpsell && (
            <Button
              variant="iara"
              onClick={handlePurchase}
              disabled={!selectedPackage || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Comprar {selectedPackage ? `+${selectedPackage}` : ''} Pools
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
