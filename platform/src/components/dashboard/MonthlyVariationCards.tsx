import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthlyVariation } from '@/lib/financialComparative';
import { formatReaisBRL, formatVariationPercent } from '@/lib/financialComparative';

interface MonthlyVariationCardsProps {
  variation: MonthlyVariation;
}

export function MonthlyVariationCards({ variation }: MonthlyVariationCardsProps) {
  const {
    currentMonthRevenueReais,
    currentMonthLabel,
    previousMonthRevenueReais,
    previousMonthLabel,
    absoluteVariationReais,
    percentualVariation,
    isPositive,
  } = variation;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Receita do Mês Atual */}
      <Card className="iara-card-glow">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Receita {currentMonthLabel}
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-primary font-mono-data">
              {formatReaisBRL(currentMonthRevenueReais)}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-primary/20 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Mês atual</p>
      </Card>

      {/* Receita do Mês Anterior */}
      <Card className="iara-card-glow">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Receita {previousMonthLabel}
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-muted-foreground font-mono-data">
              {formatReaisBRL(previousMonthRevenueReais)}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-muted text-muted-foreground">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Mês anterior</p>
      </Card>

      {/* Variação Absoluta (R$) */}
      <Card className="iara-card-glow overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Variação (R$)
            </p>
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <ArrowUp className={cn("h-4 w-4 flex-shrink-0", isPositive ? "text-primary" : "text-destructive")} />
              ) : (
                <ArrowDown className={cn("h-4 w-4 flex-shrink-0", isPositive ? "text-primary" : "text-destructive")} />
              )}
              <p className={cn(
                "text-xl lg:text-2xl font-bold font-mono-data truncate",
                isPositive ? "text-primary" : "text-destructive"
              )}>
                {isPositive ? '+' : ''}{formatReaisBRL(absoluteVariationReais)}
              </p>
            </div>
          </div>
          <div className={cn(
            "rounded-lg p-2 flex-shrink-0",
            isPositive ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
          )}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 truncate">
          Diferença vs {previousMonthLabel}
        </p>
      </Card>

      {/* Variação Percentual (%) */}
      <Card className="iara-card-glow overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Variação (%)
            </p>
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <ArrowUp className={cn("h-4 w-4 flex-shrink-0", isPositive ? "text-primary" : "text-destructive")} />
              ) : (
                <ArrowDown className={cn("h-4 w-4 flex-shrink-0", isPositive ? "text-primary" : "text-destructive")} />
              )}
              <p className={cn(
                "text-xl lg:text-2xl font-bold font-mono-data truncate",
                isPositive ? "text-primary" : "text-destructive"
              )}>
                {formatVariationPercent(percentualVariation)}
              </p>
            </div>
          </div>
          <div className={cn(
            "rounded-lg p-2 flex-shrink-0",
            isPositive ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
          )}>
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Crescimento mensal
        </p>
      </Card>
    </div>
  );
}
