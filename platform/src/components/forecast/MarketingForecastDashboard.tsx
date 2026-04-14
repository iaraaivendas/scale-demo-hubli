import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowRight,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { ForecastScenarioSelector } from "./ForecastScenarioSelector";
import { ForecastKPICard } from "./ForecastKPICard";
import { ForecastAlertsList } from "./ForecastAlertsList";
import {
  calculateMarketingForecast,
  type MarketingForecastPeriod,
  type MarketingForecast,
} from "@/lib/marketingForecastEngine";
import { type ForecastScenario, type ForecastPeriod } from "@/lib/forecastEngine";
import { formatCurrency } from "@/lib/financialData";
import { cn } from "@/lib/utils";

interface MarketingForecastDashboardProps {
  clientId: string;
}

export function MarketingForecastDashboard({ clientId }: MarketingForecastDashboardProps) {
  const [scenario, setScenario] = useState<ForecastScenario>('realistic');
  const [period, setPeriod] = useState<ForecastPeriod>(90);

  const forecast = useMemo(() => {
    return calculateMarketingForecast(clientId, period as MarketingForecastPeriod, scenario);
  }, [clientId, scenario, period]);

  // Dados para o gráfico de linha (leads históricos vs projetados)
  const leadsChartData = forecast.monthlyData.map(d => ({
    month: d.monthLabel,
    leads: d.leads,
    oportunidades: d.opportunities,
    vendas: d.sales,
    isProjected: d.isProjected,
  }));

  // Dados para o gráfico de receita
  const revenueChartData = forecast.monthlyData.map(d => ({
    month: d.monthLabel,
    investimento: d.investment / 100,
    receita: d.revenue / 100,
    roi: d.roi,
    isProjected: d.isProjected,
  }));

  // Dados para o funil
  const funnelData = [
    { name: 'Investimento', value: forecast.projectedFunnel.investment / 100, color: 'hsl(var(--muted-foreground))' },
    { name: 'Leads', value: forecast.projectedFunnel.leads, color: 'hsl(var(--info))' },
    { name: 'Oportunidades', value: forecast.projectedFunnel.opportunities, color: 'hsl(var(--warning))' },
    { name: 'Vendas', value: forecast.projectedFunnel.sales, color: 'hsl(var(--primary))' },
    { name: 'Receita', value: forecast.projectedFunnel.revenue / 100, color: 'hsl(var(--chart-1))' },
  ];

  // Dados por canal
  const channelData = forecast.channelForecasts.map(c => ({
    channel: c.channel,
    historico: c.historicalLeads,
    projetado: c.projectedLeads,
    cpl: c.cpl / 100,
    conversao: c.conversionRate,
  }));

  const getVariantFromGoal = () => {
    if (forecast.goalContribution >= 100) return 'success';
    if (forecast.goalContribution >= 70) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Cenário e Período */}
      <ForecastScenarioSelector
        scenario={scenario}
        period={period}
        onScenarioChange={setScenario}
        onPeriodChange={setPeriod}
      />

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ForecastKPICard
          title="Leads Projetados"
          value={forecast.projectedLeads}
          subtitle={`Próximos ${period} dias`}
          size="sm"
        />
        <ForecastKPICard
          title="Oportunidades"
          value={forecast.projectedOpportunities}
          subtitle={`${forecast.historicalConversionLeadToOpp.toFixed(0)}% conversão`}
          size="sm"
        />
        <ForecastKPICard
          title="Vendas Previstas"
          value={forecast.projectedSales}
          subtitle={`${forecast.historicalConversionOppToSale.toFixed(0)}% fechamento`}
          size="sm"
        />
        <ForecastKPICard
          title="Receita Projetada"
          value={forecast.projectedRevenue}
          isCurrency
          size="sm"
          variant={getVariantFromGoal()}
        />
        <ForecastKPICard
          title="CPL Médio"
          value={forecast.historicalCPL}
          isCurrency
          subtitle="Custo por Lead"
          size="sm"
        />
        <ForecastKPICard
          title="ROI Projetado"
          value={forecast.projectedROI}
          isPercent
          trend={forecast.projectedROI > 0 ? 'up' : 'down'}
          size="sm"
          variant={forecast.projectedROI > 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Funil de Marketing Projetado */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Funil de Marketing Projetado</h3>
          <Badge variant="outline" className="ml-2">
            {period} dias
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {funnelData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              <div 
                className="flex flex-col items-center p-4 rounded-lg border bg-card min-w-[120px]"
                style={{ borderColor: item.color }}
              >
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {item.name}
                </span>
                <span 
                  className="text-2xl font-bold font-mono-data"
                  style={{ color: item.color }}
                >
                  {item.name === 'Investimento' || item.name === 'Receita'
                    ? formatCurrency(item.value * 100)
                    : item.value.toLocaleString('pt-BR')
                  }
                </span>
              </div>
              {index < funnelData.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Contribuição para Meta + Gap Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Contribuição para Meta</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Receita projetada vs Meta</span>
                <span className={cn(
                  "font-mono-data font-medium",
                  forecast.goalContribution >= 100 ? "text-primary" : "text-warning"
                )}>
                  {forecast.goalContribution.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(forecast.goalContribution, 100)} 
                className="h-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <span className="text-xs text-muted-foreground">Receita Projetada</span>
                <p className="text-lg font-bold font-mono-data text-foreground">
                  {formatCurrency(forecast.projectedRevenue)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Meta de Receita</span>
                <p className="text-lg font-bold font-mono-data text-foreground">
                  {formatCurrency(forecast.revenueGoal)}
                </p>
              </div>
            </div>

            {!forecast.isSufficientForGoal && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-warning">Ação Necessária</p>
                    <p className="text-muted-foreground mt-1">
                      Para bater a meta, são necessários mais {forecast.leadsGap} leads. 
                      Investimento adicional estimado: {formatCurrency(forecast.investmentGap)}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Métricas de Eficiência</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">CPL Histórico</span>
                <p className="text-xl font-bold font-mono-data text-foreground">
                  {formatCurrency(forecast.historicalCPL)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">Ticket Médio</span>
                <p className="text-xl font-bold font-mono-data text-foreground">
                  {formatCurrency(forecast.historicalTicket)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">Conv. Lead → Opp</span>
                <p className="text-xl font-bold font-mono-data text-foreground">
                  {forecast.historicalConversionLeadToOpp.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">Conv. Opp → Venda</span>
                <p className="text-xl font-bold font-mono-data text-foreground">
                  {forecast.historicalConversionOppToSale.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xs text-muted-foreground">ROI Histórico</span>
              <p className={cn(
                "text-2xl font-bold font-mono-data",
                forecast.historicalROI > 0 ? "text-primary" : "text-destructive"
              )}>
                {forecast.historicalROI.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Leads */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Leads Históricos vs Projetados
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadsChartData}>
                <defs>
                  <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="hsl(var(--info))"
                  fill="url(#leadsGradient)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  name="Vendas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico de ROI */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Investimento vs Receita
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Legend />
                <Bar 
                  dataKey="investimento" 
                  name="Investimento" 
                  fill="hsl(var(--muted-foreground))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="receita" 
                  name="Receita" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Performance por Canal */}
      {channelData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Forecast por Canal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Canal</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Leads Históricos</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Leads Projetados</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">CPL</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground uppercase tracking-wider">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {channelData.map((channel) => (
                  <tr key={channel.channel} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium text-foreground">{channel.channel}</td>
                    <td className="py-3 px-4 text-right font-mono-data">{channel.historico}</td>
                    <td className="py-3 px-4 text-right font-mono-data text-primary">{channel.projetado}</td>
                    <td className="py-3 px-4 text-right font-mono-data">R$ {channel.cpl.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono-data">{channel.conversao.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Alertas */}
      <ForecastAlertsList alerts={forecast.alerts} />
    </div>
  );
}
