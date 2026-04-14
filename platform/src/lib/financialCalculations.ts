// I.ARA Scale - Financial Calculations Engine
// TODOS OS CÁLCULOS SEGUEM AS FÓRMULAS DEFINIDAS NO SPEC

import {
  getPayments,
  getSubscriptions,
  getExtraPools,
  getCampaignsFinancial,
  getGoals,
  getPoolsUsage,
  safeDivide,
  percent,
  getCurrentMonthReference,
  getPreviousMonthReference,
  getDaysInMonth,
  getDaysPassedInMonth,
  isDateInMonth,
  getYearMonths,
  type Payment,
  type Subscription,
  type ExtraPools,
  type CampaignFinancial,
  type Goals,
} from './financialData';

// =====================================
// TIPOS DE RESULTADO
// =====================================

export interface RevenueMetrics {
  monthlyRevenueCentavos: number;
  yearlyRevenueCentavos: number; // YTD
  mrr: number; // em centavos
  arr: number; // em centavos
}

export interface GoalMetrics {
  monthlyGoalCentavos: number;
  monthlyAchievedCentavos: number;
  monthlyRemainingCentavos: number;
  monthlyProgressPercent: number;
  annualGoalCentavos: number;
  annualAchievedCentavos: number;
  annualRemainingCentavos: number;
  annualProgressPercent: number;
  runRateCentavos: number; // projeção
}

export interface GrowthMetrics {
  momGrowthPercent: number; // Month over Month
  yoyGrowthPercent: number; // Year over Year
  currentMonthRevenueCentavos: number;
  previousMonthRevenueCentavos: number;
  sameMonthLastYearRevenueCentavos: number;
}

export interface TicketMetrics {
  averageTicketCentavos: number;
  payingCustomersCount: number;
}

export interface MarketingCalculatedMetrics {
  totalSpendCentavos: number;
  totalLeads: number;
  totalConversions: number;
  totalRevenueAttributedCentavos: number;
  cplCentavos: number; // Cost Per Lead
  cpaCentavos: number; // Cost Per Acquisition
  conversionRatePercent: number;
  roas: number; // Return on Ad Spend (multiplicador)
  roiPercent: number; // Return on Investment (%)
}

export interface PoolsMetrics {
  poolsIncluded: number;
  extraPoolsQuantity: number;
  poolsTotal: number;
  poolsUsed: number;
  poolsRemaining: number;
  usagePercent: number;
  canPurchaseMore: boolean;
  maxAdditionalPools: number;
  currentAdditionalPools: number;
}

export interface ChurnMetrics {
  clientChurnPercent: number;
  mrrChurnPercent: number;
  canceledClientsCount: number;
  activeClientsStartOfMonth: number;
  lostMrrCentavos: number;
  startMrrCentavos: number;
}

export interface SmartAlert {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold?: number;
}

export interface DashboardFinancialData {
  revenue: RevenueMetrics;
  goals: GoalMetrics;
  growth: GrowthMetrics;
  ticket: TicketMetrics;
  marketing: MarketingCalculatedMetrics;
  pools: PoolsMetrics;
  churn: ChurnMetrics;
  alerts: SmartAlert[];
  monthlyHistory: MonthlyHistoryItem[];
}

export interface MonthlyHistoryItem {
  monthReference: string;
  monthLabel: string;
  revenueCentavos: number;
  goalCentavos: number;
  goalAchievedPercent: number;
}

// =====================================
// CÁLCULOS DE RECEITA
// =====================================

/**
 * Receita mensal = Σ(payments.amount_centavos) onde status === "paid" e dentro do mês
 */
export function calculateMonthlyRevenue(clientId: string, monthRef: string = getCurrentMonthReference()): number {
  const payments = getPayments(clientId);
  return payments
    .filter(p => p.status === 'paid' && isDateInMonth(p.paymentDate, monthRef))
    .reduce((sum, p) => sum + p.amountCentavos, 0);
}

/**
 * Receita anual (YTD) = Σ(receita de cada mês do ano)
 */
export function calculateYearlyRevenue(clientId: string, year: number = new Date().getFullYear()): number {
  const months = getYearMonths(year);
  const currentMonth = getCurrentMonthReference();
  
  return months
    .filter(m => m <= currentMonth)
    .reduce((sum, monthRef) => sum + calculateMonthlyRevenue(clientId, monthRef), 0);
}

