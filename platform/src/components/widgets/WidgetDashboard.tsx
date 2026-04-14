import { useMemo } from "react";
import { WidgetProvider, useWidgets } from "@/contexts/WidgetContext";
import { 
  WidgetContainer, 
  WidgetGrid, 
  WidgetToolbar,
  KPIWidget,
  LineChartWidget,
  BarChartWidget,
  DonutChartWidget,
  ProgressWidget,
  TableWidget,
  type TableColumn,
} from "@/components/widgets";
import { 
  type WidgetConfig, 
  getDefaultFinancialLayout,
  getDefaultMarketingLayout,
  getDefaultGoalsLayout,
  getDefaultDashboardLayout,
} from "@/lib/widgets";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  BarChart3,
  Users,
  Zap,
  Activity,
} from "lucide-react";
import {
  type FinancialMetrics,
  type MarketingMetrics,
  type GoalsMetrics,
  type MonthlyRevenue,
  type CampaignPerformance,
} from "@/lib/dashboardData";
import { type ComparativeFinancialData, type MonthlyRevenueData } from "@/lib/financialComparative";

type DashboardType = 'overview' | 'financial' | 'marketing' | 'goals';

interface WidgetDashboardProps {
  type: DashboardType;
  financialMetrics?: FinancialMetrics | null;
  marketingMetrics?: MarketingMetrics | null;
  goalsMetrics?: GoalsMetrics | null;
  comparativeData?: ComparativeFinancialData | null;
  className?: string;
}

// Helper to convert typed arrays to generic Record arrays for chart components
function toChartData<T extends object>(data: T[]): Record<string, unknown>[] {
  return data.map(item => ({ ...item } as Record<string, unknown>));
}

