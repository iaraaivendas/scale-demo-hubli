import { Card } from '@/components/ui/card';
import { Calendar, TrendingUp, Wallet } from 'lucide-react';
import type { YearlyComparison } from '@/lib/financialComparative';
import { formatReaisBRL } from '@/lib/financialComparative';

interface YearlyRevenueKPIsProps {
  yearlyData: YearlyComparison;
  currentMonthLabel?: string;
}

export function YearlyRevenueKPIs({ yearlyData, currentMonthLabel }: YearlyRevenueKPIsProps) {
  const { year, months, totalReais } = yearlyData;
  
  // Média mensal
  const averageMonthly = months.length > 0 ? totalReais / months.length : 0;
  
  // Melhor mês
  const bestMonth = months.reduce((best, current) => 
    current.revenueReais > (best?.revenueReais || 0) ? current : best
  , months[0]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Receita Total do Ano */}
      <Card className="iara-card-glow bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Receita Total {year}
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-primary font-mono-data">
              {formatReaisBRL(totalReais)}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-primary/20 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {months.length} {months.length === 1 ? 'mês' : 'meses'} contabilizados
        </p>
      </Card>

      {/* Média Mensal */}
      <Card className="iara-card-glow">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Média Mensal
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-info font-mono-data">
              {formatReaisBRL(averageMonthly)}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-info/20 text-info">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Baseado em {months.length} {months.length === 1 ? 'mês' : 'meses'}
        </p>
      </Card>

      {/* Melhor Mês */}
      <Card className="iara-card-glow">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Melhor Mês
            </p>
            <p className="text-2xl lg:text-3xl font-bold text-warning font-mono-data">
              {bestMonth ? formatReaisBRL(bestMonth.revenueReais) : 'N/A'}
            </p>
          </div>
          <div className="rounded-lg p-2.5 bg-warning/20 text-warning">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {bestMonth?.monthLabel || 'Sem dados'}
        </p>
      </Card>
    </div>
  );
}
