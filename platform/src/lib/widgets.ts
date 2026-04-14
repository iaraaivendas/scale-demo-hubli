// ============================================================
// I.ARA Scale - Sistema de Widgets Modulares
// ============================================================

export type WidgetType = 
  | 'kpi' 
  | 'line-chart' 
  | 'bar-chart' 
  | 'donut-chart' 
  | 'table' 
  | 'progress' 
  | 'heatmap';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl';

export type WidgetVariant = 
  | 'default' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'info' 
  | 'destructive';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  variant?: WidgetVariant;
  dataKey?: string;
  order: number;
  visible: boolean;
  settings?: Record<string, unknown>;
}

export interface WidgetLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface WidgetData {
  value?: number | string;
  values?: number[];
  labels?: string[];
  data?: Record<string, unknown>[];
  prefix?: string;
  suffix?: string;
  change?: number;
  icon?: string;
}

// Size mapping para grid columns
export const WIDGET_SIZE_COLS: Record<WidgetSize, string> = {
  sm: 'col-span-1',
  md: 'col-span-2',
  lg: 'col-span-3',
  xl: 'col-span-4',
};

// Size mapping para largura responsiva
export const WIDGET_SIZE_CLASS: Record<WidgetSize, string> = {
  sm: 'md:col-span-1 lg:col-span-1',
  md: 'md:col-span-2 lg:col-span-2',
  lg: 'md:col-span-2 lg:col-span-3',
  xl: 'md:col-span-4 lg:col-span-4',
};

// Widget type labels
export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  'kpi': 'KPI Card',
  'line-chart': 'Gráfico de Linha',
  'bar-chart': 'Gráfico de Barras',
  'donut-chart': 'Gráfico de Rosca',
  'table': 'Tabela Dinâmica',
  'progress': 'Barra de Progresso',
  'heatmap': 'Mapa de Calor',
};

// Default widget configurations by type
export const DEFAULT_WIDGET_CONFIGS: Record<WidgetType, Partial<WidgetConfig>> = {
  'kpi': { size: 'sm', variant: 'default' },
  'line-chart': { size: 'lg', variant: 'default' },
  'bar-chart': { size: 'lg', variant: 'default' },
  'donut-chart': { size: 'md', variant: 'default' },
  'table': { size: 'xl', variant: 'default' },
  'progress': { size: 'md', variant: 'default' },
  'heatmap': { size: 'md', variant: 'default' },
};

// LocalStorage keys
const LAYOUTS_KEY = 'iara_widget_layouts';
const ACTIVE_LAYOUT_KEY = 'iara_active_layout';

// ============================================================
// Layout Management Functions
// ============================================================

