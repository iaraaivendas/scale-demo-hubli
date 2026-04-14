// I.ARA Scale - Forecast Engine
// Motor de cálculo para projeções financeiras e comerciais

import {
  getPayments,
  getGoals,
  getCurrentMonthReference,
  getYearMonths,
  isDateInMonth,
  getDaysInMonth,
  getDaysPassedInMonth,
  safeDivide,
  type Payment,
  type Goals,
} from './financialData';
import { getLeads, getCampaigns, type Lead, type Campaign } from './storage';

// =====================================
// TIPOS DO FORECAST
// =====================================

export type ForecastScenario = 'conservative' | 'realistic' | 'optimistic';
export type ForecastPeriod = 30 | 60 | 90;

export interface ScenarioMultipliers {
  growth: number;
  conversion: number;
  leads: number;
}

export const SCENARIO_CONFIG: Record<ForecastScenario, ScenarioMultipliers> = {
  conservative: { growth: 0.85, conversion: 0.80, leads: 0.90 },
  realistic: { growth: 1.0, conversion: 1.0, leads: 1.0 },
  optimistic: { growth: 1.20, conversion: 1.15, leads: 1.10 },
};

// =====================================
// FORECAST FINANCEIRO
// =====================================

export interface MonthlyFinancialData {
  month: string;
  monthLabel: string;
  revenue: number; // centavos
  expenses: number; // centavos
  result: number; // centavos
  isProjected: boolean;
}

export interface FinancialForecast {
  // Dados históricos + projetados
  monthlyData: MonthlyFinancialData[];
  
  // Métricas de crescimento
  averageGrowthRate: number; // percentual
  recentTrend: 'up' | 'down' | 'stable';
  
  // Projeções agregadas
  projectedRevenue: number; // centavos
  projectedExpenses: number; // centavos
  projectedResult: number; // centavos
  
  // Comparação com metas
  monthlyGoal: number; // centavos
  annualGoal: number; // centavos
  goalDifference: number; // centavos (projeção - meta)
  goalAchievementPercent: number;
  
  // Alertas
  alerts: ForecastAlert[];
}

export interface ForecastAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  metric?: string;
  value?: number;
}

// =====================================
// FORECAST COMERCIAL
// =====================================

export interface CommercialPipelineStage {
  stage: string;
  count: number;
  value: number; // centavos
  conversionRate: number;
}

export interface MonthlyCommercialData {
  month: string;
  monthLabel: string;
  leads: number;
  sales: number;
  revenue: number; // centavos
  isProjected: boolean;
}

export interface CommercialForecast {
  // Pipeline atual
  pipeline: CommercialPipelineStage[];
  totalPipelineValue: number; // centavos
  
  // Métricas históricas
  historicalConversionRate: number;
  averageTicket: number; // centavos
  averageSalesCycle: number; // dias
  
  // Dados mensais históricos + projetados
  monthlyData: MonthlyCommercialData[];
  
  // Projeções
  projectedSales: number;
  projectedRevenue: number; // centavos
  
  // Comparação com metas
  salesGoal: number;
  revenueGoal: number; // centavos
  goalAchievementPercent: number;
  goalProbability: number; // 0-100
  
  // Gap e ações
  salesGap: number;
  revenueGap: number; // centavos
  requiredConversionRate: number;
  
  // Alertas
  alerts: ForecastAlert[];
}

// =====================================
// CÁLCULOS - FORECAST FINANCEIRO
// =====================================

function getMonthLabel(monthRef: string): string {
  const [year, month] = monthRef.split('-');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
}

function calculateHistoricalRevenue(clientId: string): { month: string; revenue: number }[] {
  const payments = getPayments(clientId).filter(p => p.status === 'paid');
  const currentYear = new Date().getFullYear();
  const months = getYearMonths(currentYear);
  
  return months.map(month => {
    const monthRevenue = payments
      .filter(p => isDateInMonth(p.paymentDate, month))
      .reduce((sum, p) => sum + p.amountCentavos, 0);
    return { month, revenue: monthRevenue };
  });
}

function calculateGrowthRate(data: number[]): number {
  if (data.length < 2) return 0;
  
  const validData = data.filter(d => d > 0);
  if (validData.length < 2) return 0;
  
  let totalGrowth = 0;
  let growthCount = 0;
  
  for (let i = 1; i < validData.length; i++) {
    const growth = safeDivide(validData[i] - validData[i - 1], validData[i - 1]);
    totalGrowth += growth;
    growthCount++;
  }
  
  return safeDivide(totalGrowth, growthCount) * 100;
}

