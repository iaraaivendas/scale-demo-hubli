import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import type { MonthlyRevenue } from '@/lib/dashboardData';

interface RevenueBarChartProps {
  data: MonthlyRevenue[];
  title?: string;
  useCentavos?: boolean; // Se true, usa revenueCentavos para comparações
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const revenue = data.revenue;
    const goal = data.goal;
    const achieved = goal > 0 ? ((revenue / goal) * 100).toFixed(1) : 0;
    
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-primary font-mono-data">
          Receita: R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-muted-foreground font-mono-data">
          Meta: R$ {goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {achieved}% da meta
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueBarChart({ data, title = "Receita Mensal", useCentavos = false }: RevenueBarChartProps) {
  // Compara usando centavos se disponível, senão usa reais
  const compareData = data.map(d => ({
    ...d,
    reachedGoal: useCentavos 
      ? (d.revenueCentavos || d.revenue * 100) >= (d.goalCentavos || d.goal * 100)
      : d.revenue >= d.goal
  }));
  
  return (
    <Card className="iara-card-glow">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={compareData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="monthLabel" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(142, 50%, 15%, 0.3)' }} />
            <Bar 
              dataKey="revenue" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {compareData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.reachedGoal ? 'hsl(142, 76%, 45%)' : 'hsl(142, 40%, 30%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 76%, 45%)' }} />
          <span className="text-xs text-muted-foreground">Meta atingida</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 40%, 30%)' }} />
          <span className="text-xs text-muted-foreground">Abaixo da meta</span>
        </div>
      </div>
    </Card>
  );
}