/**
 * MRR = Σ(subscription.monthly_fee_centavos) de assinaturas ativas + Σ(extra_pools do mês)
 */
export function calculateMRR(clientId?: string): number {
  const currentMonth = getCurrentMonthReference();
  const subscriptions = getSubscriptions(clientId).filter(s => s.status === 'active');
  const extraPools = getExtraPools(clientId, currentMonth);
  
  const subscriptionMRR = subscriptions.reduce((sum, s) => sum + s.monthlyFeeCentavos, 0);
  const extraPoolsRevenue = extraPools.reduce((sum, ep) => sum + ep.priceCentavos, 0);
  
  return subscriptionMRR + extraPoolsRevenue;
}

/**
 * ARR = MRR * 12
 */
export function calculateARR(clientId?: string): number {
  return calculateMRR(clientId) * 12;
}

export function calculateRevenueMetrics(clientId: string): RevenueMetrics {
  const currentMonth = getCurrentMonthReference();
  
  return {
    monthlyRevenueCentavos: calculateMonthlyRevenue(clientId, currentMonth),
    yearlyRevenueCentavos: calculateYearlyRevenue(clientId),
    mrr: calculateMRR(clientId),
    arr: calculateARR(clientId),
  };
}

// =====================================
// CÁLCULOS DE METAS
// =====================================

/**
 * % da meta mensal atingida = percent(receita_mes, goals.monthly_goal_centavos)
 */
export function calculateGoalMetrics(clientId: string): GoalMetrics {
  const currentMonth = getCurrentMonthReference();
  const goals = getGoals(clientId);
  const monthlyRevenue = calculateMonthlyRevenue(clientId, currentMonth);
  const yearlyRevenue = calculateYearlyRevenue(clientId);
  
  const monthlyGoal = goals?.monthlyGoalCentavos || 0;
  const annualGoal = goals?.annualGoalCentavos || 0;
  
  // Projeção (run rate)
  const daysPassed = getDaysPassedInMonth(currentMonth);
  const totalDays = getDaysInMonth(currentMonth);
  const runRate = daysPassed > 0 
    ? Math.round(safeDivide(monthlyRevenue, daysPassed) * totalDays)
    : 0;
  
  return {
    monthlyGoalCentavos: monthlyGoal,
    monthlyAchievedCentavos: monthlyRevenue,
    monthlyRemainingCentavos: Math.max(monthlyGoal - monthlyRevenue, 0),
    monthlyProgressPercent: percent(monthlyRevenue, monthlyGoal),
    annualGoalCentavos: annualGoal,
    annualAchievedCentavos: yearlyRevenue,
    annualRemainingCentavos: Math.max(annualGoal - yearlyRevenue, 0),
    annualProgressPercent: percent(yearlyRevenue, annualGoal),
    runRateCentavos: runRate,
  };
}

// =====================================
// CÁLCULOS DE CRESCIMENTO
// =====================================

/**
 * Crescimento MoM = percent(receita_atual - receita_anterior, receita_anterior)
 */
export function calculateGrowthMetrics(clientId: string): GrowthMetrics {
  const currentMonth = getCurrentMonthReference();
  const previousMonth = getPreviousMonthReference(currentMonth);
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const sameMonthLastYear = `${lastYear}-${currentMonth.split('-')[1]}`;
  
  const currentRevenue = calculateMonthlyRevenue(clientId, currentMonth);
  const previousRevenue = calculateMonthlyRevenue(clientId, previousMonth);
  const lastYearRevenue = calculateMonthlyRevenue(clientId, sameMonthLastYear);
  
  return {
    currentMonthRevenueCentavos: currentRevenue,
    previousMonthRevenueCentavos: previousRevenue,
    sameMonthLastYearRevenueCentavos: lastYearRevenue,
    momGrowthPercent: percent(currentRevenue - previousRevenue, previousRevenue),
    yoyGrowthPercent: percent(currentRevenue - lastYearRevenue, lastYearRevenue),
  };
}

// =====================================
// CÁLCULOS DE TICKET MÉDIO
// =====================================

/**
 * ticket_medio = safeDivide(receita_mes, numero_clientes_pagantes_mes)
 */
