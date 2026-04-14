import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  getSession,
  getLeads,
  getCampaigns,
  getUsers,
  getClient,
  initializeDemoData,
  type Lead,
  type Campaign,
  type User,
  type Client,
} from "@/lib/storage";
import {
  calculateExpansionMetrics,
  generateActionableInsights,
  calculateModuleUsage,
  calculateROI,
  calculatePredictiveScore,
  type ExpansionMetrics,
  type ActionableInsight,
  type ModuleUsage,
  type ROICalculation,
} from "@/lib/expansionMetrics";
import {
  getFinancialMetrics,
  getMarketingMetrics,
  getGoalsMetrics,
  getSmartAlerts,
  type FinancialMetrics,
  type MarketingMetrics,
  type GoalsMetrics,
  type TimePeriod,
  type SmartAlert,
} from "@/lib/dashboardData";
import { formatROI, getROIColorClass } from "@/lib/financialData";
import {
  getComparativeFinancialData,
  type ComparativeFinancialData,
} from "@/lib/financialComparative";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Activity,
  Loader2,
  Lightbulb,
  DollarSign,
  LayoutDashboard,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { OpportunitiesPanel } from "@/components/analytics/OpportunitiesPanel";
import { ExpansionMetricsPanel } from "@/components/analytics/ExpansionMetricsPanel";
import { ActionableInsightCard } from "@/components/analytics/ActionableInsightCard";
import { UsageHeatmap } from "@/components/analytics/UsageHeatmap";
import { ROICounter } from "@/components/analytics/ROICounter";
import { PoolThresholdBar } from "@/components/analytics/PoolThresholdBar";
import { PredictiveScoreCard } from "@/components/analytics/PredictiveScoreCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueBarChart } from "@/components/dashboard/RevenueBarChart";
import { RevenueLineChart } from "@/components/dashboard/RevenueLineChart";
import { GoalProgressChart } from "@/components/dashboard/GoalProgressChart";
import { ChannelDistributionChart } from "@/components/dashboard/ChannelDistributionChart";
import { LeadsLineChart } from "@/components/dashboard/LeadsLineChart";
import { LeadsByCampaignChart } from "@/components/dashboard/LeadsByCampaignChart";
import { CampaignPerformanceTable } from "@/components/dashboard/CampaignPerformanceTable";
import { AnnualComparisonChart } from "@/components/dashboard/AnnualComparisonChart";
import { AccumulatedRevenueChart } from "@/components/dashboard/AccumulatedRevenueChart";
import { MonthlyVariationCards } from "@/components/dashboard/MonthlyVariationCards";
import { YearlyRevenueKPIs } from "@/components/dashboard/YearlyRevenueKPIs";
import { DataProvider } from "@/contexts/DataContext";
import { RealtimeIndicator, AlertsPanel, SimulatorControls } from "@/components/widgets";
import { RevenueScoreDashboard } from "@/components/analytics/RevenueScoreDashboard";