// Main component that renders widgets based on configuration
function WidgetDashboardContent({
  type,
  financialMetrics,
  marketingMetrics,
  goalsMetrics,
  comparativeData,
}: Omit<WidgetDashboardProps, 'className'>) {
  const { widgets, isEditing, resizeWidget, removeWidget, toggleVisibility, triggerRefresh } = useWidgets();
  
  // Get icon for widget based on dataKey
  const getWidgetIcon = (dataKey: string) => {
    const iconMap: Record<string, typeof DollarSign> = {
      monthlyRevenue: DollarSign,
      yearlyRevenue: TrendingUp,
      monthlyGoal: Target,
      poolsUsage: Activity,
      totalLeads: Users,
      conversionRate: BarChart3,
      avgCPL: DollarSign,
      roas: TrendingUp,
      marketingROI: TrendingUp,
      qualifiedLeads: Zap,
    };
    return iconMap[dataKey] || DollarSign;
  };

  // Render widget content based on type and dataKey
  const renderWidgetContent = (config: WidgetConfig) => {
    const { type: widgetType, dataKey, variant } = config;

    // KPI Widgets
    if (widgetType === 'kpi') {
      return renderKPIWidget(dataKey!, variant);
    }

    // Line Chart Widgets
    if (widgetType === 'line-chart') {
      return renderLineChartWidget(dataKey!);
    }

    // Bar Chart Widgets
    if (widgetType === 'bar-chart') {
      return renderBarChartWidget(dataKey!);
    }

    // Donut Chart Widgets
    if (widgetType === 'donut-chart') {
      return renderDonutChartWidget(dataKey!);
    }

    // Progress Widgets
    if (widgetType === 'progress') {
      return renderProgressWidget(dataKey!, variant);
    }

    // Table Widgets
    if (widgetType === 'table') {
      return renderTableWidget(dataKey!);
    }

    return <div className="text-muted-foreground text-sm">Widget não configurado</div>;
  };

  const renderKPIWidget = (dataKey: string, variant = 'default') => {
    const Icon = getWidgetIcon(dataKey);
    
    // Financial KPIs
    if (financialMetrics) {
      const kpiData: Record<string, { value: number | string; prefix?: string; suffix?: string; change?: number }> = {
        monthlyRevenue: { value: financialMetrics.monthlyRevenue, prefix: 'R$ ', change: financialMetrics.monthlyGrowth },
        yearlyRevenue: { value: financialMetrics.yearlyRevenue, prefix: 'R$ ' },
        mrr: { value: financialMetrics.mrr, prefix: 'R$ ' },
        arr: { value: financialMetrics.arr, prefix: 'R$ ' },
        averageTicket: { value: financialMetrics.averageTicket, prefix: 'R$ ' },
        currentMonthRevenue: { value: comparativeData?.monthlyVariation.currentMonthRevenueReais || 0, prefix: 'R$ ' },
        ytdRevenue: { value: comparativeData?.yearlyData.totalReais || 0, prefix: 'R$ ' },
      };

      if (kpiData[dataKey]) {
        return (
          <KPIWidget
            value={kpiData[dataKey].value}
            prefix={kpiData[dataKey].prefix}
            suffix={kpiData[dataKey].suffix}
            change={kpiData[dataKey].change}
            icon={Icon}
            variant={variant as 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive'}
          />
        );
      }
    }

    // Marketing KPIs
    if (marketingMetrics) {
      const kpiData: Record<string, { value: number | string; prefix?: string; suffix?: string }> = {
        totalLeads: { value: marketingMetrics.totalLeads },
        qualifiedLeads: { value: Math.round(marketingMetrics.totalLeads * (marketingMetrics.conversionRate / 100)) },
        avgCPL: { value: marketingMetrics.costPerLead, prefix: 'R$ ' },
        conversionRate: { value: marketingMetrics.conversionRate, suffix: '%' },
        marketingROI: { value: marketingMetrics.averageROI, suffix: '%' },
        roas: { value: marketingMetrics.averageROI, suffix: '%' },
      };

      if (kpiData[dataKey]) {
        return (
          <KPIWidget
            value={kpiData[dataKey].value}
            prefix={kpiData[dataKey].prefix}
            suffix={kpiData[dataKey].suffix}
            icon={Icon}
            variant={variant as 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive'}
          />
        );
      }
    }

    // Goals KPIs
    if (goalsMetrics) {
      const kpiData: Record<string, { value: number | string; prefix?: string; suffix?: string }> = {
        monthlyGoal: { value: goalsMetrics.monthlyGoal, prefix: 'R$ ' },
        monthlyAchieved: { value: goalsMetrics.monthlyAchieved, prefix: 'R$ ' },
        yearlyGoal: { value: goalsMetrics.yearlyGoal, prefix: 'R$ ' },
        yearlyAchieved: { value: goalsMetrics.yearlyAchieved, prefix: 'R$ ' },
        projectedRunRate: { value: goalsMetrics.runRate, prefix: 'R$ ' },
        yearlyGap: { value: goalsMetrics.yearlyRemaining, prefix: 'R$ ' },
      };

      if (kpiData[dataKey]) {
        return (
          <KPIWidget
            value={kpiData[dataKey].value}
            prefix={kpiData[dataKey].prefix}
            suffix={kpiData[dataKey].suffix}
            icon={Icon}
            variant={variant as 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive'}
          />
        );
      }
    }

    return <KPIWidget value="--" icon={Icon} variant={variant as 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive'} />;
  };

  const renderLineChartWidget = (dataKey: string) => {
    // Revenue evolution
    if ((dataKey === 'revenueEvolution' || dataKey === 'revenueHistory') && financialMetrics) {
      const chartData = financialMetrics.revenueHistory.map(item => ({
        month: item.monthLabel,
        value: item.revenue,
      }));
      return (
        <LineChartWidget
          data={toChartData(chartData)}
          dataKey="value"
          xAxisKey="month"
          height={180}
          formatValue={(v) => `R$ ${(v / 1000).toFixed(0)}K`}
        />
      );
    }

    // Accumulated revenue
    if (dataKey === 'accumulatedRevenue' && comparativeData) {
      const chartData = comparativeData.accumulatedRevenueData.map(item => ({
        month: item.monthLabel,
        accumulated: item.accumulatedReais,
      }));
      return (
        <LineChartWidget
          data={toChartData(chartData)}
          dataKey="accumulated"
          xAxisKey="month"
          height={180}
          formatValue={(v) => `R$ ${(v / 1000).toFixed(0)}K`}
        />
      );
    }

    // Leads over time
    if (dataKey === 'leadsOverTime' && marketingMetrics) {
      const chartData = marketingMetrics.leadsOverTime.map(item => ({
        month: item.month,
        value: item.leads,
      }));
      return (
        <LineChartWidget
          data={toChartData(chartData)}
          dataKey="value"
          xAxisKey="month"
          height={180}
        />
      );
    }

    return <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Dados não disponíveis</div>;
  };

  const renderBarChartWidget = (dataKey: string) => {
    // Revenue history
    if ((dataKey === 'revenueHistory' || dataKey === 'annualComparison') && financialMetrics) {
      const chartData = financialMetrics.revenueHistory.map(item => ({
        month: item.monthLabel,
        value: item.revenue,
      }));
      return (
        <BarChartWidget
          data={toChartData(chartData)}
          dataKey="value"
          xAxisKey="month"
          height={180}
          formatValue={(v) => `R$ ${(v / 1000).toFixed(0)}K`}
        />
      );
    }

    // Revenue vs Goal
    if (dataKey === 'revenueVsGoal' && comparativeData) {
      const chartData = comparativeData.accumulatedRevenueData.map(d => ({
        month: d.monthLabel,
        value: d.revenueReais,
        goal: goalsMetrics?.monthlyGoal || 0,
      }));
      return (
        <BarChartWidget
          data={toChartData(chartData)}
          dataKey="value"
          secondaryDataKey="goal"
          xAxisKey="month"
          height={180}
          showLegend
          formatValue={(v) => `R$ ${(v / 1000).toFixed(0)}K`}
        />
      );
    }

    // Leads by campaign
    if (dataKey === 'leadsByCampaign' && marketingMetrics) {
      const chartData = marketingMetrics.campaignPerformance.map(c => ({
        name: c.name.substring(0, 15),
        value: c.leads,
      }));
      return (
        <BarChartWidget
          data={toChartData(chartData)}
          dataKey="value"
          xAxisKey="name"
          height={180}
        />
      );
    }

    return <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Dados não disponíveis</div>;
  };

  const renderDonutChartWidget = (dataKey: string) => {
    // Channel distribution
    if (dataKey === 'channelDistribution' && marketingMetrics) {
      return (
        <DonutChartWidget
          data={marketingMetrics.leadsByChannel.map(c => ({
            name: c.channel,
            value: c.leads,
          }))}
          height={180}
          innerRadius={40}
          outerRadius={70}
        />
      );
    }

    // Yearly goal
    if ((dataKey === 'yearlyGoal' || dataKey === 'yearlyGoalProgress') && goalsMetrics) {
      return (
        <DonutChartWidget
          data={[
            { name: 'Atingido', value: goalsMetrics.yearlyAchieved, color: 'hsl(var(--primary))' },
            { name: 'Restante', value: Math.max(0, goalsMetrics.yearlyRemaining), color: 'hsl(var(--muted))' },
          ]}
          height={180}
          innerRadius={50}
          outerRadius={75}
          centerValue={`${goalsMetrics.yearlyProgress}%`}
          centerLabel="Meta Anual"
        />
      );
    }

    // Monthly goal
    if (dataKey === 'monthlyProgress' && goalsMetrics) {
      return (
        <DonutChartWidget
          data={[
            { name: 'Atingido', value: goalsMetrics.monthlyAchieved, color: 'hsl(var(--primary))' },
            { name: 'Restante', value: Math.max(0, goalsMetrics.monthlyRemaining), color: 'hsl(var(--muted))' },
          ]}
          height={180}
          innerRadius={50}
          outerRadius={75}
          centerValue={`${goalsMetrics.monthlyProgress}%`}
          centerLabel="Meta Mensal"
        />
      );
    }

    return <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">Dados não disponíveis</div>;
  };

  const renderProgressWidget = (dataKey: string, variant = 'primary') => {
    // Monthly goal progress
    if ((dataKey === 'monthlyProgress' || dataKey === 'monthlyGoalProgress') && goalsMetrics) {
      return (
        <ProgressWidget
          value={goalsMetrics.monthlyAchieved}
          max={goalsMetrics.monthlyGoal}
          label="Meta Mensal"
          variant={variant as 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive'}
          size="lg"
        />
      );
    }

    // Yearly goal progress
    if (dataKey === 'yearlyGoalProgress' && goalsMetrics) {
      return (
        <ProgressWidget
          value={goalsMetrics.yearlyAchieved}
          max={goalsMetrics.yearlyGoal}
          label="Meta Anual"
          variant={variant as 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive'}
          size="lg"
        />
      );
    }

    return <ProgressWidget value={0} max={100} label="Progresso" variant={variant as 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive'} />;
  };

  const renderTableWidget = (dataKey: string) => {
    // Campaign performance table
    if (dataKey === 'campaignPerformance' && marketingMetrics) {
      const columns: TableColumn[] = [
        { key: 'name', label: 'Campanha', sortable: true },
        { key: 'channel', label: 'Canal', sortable: true },
        { key: 'leads', label: 'Leads', align: 'right', sortable: true },
        { 
          key: 'revenue', 
          label: 'Receita', 
          align: 'right', 
          sortable: true,
          format: (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
        { 
          key: 'roi', 
          label: 'ROI', 
          align: 'right', 
          sortable: true,
          format: (v) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`,
        },
      ];

      return (
        <TableWidget
          data={toChartData(marketingMetrics.campaignPerformance)}
          columns={columns}
          maxRows={5}
          highlightColumn="roi"
        />
      );
    }

    return <div className="text-muted-foreground text-sm">Tabela não configurada</div>;
  };

  // Filter visible widgets
  const visibleWidgets = widgets.filter(w => w.visible || isEditing);

  return (
    <div className="space-y-4">
      <WidgetToolbar />
      
      <WidgetGrid cols={4}>
        {visibleWidgets
          .sort((a, b) => a.order - b.order)
          .map((widget) => (
            <WidgetContainer
              key={widget.id}
              config={widget}
              isEditing={isEditing}
              onResize={(size) => resizeWidget(widget.id, size)}
              onRemove={() => removeWidget(widget.id)}
              onToggleVisibility={() => toggleVisibility(widget.id)}
              onRefresh={triggerRefresh}
            >
              {renderWidgetContent(widget)}
            </WidgetContainer>
          ))}
      </WidgetGrid>
    </div>
  );
}

// Wrapper component that provides context
export function WidgetDashboard({
  type,
  financialMetrics,
  marketingMetrics,
  goalsMetrics,
  comparativeData,
  className,
}: WidgetDashboardProps) {
  // Get default widgets based on dashboard type
  const defaultWidgets = useMemo(() => {
    switch (type) {
      case 'financial':
        return getDefaultFinancialLayout();
      case 'marketing':
        return getDefaultMarketingLayout();
      case 'goals':
        return getDefaultGoalsLayout();
      default:
        return getDefaultDashboardLayout();
    }
  }, [type]);

  return (
    <div className={className}>
      <WidgetProvider defaultWidgets={defaultWidgets}>
        <WidgetDashboardContent
          type={type}
          financialMetrics={financialMetrics}
          marketingMetrics={marketingMetrics}
          goalsMetrics={goalsMetrics}
          comparativeData={comparativeData}
        />
      </WidgetProvider>
    </div>
  );
}
