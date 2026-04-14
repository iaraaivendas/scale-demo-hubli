// Dashboard Data Generation for I.ARA Scale
// Integra com o novo sistema financeiro baseado em CENTAVOS

import { getCampaigns, getClient, getLeads, type Campaign, type Client, type Lead } from './storage';
import { 
  calculateDashboardFinancialData,
  calculateRevenueMetrics,
  calculateGoalMetrics,
  calculateGrowthMetrics,
  calculateMarketingMetrics as calcMarketingFromFinancial,
  calculatePoolsMetrics,
  getMonthlyHistory,
  type DashboardFinancialData,
  type SmartAlert,
} from './financialCalculations';
import {
  safeDivide,
  percent,
  formatCurrency,
  getGoals,
  getCampaignsFinancial,
} from './financialData';
import { initializeFinancialDemoData, isFinancialDemoInitialized } from './financialDemoData';

// =====================================
// TIPOS EXPORTADOS PARA DASHBOARDS
// =====================================

export interface MonthlyRevenue {
  month: string;
  monthLabel: string;
  revenue: number; // Em REAIS para exibição
  revenueCentavos: number; // Em CENTAVOS para cálculos
  goal: number; // Em REAIS para exibição
  goalCentavos: number; // Em CENTAVOS para cálculos
}

export interface FinancialMetrics {
  monthlyRevenue: number; // REAIS
  monthlyRevenueCentavos: number; // CENTAVOS
  yearlyRevenue: number; // REAIS
  yearlyRevenueCentavos: number; // CENTAVOS
  averageTicket: number; // REAIS
  averageTicketCentavos: number; // CENTAVOS
  monthlyGrowth: number; // PORCENTAGEM
  yearlyGoal: number; // REAIS
  yearlyGoalCentavos: number; // CENTAVOS
  yearlyGoalProgress: number; // PORCENTAGEM
  mrr: number; // REAIS
  mrrCentavos: number; // CENTAVOS
  arr: number; // REAIS
  arrCentavos: number; // CENTAVOS
  revenueHistory: MonthlyRevenue[];
}

export interface MarketingMetrics {
  totalLeads: number;
  costPerLead: number; // REAIS
  costPerLeadCentavos: number; // CENTAVOS
  conversionRate: number; // PORCENTAGEM
  totalRevenue: number; // REAIS
  totalRevenueCentavos: number; // CENTAVOS
  averageROI: number; // PORCENTAGEM
  roas: number; // MULTIPLICADOR
  leadsByChannel: { channel: string; leads: number; color: string }[];
  leadsOverTime: { month: string; leads: number }[];
  campaignPerformance: CampaignPerformance[];
}

export interface CampaignPerformance {
  id: string;
  name: string;
  channel: string;
  leads: number;
  conversions: number;
  revenue: number; // REAIS
  revenueCentavos: number; // CENTAVOS
  spent: number; // REAIS
  spentCentavos: number; // CENTAVOS
  roi: number; // PORCENTAGEM
  roas: number; // MULTIPLICADOR
}

export interface GoalsMetrics {
  monthlyGoal: number; // REAIS
  monthlyGoalCentavos: number; // CENTAVOS
  monthlyAchieved: number; // REAIS
  monthlyAchievedCentavos: number; // CENTAVOS
  monthlyRemaining: number; // REAIS
  monthlyRemainingCentavos: number; // CENTAVOS
  monthlyProgress: number; // PORCENTAGEM
  yearlyGoal: number; // REAIS
  yearlyGoalCentavos: number; // CENTAVOS
  yearlyAchieved: number; // REAIS
  yearlyAchievedCentavos: number; // CENTAVOS
  yearlyRemaining: number; // REAIS
  yearlyRemainingCentavos: number; // CENTAVOS
  yearlyProgress: number; // PORCENTAGEM
  runRate: number; // REAIS - Projeção
  runRateCentavos: number; // CENTAVOS
}

export interface PoolMetrics {
  included: number;
  additional: number;
  used: number;
  remaining: number;
  usagePercent: number;
  canPurchaseMore: boolean;
  maxAdditionalPools: number;
}

// Re-exportar SmartAlert
export type { SmartAlert };

