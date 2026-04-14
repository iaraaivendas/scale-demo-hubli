import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { Users, Target, TrendingUp, AlertTriangle, Percent, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/financialData";
import {
  calculateCommercialForecast,
  type ForecastScenario,
  type ForecastPeriod,
  getScenarioLabel,
  getStageLabel,
} from "@/lib/forecastEngine";
import { ForecastScenarioSelector } from "./ForecastScenarioSelector";
import { ForecastKPICard } from "./ForecastKPICard";
import { ForecastAlertsList } from "./ForecastAlertsList";

interface CommercialForecastDashboardProps {
  clientId: string;
}

export function CommercialForecastDashboard({ clientId }: CommercialForecastDashboardProps) {
  const [scenario, setScenario] = useState<ForecastScenario>('realistic');
  const [period, setPeriod] = useState<ForecastPeriod>(90);

  const forecast = useMemo(
    () => calculateCommercialForecast(clientId, period, scenario),
    [clientId, period, scenario]
  );

  // Dados para o gráfico de pipeline (funil)
  const pipelineData = forecast.pipeline.map((stage, index) => ({
    name: getStageLabel(stage.stage),
    value: stage.count,
    valueFormatted: stage.count.toString(),
    fill: index === 0 ? 'hsl(var(--info))' : 
          index === 1 ? 'hsl(var(--primary))' : 
          index === 2 ? 'hsl(var(--warning))' : 'hsl(var(--success))',
  }));

  // Dados para o gráfico de vendas mensais
  const salesChartData = forecast.monthlyData.map(d => ({
    name: d.monthLabel,
    leads: d.leads,
    sales: d.sales,
    revenue: d.revenue / 100,
    isProjected: d.isProjected,
  }));

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
              {entry.name}: {entry.name === 'Receita' 
                ? `R$ ${entry.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                : entry.value}
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
            <Users className="h-6 w-6 text-primary" />
            Forecast Comercial
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Projeção de vendas e atingimento de metas • Cenário {getScenarioLabel(scenario)}
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
          title="Vendas Projetadas"
          value={forecast.projectedSales}
          subtitle={`Meta: ${forecast.salesGoal}`}
          trend={forecast.projectedSales >= forecast.salesGoal ? 'up' : 'down'}
          variant={forecast.projectedSales >= forecast.salesGoal ? 'success' : 'warning'}
        />
        <ForecastKPICard
          title="Receita Projetada"
          value={forecast.projectedRevenue}
          isCurrency
          subtitle={`Meta: ${formatCurrency(forecast.revenueGoal)}`}
          variant="success"
        />
        <ForecastKPICard
          title="Probabilidade de Meta"
          value={forecast.goalProbability}
          isPercent
          variant={forecast.goalProbability >= 70 ? 'success' : forecast.goalProbability >= 40 ? 'warning' : 'danger'}
        />
        <ForecastKPICard
          title="Ticket Médio"
          value={forecast.averageTicket}
          isCurrency
          subtitle={`Ciclo: ${forecast.averageSalesCycle} dias`}
        />
      </div>

      {/* Barra de Progresso da Meta */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Progresso da Meta Comercial
            </h3>
          </div>
          <span className="text-lg font-bold font-mono-data text-foreground">
            {forecast.goalAchievementPercent.toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={Math.min(100, forecast.goalAchievementPercent)} 
          className="h-4"
          indicatorClassName={cn(
            forecast.goalAchievementPercent >= 100 ? "bg-primary" :
            forecast.goalAchievementPercent >= 80 ? "bg-warning" : "bg-destructive"
          )}
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>Projetado: {formatCurrency(forecast.projectedRevenue)}</span>
          <span>Meta: {formatCurrency(forecast.revenueGoal)}</span>
        </div>
        {forecast.revenueGap > 0 && (
          <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Gap de {formatCurrency(forecast.revenueGap)} para atingir a meta
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Necessário converter {forecast.requiredConversionRate.toFixed(1)}% dos leads ativos
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline / Funil */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Pipeline de Vendas
          </h3>
          <div className="space-y-4">
            {forecast.pipeline.map((stage, index) => {
              const colors = ['bg-info', 'bg-primary', 'bg-warning', 'bg-success'];
              const maxValue = Math.max(...forecast.pipeline.map(s => s.count));
              const width = maxValue > 0 ? (stage.count / maxValue) * 100 : 0;
              
              return (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{getStageLabel(stage.stage)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {stage.conversionRate.toFixed(0)}% conv.
                      </span>
                      <span className="text-sm font-mono-data font-bold">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500 flex items-center justify-end pr-3", colors[index % colors.length])}
                      style={{ width: `${Math.max(width, 10)}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(stage.value)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Valor Total do Pipeline</span>
              <span className="text-lg font-bold text-primary font-mono-data">
                {formatCurrency(forecast.totalPipelineValue)}
              </span>
            </div>
          </div>
        </Card>

        {/* Métricas Históricas */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Métricas Comerciais
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Percent className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-xl font-bold font-mono-data">{forecast.historicalConversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-xl font-bold font-mono-data">{formatCurrency(forecast.averageTicket)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ciclo de Vendas</p>
                  <p className="text-xl font-bold font-mono-data">{forecast.averageSalesCycle} dias</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Leads e Vendas */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Leads vs Vendas (Histórico + Projeção)
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]}>
                {salesChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-leads-${index}`}
                    fill={entry.isProjected ? 'hsl(var(--info))' : 'hsl(var(--muted-foreground))'}
                    opacity={entry.isProjected ? 0.6 : 1}
                  />
                ))}
              </Bar>
              <Bar dataKey="sales" name="Vendas" radius={[4, 4, 0, 0]}>
                {salesChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-sales-${index}`}
                    fill={entry.isProjected ? 'hsl(var(--primary))' : 'hsl(var(--primary))'}
                    opacity={entry.isProjected ? 0.6 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Gráfico de Receita Projetada */}
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Receita Comercial Projetada
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              <Line
                type="monotone"
                dataKey="revenue"
                name="Receita"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
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
