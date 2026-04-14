import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import type { MonthlyRevenueData } from '@/lib/financialComparative';
import { formatReaisBRL } from '@/lib/financialComparative';

interface AnnualComparisonChartProps {
  data: MonthlyRevenueData[];
  title?: string;
  showAccumulated?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-mono-data" style={{ color: entry.color }}>
            {entry.name}: {formatReaisBRL(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnnualComparisonChart({ 
  data, 
  title = "Comparativo Anual de Receita",
  showAccumulated = true,
}: AnnualComparisonChartProps) {
  // Prepara dados para o gráfico
  const chartData = data.map(d => ({
    month: d.monthLabel,
    'Receita Mensal': d.revenueReais,
    'Receita Acumulada': d.accumulatedReais,
  }));

  // Calcula o máximo para o eixo Y (usa o acumulado se estiver visível)
  const maxValue = Math.max(
    ...data.map(d => showAccumulated ? d.accumulatedReais : d.revenueReais)
  );

  return (
    <Card className="iara-card-glow">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
            <Bar 
              dataKey="Receita Mensal" 
              fill="hsl(142, 76%, 45%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            {showAccumulated && (
              <Line
                type="monotone"
                dataKey="Receita Acumulada"
                stroke="hsl(199, 89%, 48%)"
                strokeWidth={3}
                dot={{ fill: 'hsl(199, 89%, 48%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(199, 89%, 48%)' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