// =====================================
// CONSTANTES
// =====================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CHANNEL_COLORS: Record<string, string> = {
  'Meta Ads': 'hsl(142, 76%, 45%)',
  'Google Ads': 'hsl(199, 89%, 48%)',
  'LinkedIn': 'hsl(38, 92%, 50%)',
  'Email': 'hsl(280, 70%, 50%)',
  'Organic': 'hsl(0, 0%, 55%)',
};

// =====================================
// HELPERS DE CONVERSÃO
// =====================================

function centavosToReais(centavos: number): number {
  return centavos / 100;
}

// =====================================
// FUNÇÕES PRINCIPAIS
// =====================================

/**
 * Garante que os dados demo financeiros estejam inicializados
 */
function ensureFinancialData(clientId: string, plan: 'ESSENCIAL' | 'GROWTH' | 'PRO'): void {
  if (!isFinancialDemoInitialized(clientId)) {
    initializeFinancialDemoData(clientId, plan);
  }
}

/**
 * Obtém métricas financeiras completas
 * Usa o sistema de centavos internamente, converte para reais na saída
 */
export function getFinancialMetrics(clientId: string): FinancialMetrics {
  const client = getClient(clientId);
  if (!client) {
    return createEmptyFinancialMetrics();
  }
  
  // Garante dados demo
  ensureFinancialData(clientId, client.plan);
  
  // Busca dados do sistema financeiro
  const revenue = calculateRevenueMetrics(clientId);
  const growth = calculateGrowthMetrics(clientId);
  const goals = calculateGoalMetrics(clientId);
  const history = getMonthlyHistory(clientId, 12);
  
  // Converte histórico para o formato esperado
  const revenueHistory: MonthlyRevenue[] = history.map(h => ({
    month: h.monthReference,
    monthLabel: h.monthLabel,
    revenue: centavosToReais(h.revenueCentavos),
    revenueCentavos: h.revenueCentavos,
    goal: centavosToReais(h.goalCentavos),
    goalCentavos: h.goalCentavos,
  }));
  
  // Ticket médio (fallback para sistema antigo se não houver dados)
  const campaigns = getCampaigns(clientId);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const ticketFromCampaigns = totalConversions > 0 ? Math.round(totalRevenue / totalConversions) : 0;
  
  return {
    monthlyRevenue: centavosToReais(revenue.monthlyRevenueCentavos) || Math.round(totalRevenue * 0.3),
    monthlyRevenueCentavos: revenue.monthlyRevenueCentavos || Math.round(totalRevenue * 0.3) * 100,
    yearlyRevenue: centavosToReais(revenue.yearlyRevenueCentavos) || totalRevenue,
    yearlyRevenueCentavos: revenue.yearlyRevenueCentavos || totalRevenue * 100,
    averageTicket: ticketFromCampaigns,
    averageTicketCentavos: ticketFromCampaigns * 100,
    monthlyGrowth: Math.round(growth.momGrowthPercent) || 8 + Math.round(Math.random() * 12),
    yearlyGoal: centavosToReais(goals.annualGoalCentavos) || 500000,
    yearlyGoalCentavos: goals.annualGoalCentavos || 50000000,
    yearlyGoalProgress: Math.round(goals.annualProgressPercent) || 0,
    mrr: centavosToReais(revenue.mrr),
    mrrCentavos: revenue.mrr,
    arr: centavosToReais(revenue.arr),
    arrCentavos: revenue.arr,
    revenueHistory,
  };
}

/**
 * Obtém métricas de marketing
 */