export function calculateTicketMetrics(clientId: string, monthRef: string = getCurrentMonthReference()): TicketMetrics {
  const payments = getPayments(clientId);
  const paidPayments = payments.filter(p => 
    p.status === 'paid' && isDateInMonth(p.paymentDate, monthRef)
  );
  
  const revenue = paidPayments.reduce((sum, p) => sum + p.amountCentavos, 0);
  const uniqueClients = new Set(paidPayments.map(p => p.clientId)).size;
  
  return {
    averageTicketCentavos: Math.round(safeDivide(revenue, uniqueClients)),
    payingCustomersCount: uniqueClients,
  };
}

// =====================================
// CÁLCULOS DE MARKETING
// =====================================

export function calculateMarketingMetrics(clientId: string, monthRef?: string): MarketingCalculatedMetrics {
  let campaigns = getCampaignsFinancial(clientId);
  
  if (monthRef) {
    campaigns = campaigns.filter(c => isDateInMonth(c.date, monthRef));
  }
  
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spendCentavos, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenueAttributedCentavos, 0);
  
  return {
    totalSpendCentavos: totalSpend,
    totalLeads,
    totalConversions,
    totalRevenueAttributedCentavos: totalRevenue,
    cplCentavos: Math.round(safeDivide(totalSpend, totalLeads)), // CPL em centavos
    cpaCentavos: Math.round(safeDivide(totalSpend, totalConversions)), // CPA em centavos
    conversionRatePercent: percent(totalConversions, totalLeads),
    roas: safeDivide(totalRevenue, totalSpend), // Multiplicador
    roiPercent: percent(totalRevenue - totalSpend, totalSpend),
  };
}

// =====================================
// CÁLCULOS DE POOLS
// =====================================

export function calculatePoolsMetrics(
  clientId: string, 
  poolsIncluded: number,
  monthRef: string = getCurrentMonthReference()
): PoolsMetrics {
  const extraPools = getExtraPools(clientId, monthRef);
  const usage = getPoolsUsage(clientId, monthRef);
  
  const extraPoolsQuantity = extraPools.reduce((sum, ep) => sum + ep.quantity, 0);
  const poolsTotal = poolsIncluded + extraPoolsQuantity;
  const poolsUsed = usage.reduce((sum, u) => sum + u.poolsUsed, 0);
  const poolsRemaining = Math.max(poolsTotal - poolsUsed, 0);
  
  // Limite máximo de pools adicionais = 1000
  const MAX_ADDITIONAL_POOLS = 1000;
  const canPurchaseMore = extraPoolsQuantity < MAX_ADDITIONAL_POOLS;
  
  return {
    poolsIncluded,
    extraPoolsQuantity,
    poolsTotal,
    poolsUsed,
    poolsRemaining,
    usagePercent: percent(poolsUsed, poolsTotal),
    canPurchaseMore,
    maxAdditionalPools: MAX_ADDITIONAL_POOLS,
    currentAdditionalPools: extraPoolsQuantity,
  };
}

// =====================================
// CÁLCULOS DE CHURN
// =====================================

export function calculateChurnMetrics(clientId?: string, monthRef: string = getCurrentMonthReference()): ChurnMetrics {
  const previousMonth = getPreviousMonthReference(monthRef);
  const subscriptions = getSubscriptions(clientId);
  
  // Clientes ativos no início do mês (fim do mês anterior)
  const activeAtStart = subscriptions.filter(s => {
    const startDate = new Date(s.startDate);
    const { end } = { end: new Date(`${previousMonth}-01`) };
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Último dia do mês anterior
    
    return startDate <= end && (
      s.status === 'active' || 
      (s.cancelDate && new Date(s.cancelDate) > end)
    );
  });
  
  // Clientes cancelados no mês
  const canceledThisMonth = subscriptions.filter(s => 
    s.status === 'canceled' && 
    s.cancelDate && 
    isDateInMonth(s.cancelDate, monthRef)
  );
  
  const activeCount = activeAtStart.length;
  const canceledCount = canceledThisMonth.length;
  const startMrr = activeAtStart.reduce((sum, s) => sum + s.monthlyFeeCentavos, 0);
  const lostMrr = canceledThisMonth.reduce((sum, s) => sum + s.monthlyFeeCentavos, 0);
  
  return {
    clientChurnPercent: percent(canceledCount, activeCount),
    mrrChurnPercent: percent(lostMrr, startMrr),
    canceledClientsCount: canceledCount,
    activeClientsStartOfMonth: activeCount,
    lostMrrCentavos: lostMrr,
    startMrrCentavos: startMrr,
  };
}

// =====================================
// ALERTAS INTELIGENTES
// =====================================