export function getWidgetLayouts(): WidgetLayout[] {
  const stored = localStorage.getItem(LAYOUTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWidgetLayout(layout: WidgetLayout): void {
  const layouts = getWidgetLayouts();
  const existingIndex = layouts.findIndex(l => l.id === layout.id);
  
  if (existingIndex >= 0) {
    layouts[existingIndex] = { ...layout, updatedAt: new Date().toISOString() };
  } else {
    layouts.push({ ...layout, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts));
}

export function deleteWidgetLayout(layoutId: string): void {
  const layouts = getWidgetLayouts().filter(l => l.id !== layoutId);
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts));
}

export function getActiveLayoutId(): string | null {
  return localStorage.getItem(ACTIVE_LAYOUT_KEY);
}

export function setActiveLayoutId(layoutId: string): void {
  localStorage.setItem(ACTIVE_LAYOUT_KEY, layoutId);
}

export function getActiveLayout(): WidgetLayout | null {
  const layoutId = getActiveLayoutId();
  if (!layoutId) return null;
  return getWidgetLayouts().find(l => l.id === layoutId) || null;
}

// ============================================================
// Widget Factory Functions
// ============================================================

export function createWidget(
  type: WidgetType, 
  title: string, 
  dataKey: string,
  overrides?: Partial<WidgetConfig>
): WidgetConfig {
  const defaults = DEFAULT_WIDGET_CONFIGS[type];
  return {
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    dataKey,
    size: defaults.size || 'md',
    variant: defaults.variant || 'default',
    order: 0,
    visible: true,
    ...overrides,
  };
}

export function reorderWidgets(widgets: WidgetConfig[], fromIndex: number, toIndex: number): WidgetConfig[] {
  const result = [...widgets];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result.map((w, i) => ({ ...w, order: i }));
}

export function toggleWidgetVisibility(widgets: WidgetConfig[], widgetId: string): WidgetConfig[] {
  return widgets.map(w => 
    w.id === widgetId ? { ...w, visible: !w.visible } : w
  );
}

export function updateWidgetSize(widgets: WidgetConfig[], widgetId: string, size: WidgetSize): WidgetConfig[] {
  return widgets.map(w => 
    w.id === widgetId ? { ...w, size } : w
  );
}

export function updateWidgetSettings(
  widgets: WidgetConfig[], 
  widgetId: string, 
  settings: Record<string, unknown>
): WidgetConfig[] {
  return widgets.map(w => 
    w.id === widgetId ? { ...w, settings: { ...w.settings, ...settings } } : w
  );
}

// ============================================================
// Default Dashboard Layouts
// ============================================================

export function getDefaultDashboardLayout(): WidgetConfig[] {
  return [
    createWidget('kpi', 'Receita Mensal', 'monthlyRevenue', { order: 0, variant: 'primary' }),
    createWidget('kpi', 'Receita Acumulada', 'yearlyRevenue', { order: 1, variant: 'success' }),
    createWidget('kpi', 'Meta Mensal', 'monthlyGoal', { order: 2, variant: 'warning' }),
    createWidget('kpi', 'Pools Consumidos', 'poolsUsage', { order: 3, variant: 'info' }),
    createWidget('bar-chart', 'Receita Mensal (12 meses)', 'revenueHistory', { order: 4, size: 'lg' }),
    createWidget('progress', 'Meta Mensal', 'monthlyProgress', { order: 5, size: 'md' }),
    createWidget('line-chart', 'Evolução da Receita', 'revenueEvolution', { order: 6, size: 'lg' }),
    createWidget('donut-chart', 'Meta Anual', 'yearlyGoal', { order: 7, size: 'md' }),
  ];
}

export function getDefaultAnalyticsLayout(): WidgetConfig[] {
  return [
    createWidget('kpi', 'Total Leads', 'totalLeads', { order: 0, variant: 'primary' }),
    createWidget('kpi', 'Taxa de Conversão', 'conversionRate', { order: 1, variant: 'success' }),
    createWidget('kpi', 'CPL Médio', 'avgCPL', { order: 2, variant: 'info' }),
    createWidget('kpi', 'ROAS', 'roas', { order: 3, variant: 'warning' }),
    createWidget('line-chart', 'Leads por Período', 'leadsOverTime', { order: 4, size: 'lg' }),
    createWidget('donut-chart', 'Distribuição por Canal', 'channelDistribution', { order: 5, size: 'md' }),
    createWidget('bar-chart', 'Leads por Campanha', 'leadsByCampaign', { order: 6, size: 'lg' }),
    createWidget('table', 'Performance de Campanhas', 'campaignPerformance', { order: 7, size: 'xl' }),
  ];
}

export function getDefaultFinancialLayout(): WidgetConfig[] {
  return [
    createWidget('kpi', 'Receita Mensal', 'currentMonthRevenue', { order: 0, variant: 'primary' }),
    createWidget('kpi', 'Variação MoM (R$)', 'momVariationValue', { order: 1 }),
    createWidget('kpi', 'Variação MoM (%)', 'momVariationPercent', { order: 2 }),
    createWidget('kpi', 'Receita YTD', 'ytdRevenue', { order: 3, variant: 'success' }),
    createWidget('bar-chart', 'Comparativo Anual', 'annualComparison', { order: 4, size: 'xl' }),
    createWidget('line-chart', 'Receita Acumulada', 'accumulatedRevenue', { order: 5, size: 'lg' }),
    createWidget('progress', 'Meta Anual', 'yearlyGoalProgress', { order: 6, size: 'md' }),
  ];
}

export function getDefaultMarketingLayout(): WidgetConfig[] {
  return [
    createWidget('kpi', 'Total Leads', 'totalLeads', { order: 0, variant: 'primary' }),
    createWidget('kpi', 'Leads Qualificados', 'qualifiedLeads', { order: 1, variant: 'success' }),
    createWidget('kpi', 'CPL Médio', 'avgCPL', { order: 2, variant: 'info' }),
    createWidget('kpi', 'ROI Marketing', 'marketingROI', { order: 3, variant: 'warning' }),
    createWidget('line-chart', 'Leads ao Longo do Tempo', 'leadsOverTime', { order: 4, size: 'lg' }),
    createWidget('donut-chart', 'Distribuição por Canal', 'channelDistribution', { order: 5, size: 'md' }),
    createWidget('bar-chart', 'Leads por Campanha', 'leadsByCampaign', { order: 6, size: 'lg' }),
    createWidget('table', 'Performance de Campanhas', 'campaignPerformance', { order: 7, size: 'xl' }),
  ];
}

export function getDefaultGoalsLayout(): WidgetConfig[] {
  return [
    createWidget('progress', 'Progresso Meta Mensal', 'monthlyGoalProgress', { order: 0, size: 'lg', variant: 'primary' }),
    createWidget('progress', 'Progresso Meta Anual', 'yearlyGoalProgress', { order: 1, size: 'lg', variant: 'success' }),
    createWidget('kpi', 'Run Rate Projetado', 'projectedRunRate', { order: 2, variant: 'info' }),
    createWidget('kpi', 'Gap para Meta Anual', 'yearlyGap', { order: 3 }),
    createWidget('bar-chart', 'Receita vs Meta por Mês', 'revenueVsGoal', { order: 4, size: 'xl' }),
  ];
}