export function getMarketingMetrics(clientId: string): MarketingMetrics {
  const client = getClient(clientId);
  if (!client) {
    return createEmptyMarketingMetrics();
  }
  
  ensureFinancialData(clientId, client.plan);
  
  // Busca campanhas do sistema financeiro
  const financialCampaigns = getCampaignsFinancial(clientId);
  
  // Se houver campanhas financeiras, usa-as
  if (financialCampaigns.length > 0) {
    const totalSpend = financialCampaigns.reduce((sum, c) => sum + c.spendCentavos, 0);
    const totalLeads = financialCampaigns.reduce((sum, c) => sum + c.leads, 0);
    const totalConversions = financialCampaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalRevenue = financialCampaigns.reduce((sum, c) => sum + c.revenueAttributedCentavos, 0);
    
    // Agrupa por canal
    const channelCounts: Record<string, number> = {};
    financialCampaigns.forEach(c => {
      channelCounts[c.channel] = (channelCounts[c.channel] || 0) + c.leads;
    });
    
    const leadsByChannel = Object.entries(channelCounts).map(([channel, leads]) => ({
      channel,
      leads,
      color: CHANNEL_COLORS[channel] || 'hsl(0, 0%, 50%)',
    }));
    
    // Performance por campanha
    const campaignPerformance: CampaignPerformance[] = financialCampaigns.map(c => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      leads: c.leads,
      conversions: c.conversions,
      revenue: centavosToReais(c.revenueAttributedCentavos),
      revenueCentavos: c.revenueAttributedCentavos,
      spent: centavosToReais(c.spendCentavos),
      spentCentavos: c.spendCentavos,
      roi: percent(c.revenueAttributedCentavos - c.spendCentavos, c.spendCentavos),
      roas: safeDivide(c.revenueAttributedCentavos, c.spendCentavos),
    }));
    
    // Leads ao longo do tempo (simplificado)
    const leadsOverTime = generateLeadsOverTime(totalLeads);
    
    return {
      totalLeads,
      costPerLead: centavosToReais(Math.round(safeDivide(totalSpend, totalLeads))),
      costPerLeadCentavos: Math.round(safeDivide(totalSpend, totalLeads)),
      conversionRate: percent(totalConversions, totalLeads),
      totalRevenue: centavosToReais(totalRevenue),
      totalRevenueCentavos: totalRevenue,
      averageROI: percent(totalRevenue - totalSpend, totalSpend),
      roas: safeDivide(totalRevenue, totalSpend),
      leadsByChannel,
      leadsOverTime,
      campaignPerformance,
    };
  }
  
  // Fallback para sistema antigo (campaigns do storage.ts)
  const campaigns = getCampaigns(clientId);
  return getMarketingMetricsFromLegacy(campaigns);
}

/**
 * Obtém métricas de metas
 */
export function getGoalsMetrics(clientId: string): GoalsMetrics {
  const client = getClient(clientId);
  if (!client) {
    return createEmptyGoalsMetrics();
  }
  
  ensureFinancialData(clientId, client.plan);
  
  const goals = calculateGoalMetrics(clientId);
  
  return {
    monthlyGoal: centavosToReais(goals.monthlyGoalCentavos),
    monthlyGoalCentavos: goals.monthlyGoalCentavos,
    monthlyAchieved: centavosToReais(goals.monthlyAchievedCentavos),
    monthlyAchievedCentavos: goals.monthlyAchievedCentavos,
    monthlyRemaining: centavosToReais(goals.monthlyRemainingCentavos),
    monthlyRemainingCentavos: goals.monthlyRemainingCentavos,
    monthlyProgress: Math.round(goals.monthlyProgressPercent),
    yearlyGoal: centavosToReais(goals.annualGoalCentavos),
    yearlyGoalCentavos: goals.annualGoalCentavos,
    yearlyAchieved: centavosToReais(goals.annualAchievedCentavos),
    yearlyAchievedCentavos: goals.annualAchievedCentavos,
    yearlyRemaining: centavosToReais(goals.annualRemainingCentavos),
    yearlyRemainingCentavos: goals.annualRemainingCentavos,
    yearlyProgress: Math.round(goals.annualProgressPercent),
    runRate: centavosToReais(goals.runRateCentavos),
    runRateCentavos: goals.runRateCentavos,
  };
}

/**
 * Obtém métricas de pools
 */
export function getPoolMetrics(client: Client): PoolMetrics {
  const included = client.poolsIncluded || client.poolsLimit || 0;
  const additional = client.poolsAdditional || 0;
  const total = included + additional;
  const used = client.poolsUsed;
  const remaining = Math.max(0, total - used);
  const usagePercent = total > 0 ? Math.round(percent(used, total)) : 0;
  
  const MAX_ADDITIONAL_POOLS = 1000;
  
  return {
    included,
    additional,
    used,
    remaining,
    usagePercent,
    canPurchaseMore: additional < MAX_ADDITIONAL_POOLS,
    maxAdditionalPools: MAX_ADDITIONAL_POOLS,
  };
}

/**
 * Obtém alertas inteligentes
 */
export function getSmartAlerts(clientId: string, client: Client): SmartAlert[] {
  ensureFinancialData(clientId, client.plan);
  
  const data = calculateDashboardFinancialData(clientId, client.poolsIncluded || client.poolsLimit || 0);
  return data.alerts;
}

// =====================================
// HELPERS INTERNOS
// =====================================

