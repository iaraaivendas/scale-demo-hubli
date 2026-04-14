import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, DollarSign, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/financialData";
import {
  calculateFinancialForecast,
  type ForecastScenario,
  type ForecastPeriod,
  getScenarioLabel,
} from "@/lib/forecastEngine";
import { ForecastScenarioSelector } from "./ForecastScenarioSelector";
import { ForecastKPICard } from "./ForecastKPICard";
import { ForecastAlertsList } from "./ForecastAlertsList";

interface FinancialForecastDashboardProps {
  clientId: string;
}

export function FinancialForecastDashboard({ clientId }: FinancialForecastDashboardProps) {
  const [scenario, setScenario] = useState<ForecastScenario>('realistic');
  const [period, setPeriod] = useState<ForecastPeriod>(90);

  const forecast = useMemo(
    () => calculateFinancialForecast(clientId, period, scenario),
    [clientId, period, scenario]
  );

  const chartData = forecast.monthlyData.map(d => ({
    name: d.monthLabel,
    revenue: d.revenue / 100,
    expenses: d.expenses / 100,
    result: d.result / 100,
    isProjected: d.isProjected,
    goal: forecast.monthlyGoal / 100,
  }));

  // Encontrar o índice onde começa a projeção
  const projectionStartIndex = chartData.findIndex(d => d.isProjected);

  const TrendIcon = forecast.recentTrend === 'up' 
    ? TrendingUp 
    : forecast.recentTrend === 'down' 
    ? TrendingDown 
    : Minus;

  const trendColor = forecast.recentTrend === 'up' 
    ? 'text-primary' 
    : forecast.recentTrend === 'down' 
    ? 'text-destructive' 
    : 'text-muted-foreground';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isProjected = payload[0]?.payload?.isProjected;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            {label}
            {isProjected && (
              <span className="text-xs bg-info/20 text-info px-2 py-0.5 rounded">
                Projetado
              </span>
            )}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-mono-data" style={{ color: entry.color }}>
              {entry.name}: R$ {entry.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header com Cenário e Período */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Forecast Financeiro
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Projeção de receita, despesas e resultado • Cenário {getScenarioLabel(scenario)}
          </p>
        </div>
        <ForecastScenarioSelector
          scenario={scenario}
          period={period}
          onScenarioChange={setScenario}
          onPeriodChange={setPeriod}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ForecastKPICard
          title="Receita Projetada"
          value={forecast.projectedRevenue}
          isCurrency
          trend={forecast.recentTrend}
          trendValue={`${forecast.averageGrowthRate >= 0 ? '+' : ''}${forecast.averageGrowthRate.toFixed(1)}%`}
          variant="success"
        />
        <ForecastKPICard
          title="Despesa Projetada"
          value={forecast.projectedExpenses}
          isCurrency
          variant="warning"
        />
        <ForecastKPICard
          title="Resultado Projetado"
          value={forecast.projectedResult}
          isCurrency
          variant={forecast.projectedResult >= 0 ? 'success' : 'danger'}
        />
        <ForecastKPICard
          title="% da Meta Anual"
          value={forecast.goalAchievementPercent}
          isPercent
          subtitle={`Diferença: ${formatCurrency(forecast.goalDifference)}`}
          variant={forecast.goalAchievementPercent >= 100 ? 'success' : forecast.goalAchievementPercent >= 80 ? 'warning' : 'danger'}
        />
      </div>

      {/* Gráfico Principal - Receita vs Despesas */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Receita vs Despesas
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Histórico + Projeção ({period} dias)
            </p>
          </div>
          <div className={cn("flex items-center gap-2", trendColor)}>
            <TrendIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {forecast.recentTrend === 'up' ? 'Tendência de Alta' : 
               forecast.recentTrend === 'down' ? 'Tendência de Queda' : 'Estável'}
            </span>
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 24, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="projectedArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Linha de referência onde começa a projeção */}
              {projectionStartIndex > 0 && (
                 <ReferenceLine 
                  x={chartData[projectionStartIndex]?.name}
                  stroke="hsl(var(--info))"
                  strokeDasharray="5 5"
                  label={{
                    value: "▼ Projeção",
                    position: "top",
                    fill: "hsl(var(--info))",
                    fontSize: 10,
                    dy: -8,
                  }}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="revenue"
                name="Receita"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Despesas"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--destructive))' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="goal"
                name="Meta"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico de Resultado */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Resultado Financeiro (Receita - Despesas)
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="resultPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="resultNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Area
                type="monotone"
                dataKey="result"
                name="Resultado"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#resultPositive)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Alertas */}
      {forecast.alerts.length > 0 && (
        <ForecastAlertsList alerts={forecast.alerts} />
      )}
    </div>
  );
}