function getRecentTrend(data: number[]): 'up' | 'down' | 'stable' {
  const recent = data.slice(-3).filter(d => d > 0);
  if (recent.length < 2) return 'stable';
  
  const avg1 = safeDivide(recent.slice(0, Math.floor(recent.length / 2)).reduce((a, b) => a + b, 0), Math.floor(recent.length / 2));
  const avg2 = safeDivide(recent.slice(Math.floor(recent.length / 2)).reduce((a, b) => a + b, 0), recent.length - Math.floor(recent.length / 2));
  
  const change = safeDivide(avg2 - avg1, avg1);
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
}

function projectFutureRevenue(
  historicalData: number[],
  growthRate: number,
  monthsToProject: number,
  scenario: ForecastScenario
): number[] {
  const multiplier = SCENARIO_CONFIG[scenario];
  const adjustedGrowth = (growthRate / 100) * multiplier.growth;
  
  const validData = historicalData.filter(d => d > 0);
  const lastValue = validData.length > 0 ? validData[validData.length - 1] : 0;
  
  const projections: number[] = [];
  let currentValue = lastValue;
  
  for (let i = 0; i < monthsToProject; i++) {
    currentValue = currentValue * (1 + adjustedGrowth);
    projections.push(Math.round(currentValue));
  }
  
  return projections;
}

export function calculateFinancialForecast(
  clientId: string,
  period: ForecastPeriod = 90,
  scenario: ForecastScenario = 'realistic'
): FinancialForecast {
  const historicalData = calculateHistoricalRevenue(clientId);
  const currentMonthRef = getCurrentMonthReference();
  const currentMonthIndex = historicalData.findIndex(d => d.month === currentMonthRef);
  
  // Separar dados passados dos futuros
  const pastData = historicalData.slice(0, currentMonthIndex + 1);
  const monthsToProject = Math.ceil(period / 30);
  
  // Calcular taxa de crescimento
  const revenueValues = pastData.map(d => d.revenue);
  const growthRate = calculateGrowthRate(revenueValues);
  const trend = getRecentTrend(revenueValues);
  
  // Projetar receita futura
  const projectedRevenues = projectFutureRevenue(revenueValues, growthRate, monthsToProject, scenario);
  
  // Simular despesas (60% da receita como despesas fixas + variáveis)
  const expenseRatio = 0.60;
  
  // Construir dados mensais
  const monthlyData: MonthlyFinancialData[] = [];
  
  // Adicionar dados históricos
  pastData.forEach(d => {
    const expenses = Math.round(d.revenue * expenseRatio);
    monthlyData.push({
      month: d.month,
      monthLabel: getMonthLabel(d.month),
      revenue: d.revenue,
      expenses,
      result: d.revenue - expenses,
      isProjected: false,
    });
  });
  
  // Adicionar projeções
  const currentYear = new Date().getFullYear();
  const allMonths = getYearMonths(currentYear);
  const futureMonths = allMonths.slice(currentMonthIndex + 1);
  
  projectedRevenues.slice(0, futureMonths.length).forEach((revenue, i) => {
    const expenses = Math.round(revenue * expenseRatio);
    monthlyData.push({
      month: futureMonths[i],
      monthLabel: getMonthLabel(futureMonths[i]),
      revenue,
      expenses,
      result: revenue - expenses,
      isProjected: true,
    });
  });
  
  // Buscar metas
  const goals = getGoals(clientId);
  const monthlyGoal = goals?.monthlyGoalCentavos || 0;
  const annualGoal = goals?.annualGoalCentavos || 0;
  
  // Calcular projeções agregadas
  const projectedMonths = monthlyData.filter(d => d.isProjected);
  const projectedRevenue = projectedMonths.reduce((sum, d) => sum + d.revenue, 0);
  const projectedExpenses = projectedMonths.reduce((sum, d) => sum + d.expenses, 0);
  const projectedResult = projectedRevenue - projectedExpenses;
  
  // Calcular projeção anual total
  const totalAnnualProjected = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const goalDifference = totalAnnualProjected - annualGoal;
  const goalAchievementPercent = annualGoal > 0 ? safeDivide(totalAnnualProjected, annualGoal) * 100 : 0;
  
  // Gerar alertas
  const alerts: ForecastAlert[] = [];
  
  if (goalAchievementPercent < 80) {
    alerts.push({
      id: 'goal-risk',
      type: 'danger',
      title: 'Meta em Risco',
      message: `Projeção indica ${goalAchievementPercent.toFixed(0)}% da meta anual. Ação imediata necessária.`,
      metric: 'goalAchievement',
      value: goalAchievementPercent,
    });
  }
  
  if (projectedResult < 0) {
    alerts.push({
      id: 'negative-result',
      type: 'danger',
      title: 'Resultado Negativo Projetado',
      message: 'Despesas projetadas superam a receita. Revise custos ou aumente vendas.',
      metric: 'projectedResult',
      value: projectedResult,
    });
  }
  
  if (trend === 'down') {
    alerts.push({
      id: 'declining-trend',
      type: 'warning',
      title: 'Tendência de Queda',
      message: 'Receita em declínio nos últimos meses. Considere ações de retenção.',
      metric: 'trend',
    });
  }
  
  return {
    monthlyData,
    averageGrowthRate: growthRate,
    recentTrend: trend,
    projectedRevenue,
    projectedExpenses,
    projectedResult,
    monthlyGoal,
    annualGoal,
    goalDifference,
    goalAchievementPercent,
    alerts,
  };
}