export default function Analytics() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  // Expansion metrics state
  const [expansionMetrics, setExpansionMetrics] = useState<ExpansionMetrics | null>(null);
  const [insights, setInsights] = useState<ActionableInsight[]>([]);
  const [moduleUsage, setModuleUsage] = useState<ModuleUsage[]>([]);
  const [roi, setROI] = useState<ROICalculation | null>(null);
  const [selectedLeadForScore, setSelectedLeadForScore] = useState<Lead | null>(null);
  
  // New dashboard metrics
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [marketingMetrics, setMarketingMetrics] = useState<MarketingMetrics | null>(null);
  const [goalsMetrics, setGoalsMetrics] = useState<GoalsMetrics | null>(null);
  const [comparativeData, setComparativeData] = useState<ComparativeFinancialData | null>(null);
  
  // Filters
  const [period, setPeriod] = useState<TimePeriod>('year');
  const [channel, setChannel] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  
  const activeTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    initializeDemoData();
    
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const clientData = getClient(session.clientId);
    const clientUsers = getUsers(session.clientId);
    const userData = clientUsers.find(u => u.role === 'gestor') || clientUsers[0];
    
    setUser(userData);
    setClient(clientData);

    if (userData?.role === "vendedor") {
      navigate("/dashboard");
      return;
    }

    if (clientData && userData) {
      const clientLeads = getLeads(session.clientId, userData.id, userData.role);
      setLeads(clientLeads);
      setCampaigns(getCampaigns(session.clientId));
      
      // Calculate expansion metrics
      setExpansionMetrics(calculateExpansionMetrics(session.clientId, clientData));
      setInsights(generateActionableInsights(session.clientId, clientData));
      setModuleUsage(calculateModuleUsage(session.clientId));
      setROI(calculateROI(session.clientId, clientData));
      
      // Calculate new dashboard metrics
      setFinancialMetrics(getFinancialMetrics(session.clientId));
      setMarketingMetrics(getMarketingMetrics(session.clientId));
      setGoalsMetrics(getGoalsMetrics(session.clientId));
      
      // Calculate comparative financial data
      setComparativeData(getComparativeFinancialData(session.clientId));
      
      // Set first high-score lead for predictive score demo
      const highScoreLead = clientLeads.find(l => l.score >= 70);
      setSelectedLeadForScore(highScoreLead || clientLeads[0] || null);
    }
    
    setLoading(false);
  }, [navigate]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleInsightAction = (insight: ActionableInsight) => {
    toast({
      title: "Ação Iniciada",
      description: `${insight.actionLabel} para ${insight.entityName}`,
    });
    
    if (insight.entityType === 'lead') {
      navigate('/leads');
    }
  };

  const handleUpgrade = () => {
    toast({
      title: "Solicitação de Upgrade",
      description: "Nossa equipe entrará em contato em breve.",
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Calculate analytics
  const statusBreakdown = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const scoreDistribution = {
    high: leads.filter((l) => l.score >= 70).length,
    medium: leads.filter((l) => l.score >= 40 && l.score < 70).length,
    low: leads.filter((l) => l.score < 40).length,
  };

  const canViewFinancials = user?.role === "gestor";

  const statusLabels: Record<string, string> = {
    new: "Novo",
    qualified: "Qualificado",
    nurturing: "Nutrição",
    cold: "Frio",
    converted: "Convertido",
    lost: "Perdido",
  };

  const statusColors: Record<string, string> = {
    new: "bg-info",
    qualified: "bg-primary",
    nurturing: "bg-secondary",
    cold: "bg-muted-foreground",
    converted: "bg-primary",
    lost: "bg-destructive",
  };

  // Get unique channels from campaigns
  const uniqueChannels = [...new Set(campaigns.map(c => c.channel))];
  
  // Filter data based on selected filters
  const filteredRevenueHistory = financialMetrics 
    ? period === 'month' 
      ? financialMetrics.revenueHistory.slice(-1)
      : period === 'quarter'
      ? financialMetrics.revenueHistory.slice(-3)
      : financialMetrics.revenueHistory
    : [];

  const filteredCampaignPerformance = marketingMetrics 
    ? marketingMetrics.campaignPerformance.filter(c => {
        if (channel !== 'all' && c.channel !== channel) return false;
        if (campaignFilter !== 'all' && c.id !== campaignFilter) return false;
        return true;
      })
    : [];

  return (
    <DataProvider clientId={client?.id}>
      <AppLayout>
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Dashboards interativos e métricas de {client?.name}
              </p>
            </div>
            {/* Realtime Indicator */}
            <div className="flex items-center gap-3">
              <SimulatorControls compact />
              <RealtimeIndicator showControls />
            </div>
          </div>

          {/* Realtime Alerts Panel */}
          <AlertsPanel maxVisible={3} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-card border border-border flex-wrap h-auto p-1">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="revenue-score" className="gap-2">
                <Zap className="h-4 w-4" />
                Revenue Score
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="marketing" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-2">
                <Target className="h-4 w-4" />
                Metas
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab - Original Analytics Content */}
          <TabsContent value="overview" className="space-y-6">
            {/* Actionable Insights - Top Priority */}
            {insights.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warning" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Insights Acionáveis
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-semibold">
                    {insights.length} alertas
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {insights.slice(0, 4).map((insight) => (
                    <ActionableInsightCard
                      key={insight.id}
                      insight={insight}
                      onAction={handleInsightAction}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Expansion Metrics */}
            {expansionMetrics && canViewFinancials && (
              <ExpansionMetricsPanel metrics={expansionMetrics} />
            )}

            {/* Pool Threshold Bar */}
            {client && (
              <PoolThresholdBar
                used={client.poolsUsed}
                limit={(client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0)}
                plan={client.plan}
                onUpgrade={handleUpgrade}
              />
            )}

            {/* ROI Counter + Usage Heatmap + Predictive Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {roi && canViewFinancials && (
                <ROICounter
                  roi={roi}
                  clientName={client?.name}
                />
              )}
              
              <UsageHeatmap modules={moduleUsage} />
              
              {selectedLeadForScore && client && (
                <PredictiveScoreCard
                  leadName={selectedLeadForScore.name}
                  predictiveScore={calculatePredictiveScore(selectedLeadForScore, client)}
                  lead={selectedLeadForScore}
                  onAction={() => {
                    toast({
                      title: "Tarefa Criada",
                      description: `Tarefa de contato com ${selectedLeadForScore.name} criada no CRM.`,
                    });
                  }}
                />
              )}
            </div>

            {/* Upsell/Cross-sell Opportunities Panel */}
            <OpportunitiesPanel leads={leads} canViewFinancials={canViewFinancials} />

            {/* Lead Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="iara-card-glow">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    Distribuição por Status
                  </h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(statusBreakdown).map(([status, count]) => {
                    const percentage = Math.round((count / leads.length) * 100) || 0;
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {statusLabels[status] || status}
                          </span>
                          <span className="font-mono-data">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              statusColors[status] || "bg-muted-foreground"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="iara-card-glow">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">
                    Distribuição de Score
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-3xl font-bold text-primary font-mono-data">
                      {scoreDistribution.high}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Score Alto</p>
                    <p className="text-xs text-primary mt-0.5">≥70</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <p className="text-3xl font-bold text-warning font-mono-data">
                      {scoreDistribution.medium}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Score Médio</p>
                    <p className="text-xs text-warning mt-0.5">40-69</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted border border-border">
                    <p className="text-3xl font-bold text-muted-foreground font-mono-data">
                      {scoreDistribution.low}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Score Baixo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">&lt;40</p>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Score Médio Geral</span>
                  </div>
                  <p className="text-3xl font-bold text-primary font-mono-data mt-2">
                    {leads.length > 0
                      ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length)
                      : 0}
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Score Dashboard - NEW */}
          <TabsContent value="revenue-score" className="space-y-6">
            {client && (
              <RevenueScoreDashboard clientId={client.id} />
            )}
          </TabsContent>


          {/* Financial Dashboard */}
          <TabsContent value="financial" className="space-y-6">
            <DashboardFilters period={period} onPeriodChange={setPeriod} />
            
            {financialMetrics && goalsMetrics && comparativeData && (
              <>
                {/* Monthly Variation KPIs - Comparativo Mês Atual vs Anterior */}
                <MonthlyVariationCards variation={comparativeData.monthlyVariation} />

                {/* Yearly Revenue KPIs */}
                <YearlyRevenueKPIs 
                  yearlyData={comparativeData.yearlyData}
                  currentMonthLabel={comparativeData.monthlyVariation.currentMonthLabel}
                />

                {/* Annual Comparison Chart - Gráfico de Barras + Linha Acumulada */}
                <AnnualComparisonChart 
                  data={comparativeData.accumulatedRevenueData}
                  title="Comparativo Anual de Receita"
                  showAccumulated={true}
                />

                {/* Charts Row - Receita Acumulada + Meta Anual */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AccumulatedRevenueChart 
                    data={comparativeData.accumulatedRevenueData}
                    title="Receita Acumulada no Ano"
                    highlightCurrentMonth={true}
                  />
                  <GoalProgressChart
                    achieved={financialMetrics.yearlyRevenue}
                    goal={financialMetrics.yearlyGoal}
                    title="Meta Anual"
                    variant="donut"
                    size="lg"
                  />
                </div>

                {/* Additional Financial KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    label="MRR"
                    value={financialMetrics.mrr}
                    prefix="R$ "
                    icon={DollarSign}
                    variant="primary"
                  />
                  <KPICard
                    label="ARR"
                    value={financialMetrics.arr}
                    prefix="R$ "
                    icon={TrendingUp}
                    variant="success"
                  />
                  <KPICard
                    label="Ticket Médio"
                    value={financialMetrics.averageTicket}
                    prefix="R$ "
                    variant="info"
                  />
                  <KPICard
                    label="Meta Anual"
                    value={`${financialMetrics.yearlyGoalProgress}%`}
                    suffix=" atingido"
                    icon={Target}
                    variant={financialMetrics.yearlyGoalProgress >= 80 ? "success" : "warning"}
                  />
                </div>

                {/* Revenue vs Goal Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RevenueLineChart 
                    data={filteredRevenueHistory}
                    title="Receita Mensal ao Longo do Ano"
                  />
                  <RevenueBarChart 
                    data={filteredRevenueHistory}
                    title="Comparativo: Receita x Meta"
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Marketing Dashboard */}
          <TabsContent value="marketing" className="space-y-6">
            <DashboardFilters 
              period={period} 
              onPeriodChange={setPeriod}
              channel={channel}
              onChannelChange={setChannel}
              channels={uniqueChannels}
              campaign={campaignFilter}
              onCampaignChange={setCampaignFilter}
              campaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
            />
            
            {marketingMetrics && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <KPICard
                    label="Leads Gerados"
                    value={marketingMetrics.totalLeads}
                    icon={BarChart3}
                    variant="primary"
                  />
                  <KPICard
                    label="CPL (Custo por Lead)"
                    value={marketingMetrics.costPerLead}
                    prefix="R$ "
                    variant="info"
                  />
                  <KPICard
                    label="Taxa de Conversão"
                    value={marketingMetrics.conversionRate}
                    suffix="%"
                    variant="success"
                  />
                  <KPICard
                    label="Receita Gerada"
                    value={marketingMetrics.totalRevenue}
                    prefix="R$ "
                    icon={DollarSign}
                    variant="primary"
                  />
                  <KPICard
                    label="ROI Médio"
                    value={formatROI(marketingMetrics.averageROI)}
                    variant={marketingMetrics.averageROI > 0 ? "success" : marketingMetrics.averageROI < 0 ? "warning" : "default"}
                    className={getROIColorClass(marketingMetrics.averageROI)}
                    isROI
                  />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LeadsByCampaignChart data={filteredCampaignPerformance} />
                  <LeadsLineChart data={marketingMetrics.leadsOverTime} />
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <CampaignPerformanceTable data={filteredCampaignPerformance} />
                  </div>
                  <ChannelDistributionChart data={marketingMetrics.leadsByChannel} />
                </div>
              </>
            )}
          </TabsContent>

          {/* Goals Dashboard */}
          <TabsContent value="goals" className="space-y-6">
            <DashboardFilters period={period} onPeriodChange={setPeriod} />
            
            {goalsMetrics && financialMetrics && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    label="Meta Mensal"
                    value={goalsMetrics.monthlyGoal}
                    prefix="R$ "
                    icon={Target}
                    variant="info"
                  />
                  <KPICard
                    label="Valor Atingido"
                    value={goalsMetrics.monthlyAchieved}
                    prefix="R$ "
                    icon={TrendingUp}
                    variant="primary"
                  />
                  <KPICard
                    label="Valor Restante"
                    value={goalsMetrics.monthlyRemaining}
                    prefix="R$ "
                    variant={goalsMetrics.monthlyRemaining > 0 ? "warning" : "success"}
                  />
                  <KPICard
                    label="Conclusão"
                    value={goalsMetrics.monthlyProgress}
                    suffix="%"
                    variant={goalsMetrics.monthlyProgress >= 100 ? "success" : goalsMetrics.monthlyProgress >= 70 ? "primary" : "warning"}
                  />
                </div>

                {/* Progress Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GoalProgressChart
                    achieved={goalsMetrics.monthlyAchieved}
                    goal={goalsMetrics.monthlyGoal}
                    title="Meta Mensal"
                    variant="progress"
                  />
                  <GoalProgressChart
                    achieved={goalsMetrics.yearlyAchieved}
                    goal={goalsMetrics.yearlyGoal}
                    title="Meta Anual"
                    variant="donut"
                    size="lg"
                  />
                </div>

                {/* Additional Goals KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    label="Meta Anual"
                    value={goalsMetrics.yearlyGoal}
                    prefix="R$ "
                    icon={Target}
                    variant="info"
                  />
                  <KPICard
                    label="Anual Atingido"
                    value={goalsMetrics.yearlyAchieved}
                    prefix="R$ "
                    icon={TrendingUp}
                    variant="primary"
                  />
                  <KPICard
                    label="Anual Restante"
                    value={goalsMetrics.yearlyRemaining}
                    prefix="R$ "
                    variant={goalsMetrics.yearlyRemaining > 0 ? "warning" : "success"}
                  />
                  <KPICard
                    label="Conclusão Anual"
                    value={goalsMetrics.yearlyProgress}
                    suffix="%"
                    variant={goalsMetrics.yearlyProgress >= 100 ? "success" : goalsMetrics.yearlyProgress >= 70 ? "primary" : "warning"}
                  />
                </div>

                {/* Revenue vs Goal Chart */}
                <RevenueLineChart 
                  data={financialMetrics.revenueHistory}
                  title="Evolução: Receita vs Meta"
                  showGoal
                />
              </>
            )}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </DataProvider>
  );
}
