import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { Card } from '@/components/ui/card';
import type { MonthlyRevenueData } from '@/lib/financialComparative';
import { formatReaisBRL } from '@/lib/financialComparative';

interface AccumulatedRevenueChartProps {
  data: MonthlyRevenueData[];
  title?: string;
  highlightCurrentMonth?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        <p className="text-sm font-mono-data text-primary">
          Receita do Mês: {formatReaisBRL(data.revenueReais)}
        </p>
        <p className="text-sm font-mono-data text-info font-bold">
          Acumulado: {formatReaisBRL(data.accumulatedReais)}
        </p>
      </div>
    );
  }
  return null;
};

export function AccumulatedRevenueChart({ 
  data, 
  title = "Receita Acumulada no Ano",
  highlightCurrentMonth = true,
}: AccumulatedRevenueChartProps) {
  // Prepara dados para o gráfico
  const chartData = data.map((d, index) => ({
    ...d,
    month: d.monthLabel,
    accumulated: d.accumulatedReais,
    isCurrentMonth: index === data.length - 1,
  }));

  // Ponto do mês atual
  const currentMonthData = chartData[chartData.length - 1];

  return (
    <Card className="iara-card-glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        {currentMonthData && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Acumulado</p>
            <p className="text-lg font-bold text-info font-mono-data">
              {formatReaisBRL(currentMonthData.accumulatedReais)}
            </p>
          </div>
        )}
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="accumulated"
              stroke="hsl(199, 89%, 48%)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAccumulated)"
            />
            {/* Destaque do mês atual */}
            {highlightCurrentMonth && currentMonthData && (
              <ReferenceDot
                x={currentMonthData.month}
                y={currentMonthData.accumulated}
                r={8}
                fill="hsl(142, 76%, 45%)"
                stroke="white"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-info" />
          <span className="text-xs text-muted-foreground">Receita Acumulada</span>
        </div>
        {highlightCurrentMonth && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Mês Atual</span>
          </div>
        )}
      </div>
    </Card>
  );
}