// =====================================
// CÁLCULOS - FORECAST COMERCIAL
// =====================================

function buildPipeline(leads: Lead[]): CommercialPipelineStage[] {
  const stageConfig: Record<string, { order: number; conversionRate: number; avgTicket: number }> = {
    new: { order: 1, conversionRate: 0.30, avgTicket: 500000 },
    qualified: { order: 2, conversionRate: 0.50, avgTicket: 750000 },
    nurturing: { order: 3, conversionRate: 0.40, avgTicket: 600000 },
    converted: { order: 4, conversionRate: 1.0, avgTicket: 800000 },
  };
  
  const stages: Record<string, Lead[]> = {};
  leads.forEach(lead => {
    if (!stages[lead.status]) stages[lead.status] = [];
    stages[lead.status].push(lead);
  });
  
  return Object.entries(stageConfig)
    .filter(([stage]) => stages[stage])
    .sort(([a], [b]) => stageConfig[a].order - stageConfig[b].order)
    .map(([stage, config]) => {
      const stageLeads = stages[stage] || [];
      const estimatedValue = stageLeads.length * config.avgTicket * config.conversionRate;
      return {
        stage,
        count: stageLeads.length,
        value: Math.round(estimatedValue),
        conversionRate: config.conversionRate * 100,
      };
    });
}

function calculateHistoricalCommercialData(clientId: string, leads: Lead[]): { month: string; leads: number; sales: number; revenue: number }[] {
  const payments = getPayments(clientId).filter(p => p.status === 'paid');
  const currentYear = new Date().getFullYear();
  const months = getYearMonths(currentYear);
  
  // Simular leads por mês baseado em criação
  const leadsByMonth: Record<string, number> = {};
  const salesByMonth: Record<string, number> = {};
  
  leads.forEach(lead => {
    if (lead.createdAt) {
      const month = lead.createdAt.slice(0, 7);
      leadsByMonth[month] = (leadsByMonth[month] || 0) + 1;
      if (lead.status === 'converted') {
        salesByMonth[month] = (salesByMonth[month] || 0) + 1;
      }
    }
  });
  
  return months.map(month => {
    const monthRevenue = payments
      .filter(p => isDateInMonth(p.paymentDate, month))
      .reduce((sum, p) => sum + p.amountCentavos, 0);
    return {
      month,
      leads: leadsByMonth[month] || 0,
      sales: salesByMonth[month] || 0,
      revenue: monthRevenue,
    };
  });
}

