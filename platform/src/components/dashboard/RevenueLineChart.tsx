import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from '@/components/ui/card';
import type { MonthlyRevenue } from '@/lib/dashboardData';

interface RevenueLineChartProps {
  data: MonthlyRevenue[];
  title?: string;
  showGoal?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-mono-data" style={{ color: entry.color }}>
            {entry.name === 'revenue' ? 'Receita' : 'Meta'}: R$ {entry.value.toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueLineChart({ data, title = "Evolução da Receita", showGoal = false }: RevenueLineChartProps) {
  return (
    <Card className="iara-card-glow">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(142, 76%, 45%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            {showGoal && (
              <Line
                type="monotone"
                dataKey="goal"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {showGoal && (
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-warning" style={{ borderStyle: 'dashed' }} />
            <span className="text-sm text-muted-foreground">Meta</span>
          </div>
        </div>
      )}
    </Card>
  );
}