export function generateSmartAlerts(
  goals: GoalMetrics,
  pools: PoolsMetrics,
  growth: GrowthMetrics
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  
  // Meta atingida
  if (goals.monthlyProgressPercent >= 100) {
    alerts.push({
      id: 'goal_achieved',
      type: 'success',
      title: 'Meta Atingida! 🎉',
      message: 'Parabéns! A meta mensal foi alcançada.',
      metric: 'meta_mensal',
      value: goals.monthlyProgressPercent,
      threshold: 100,
    });
  } else if (goals.monthlyProgressPercent >= 80) {
    alerts.push({
      id: 'goal_near',
      type: 'info',
      title: 'Meta Próxima',
      message: `Faltam apenas ${(100 - goals.monthlyProgressPercent).toFixed(1)}% para atingir a meta.`,
      metric: 'meta_mensal',
      value: goals.monthlyProgressPercent,
      threshold: 80,
    });
  }
  
  // Pools próximos do limite
  if (pools.usagePercent >= 100) {
    alerts.push({
      id: 'pools_depleted',
      type: 'danger',
      title: 'Limite de Pools Atingido',
      message: 'Adquira pools adicionais ou faça upgrade do plano.',
      metric: 'pools',
      value: pools.usagePercent,
      threshold: 100,
    });
  } else if (pools.usagePercent >= 90) {
    alerts.push({
      id: 'pools_warning',
      type: 'warning',
      title: 'Pools Próximos do Limite',
      message: `Restam apenas ${pools.poolsRemaining} pools disponíveis.`,
      metric: 'pools',
      value: pools.usagePercent,
      threshold: 90,
    });
  } else if (pools.usagePercent >= 70) {
    alerts.push({
      id: 'pools_notice',
      type: 'info',
      title: 'Consumo de Pools em 70%',
      message: 'Considere adquirir pools adicionais para garantir operação contínua.',
      metric: 'pools',
      value: pools.usagePercent,
      threshold: 70,
    });
  }
  
  // Queda de performance
  if (growth.momGrowthPercent < 0) {
    alerts.push({
      id: 'growth_decline',
      type: 'warning',
      title: 'Queda de Performance',
      message: `Receita caiu ${Math.abs(growth.momGrowthPercent).toFixed(1)}% em relação ao mês anterior.`,
      metric: 'crescimento',
      value: growth.momGrowthPercent,
      threshold: 0,
    });
  }
  
  // Upsell obrigatório
  if (!pools.canPurchaseMore) {
    alerts.push({
      id: 'upsell_required',
      type: 'danger',
      title: 'Upsell Obrigatório',
      message: 'Limite máximo de pools adicionais atingido. Faça upgrade do plano.',
      metric: 'upsell',
      value: pools.currentAdditionalPools,
      threshold: pools.maxAdditionalPools,
    });
  }
  
  return alerts;
}

// =====================================
// HISTÓRICO MENSAL
// =====================================

export function getMonthlyHistory(clientId: string, months: number = 12): MonthlyHistoryItem[] {
  const history: MonthlyHistoryItem[] = [];
  const currentDate = new Date();
  const goals = getGoals(clientId);
  const monthlyGoal = goals?.monthlyGoalCentavos || 0;
  
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthRef = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const revenue = calculateMonthlyRevenue(clientId, monthRef);
    
    history.push({
      monthReference: monthRef,
      monthLabel: monthLabels[date.getMonth()],
      revenueCentavos: revenue,
      goalCentavos: monthlyGoal,
      goalAchievedPercent: percent(revenue, monthlyGoal),
    });
  }
  
  return history;
}

// =====================================
// DASHBOARD FINANCEIRO COMPLETO
// =====================================

export function calculateDashboardFinancialData(clientId: string, poolsIncluded: number): DashboardFinancialData {
  const revenue = calculateRevenueMetrics(clientId);
  const goals = calculateGoalMetrics(clientId);
  const growth = calculateGrowthMetrics(clientId);
  const ticket = calculateTicketMetrics(clientId);
  const marketing = calculateMarketingMetrics(clientId);
  const pools = calculatePoolsMetrics(clientId, poolsIncluded);
  const churn = calculateChurnMetrics(clientId);
  const alerts = generateSmartAlerts(goals, pools, growth);
  const monthlyHistory = getMonthlyHistory(clientId);
  
  return {
    revenue,
    goals,
    growth,
    ticket,
    marketing,
    pools,
    churn,
    alerts,
    monthlyHistory,
  };
}
