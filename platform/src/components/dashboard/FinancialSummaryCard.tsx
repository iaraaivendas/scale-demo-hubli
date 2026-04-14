import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialSummaryCardProps {
  mrr: number;
  arr: number;
  monthlyGrowth: number;
  churnPercent?: number;
  runRate?: number;
  title?: string;
}

export function FinancialSummaryCard({
  mrr,
  arr,
  monthlyGrowth,
  churnPercent = 0,
  runRate,
  title = "Resumo Financeiro",
}: FinancialSummaryCardProps) {
  const isGrowthPositive = monthlyGrowth >= 0;
  
  return (
    <Card className="iara-card-glow">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* MRR */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase">MRR</span>
          </div>
          <p className="text-2xl font-bold text-primary font-mono-data">
            R$ {mrr.toLocaleString('pt-BR')}
          </p>
        </div>
        
        {/* ARR */}
        <div className="p-4 rounded-lg bg-info/5 border border-info/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-info" />
            <span className="text-xs text-muted-foreground uppercase">ARR</span>
          </div>
          <p className="text-2xl font-bold text-info font-mono-data">
            R$ {arr.toLocaleString('pt-BR')}
          </p>
        </div>
        
        {/* Crescimento MoM */}
        <div className={cn(
          "p-4 rounded-lg border",
          isGrowthPositive ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {isGrowthPositive ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground uppercase">Crescimento MoM</span>
          </div>
          <p className={cn(
            "text-2xl font-bold font-mono-data",
            isGrowthPositive ? "text-primary" : "text-destructive"
          )}>
            {isGrowthPositive ? '+' : ''}{monthlyGrowth.toFixed(1)}%
          </p>
        </div>
        
        {/* Churn ou Run Rate */}
        {runRate !== undefined ? (
          <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground uppercase">Projeção</span>
            </div>
            <p className="text-2xl font-bold text-warning font-mono-data">
              R$ {runRate.toLocaleString('pt-BR')}
            </p>
          </div>
        ) : (
          <div className={cn(
            "p-4 rounded-lg border",
            churnPercent <= 5 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase">Churn</span>
            </div>
            <p className={cn(
              "text-2xl font-bold font-mono-data",
              churnPercent <= 5 ? "text-primary" : "text-destructive"
            )}>
              {churnPercent.toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