export function calculateCommercialForecast(
  clientId: string,
  period: ForecastPeriod = 90,
  scenario: ForecastScenario = 'realistic'
): CommercialForecast {
  const leads = getLeads(clientId);
  const activeLeads = leads.filter(l => l.status !== 'lost' && l.status !== 'converted');
  const convertedLeads = leads.filter(l => l.status === 'converted');
  
  const multiplier = SCENARIO_CONFIG[scenario];
  
  // Pipeline
  const pipeline = buildPipeline(activeLeads);
  const totalPipelineValue = pipeline.reduce((sum, s) => sum + s.value, 0);
  
  // Métricas históricas
  const payments = getPayments(clientId).filter(p => p.status === 'paid');
  const totalRevenue = payments.reduce((sum, p) => sum + p.amountCentavos, 0);
  const historicalConversionRate = leads.length > 0 ? safeDivide(convertedLeads.length, leads.length) * 100 : 0;
  const averageTicket = convertedLeads.length > 0 ? safeDivide(totalRevenue, convertedLeads.length) : 50000000; // 500k default
  const averageSalesCycle = 30; // dias (simulado)
  
  // Dados históricos
  const historicalData = calculateHistoricalCommercialData(clientId, leads);
  const currentMonthRef = getCurrentMonthReference();
  const currentMonthIndex = historicalData.findIndex(d => d.month === currentMonthRef);
  
  // Construir dados mensais
  const monthlyData: MonthlyCommercialData[] = [];
  const pastData = historicalData.slice(0, currentMonthIndex + 1);
  
  pastData.forEach(d => {
    monthlyData.push({
      month: d.month,
      monthLabel: getMonthLabel(d.month),
      leads: d.leads,
      sales: d.sales,
      revenue: d.revenue,
      isProjected: false,
    });
  });
  
  // Projetar meses futuros
  const avgLeadsPerMonth = safeDivide(pastData.reduce((sum, d) => sum + d.leads, 0), pastData.filter(d => d.leads > 0).length) || 10;
  const adjustedConversion = (historicalConversionRate / 100) * multiplier.conversion;
  const adjustedLeads = avgLeadsPerMonth * multiplier.leads;
  
  const monthsToProject = Math.ceil(period / 30);
  const currentYear = new Date().getFullYear();
  const allMonths = getYearMonths(currentYear);
  const futureMonths = allMonths.slice(currentMonthIndex + 1);
  
  for (let i = 0; i < Math.min(monthsToProject, futureMonths.length); i++) {
    const projectedLeads = Math.round(adjustedLeads);
    const projectedSales = Math.round(projectedLeads * adjustedConversion);
    const projectedRevenue = projectedSales * averageTicket;
    
    monthlyData.push({
      month: futureMonths[i],
      monthLabel: getMonthLabel(futureMonths[i]),
      leads: projectedLeads,
      sales: projectedSales,
      revenue: projectedRevenue,
      isProjected: true,
    });
  }
  
  // Projeções agregadas
  const projectedMonths = monthlyData.filter(d => d.isProjected);
  const projectedSales = projectedMonths.reduce((sum, d) => sum + d.sales, 0);
  const projectedRevenue = projectedMonths.reduce((sum, d) => sum + d.revenue, 0);
  
  // Metas (simuladas como 20% acima do realizado)
  const historicalSales = pastData.reduce((sum, d) => sum + d.sales, 0);
  const historicalRevenue = pastData.reduce((sum, d) => sum + d.revenue, 0);
  const salesGoal = Math.round(historicalSales * 1.20);
  const revenueGoal = Math.round(historicalRevenue * 1.20);
  
  // Cálculos de atingimento
  const totalProjectedSales = historicalSales + projectedSales;
  const totalProjectedRevenue = historicalRevenue + projectedRevenue;
  const goalAchievementPercent = revenueGoal > 0 ? safeDivide(totalProjectedRevenue, revenueGoal) * 100 : 0;
  
  // Probabilidade baseada no pipeline e conversão
  const pipelinePotential = totalPipelineValue * multiplier.conversion;
  const goalProbability = Math.min(100, safeDivide(pipelinePotential + historicalRevenue, revenueGoal) * 100);
  
  // Gaps
  const salesGap = Math.max(0, salesGoal - totalProjectedSales);
  const revenueGap = Math.max(0, revenueGoal - totalProjectedRevenue);
  const requiredConversionRate = activeLeads.length > 0 
    ? safeDivide(salesGap, activeLeads.length) * 100 
    : 0;
  
  // Alertas
  const alerts: ForecastAlert[] = [];
  
  if (goalProbability < 50) {
    alerts.push({
      id: 'low-probability',
      type: 'danger',
      title: 'Baixa Probabilidade de Meta',
      message: `Apenas ${goalProbability.toFixed(0)}% de chance de atingir a meta. Pipeline insuficiente.`,
      metric: 'goalProbability',
      value: goalProbability,
    });
  }
  
  if (salesGap > 0 && requiredConversionRate > 50) {
    alerts.push({
      id: 'high-conversion-needed',
      type: 'warning',
      title: 'Conversão Alta Necessária',
      message: `Precisa converter ${requiredConversionRate.toFixed(0)}% dos leads ativos para atingir a meta.`,
      metric: 'requiredConversion',
      value: requiredConversionRate,
    });
  }
  
  if (avgLeadsPerMonth < 5) {
    alerts.push({
      id: 'low-lead-volume',
      type: 'warning',
      title: 'Volume de Leads Baixo',
      message: 'Geração de leads abaixo do esperado. Considere investir em marketing.',
      metric: 'avgLeads',
      value: avgLeadsPerMonth,
    });
  }
  
  return {
    pipeline,
    totalPipelineValue,
    historicalConversionRate,
    averageTicket,
    averageSalesCycle,
    monthlyData,
    projectedSales,
    projectedRevenue,
    salesGoal,
    revenueGoal,
    goalAchievementPercent,
    goalProbability,
    salesGap,
    revenueGap,
    requiredConversionRate,
    alerts,
  };
}

// =====================================
// EXPORTAÇÕES AUXILIARES
// =====================================

export function getScenarioLabel(scenario: ForecastScenario): string {
  const labels: Record<ForecastScenario, string> = {
    conservative: 'Conservador',
    realistic: 'Realista',
    optimistic: 'Otimista',
  };
  return labels[scenario];
}

export function getPeriodLabel(period: ForecastPeriod): string {
  return `${period} dias`;
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    new: 'Novos',
    qualified: 'Qualificados',
    nurturing: 'Em Nutrição',
    converted: 'Convertidos',
    lost: 'Perdidos',
    cold: 'Frios',
  };
  return labels[stage] || stage;
}