function generateLeadsOverTime(totalLeads: number): { month: string; leads: number }[] {
  const currentMonth = new Date().getMonth();
  const avgMonthlyLeads = Math.round(totalLeads / 6);
  
  const history: { month: string; leads: number }[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const variance = 0.6 + Math.random() * 0.8;
    
    history.push({
      month: MONTHS[monthIndex],
      leads: Math.round(avgMonthlyLeads * variance) || Math.floor(Math.random() * 50) + 10,
    });
  }
  
  return history;
}

function getMarketingMetricsFromLegacy(campaigns: Campaign[]): MarketingMetrics {
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  
  const channelCounts: Record<string, number> = {};
  campaigns.forEach(c => {
    channelCounts[c.channel] = (channelCounts[c.channel] || 0) + c.leads;
  });
  
  const leadsByChannel = Object.entries(channelCounts).map(([channel, leads]) => ({
    channel,
    leads,
    color: CHANNEL_COLORS[channel] || 'hsl(0, 0%, 50%)',
  }));
  
  const campaignPerformance: CampaignPerformance[] = campaigns.map(c => ({
    id: c.id,
    name: c.name,
    channel: c.channel,
    leads: c.leads,
    conversions: c.conversions,
    revenue: c.revenue,
    revenueCentavos: c.revenue * 100,
    spent: c.spent,
    spentCentavos: c.spent * 100,
    roi: c.spent > 0 ? Math.round(((c.revenue - c.spent) / c.spent) * 100) : 0,
    roas: safeDivide(c.revenue, c.spent),
  }));
  
  return {
    totalLeads,
    costPerLead: totalLeads > 0 ? Math.round(totalSpent / totalLeads) : 0,
    costPerLeadCentavos: totalLeads > 0 ? Math.round((totalSpent / totalLeads) * 100) : 0,
    conversionRate: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0,
    totalRevenue,
    totalRevenueCentavos: totalRevenue * 100,
    averageROI: totalSpent > 0 ? Math.round(((totalRevenue - totalSpent) / totalSpent) * 100) : 0,
    roas: safeDivide(totalRevenue, totalSpent),
    leadsByChannel,
    leadsOverTime: generateLeadsOverTime(totalLeads),
    campaignPerformance,
  };
}

// =====================================
// EMPTY STATE CREATORS
// =====================================

function createEmptyFinancialMetrics(): FinancialMetrics {
  return {
    monthlyRevenue: 0,
    monthlyRevenueCentavos: 0,
    yearlyRevenue: 0,
    yearlyRevenueCentavos: 0,
    averageTicket: 0,
    averageTicketCentavos: 0,
    monthlyGrowth: 0,
    yearlyGoal: 0,
    yearlyGoalCentavos: 0,
    yearlyGoalProgress: 0,
    mrr: 0,
    mrrCentavos: 0,
    arr: 0,
    arrCentavos: 0,
    revenueHistory: [],
  };
}

function createEmptyMarketingMetrics(): MarketingMetrics {
  return {
    totalLeads: 0,
    costPerLead: 0,
    costPerLeadCentavos: 0,
    conversionRate: 0,
    totalRevenue: 0,
    totalRevenueCentavos: 0,
    averageROI: 0,
    roas: 0,
    leadsByChannel: [],
    leadsOverTime: [],
    campaignPerformance: [],
  };
}

function createEmptyGoalsMetrics(): GoalsMetrics {
  return {
    monthlyGoal: 0,
    monthlyGoalCentavos: 0,
    monthlyAchieved: 0,
    monthlyAchievedCentavos: 0,
    monthlyRemaining: 0,
    monthlyRemainingCentavos: 0,
    monthlyProgress: 0,
    yearlyGoal: 0,
    yearlyGoalCentavos: 0,
    yearlyAchieved: 0,
    yearlyAchievedCentavos: 0,
    yearlyRemaining: 0,
    yearlyRemainingCentavos: 0,
    yearlyProgress: 0,
    runRate: 0,
    runRateCentavos: 0,
  };
}

// =====================================
// TIME PERIOD FILTERS
// =====================================

export type TimePeriod = 'month' | 'quarter' | 'year';

export function filterByPeriod<T extends { month?: string }>(data: T[], period: TimePeriod): T[] {
  const months = period === 'month' ? 1 : period === 'quarter' ? 3 : 12;
  return data.slice(-months);
}
