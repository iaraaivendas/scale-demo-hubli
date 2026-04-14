// I.ARA Scale - Marketing Forecast Engine
// Motor de cálculo para projeções de marketing

import {
  safeDivide,
  percent,
  getGoals,
  getCampaignsFinancial,
  getCurrentMonthReference,
  getYearMonths,
  type Goals,
} from './financialData';
import { getLeads, getCampaigns, type Lead, type Campaign } from './storage';
import { type ForecastScenario, SCENARIO_CONFIG, type ForecastAlert } from './forecastEngine';

// =====================================
// TIPOS DO FORECAST DE MARKETING
// =====================================

export type MarketingForecastPeriod = 30 | 60 | 90;

export interface MarketingScenarioMultipliers {
  investment: number;
  cpl: number;
  conversion: number;
  ticket: number;
}

export const MARKETING_SCENARIO_CONFIG: Record<ForecastScenario, MarketingScenarioMultipliers> = {
  conservative: { investment: 1.0, cpl: 1.15, conversion: 0.85, ticket: 0.95 },
  realistic: { investment: 1.0, cpl: 1.0, conversion: 1.0, ticket: 1.0 },
  optimistic: { investment: 1.10, cpl: 0.90, conversion: 1.15, ticket: 1.05 },
};

// =====================================
// PIPELINE DE MARKETING
// =====================================

export interface MarketingFunnel {
  investment: number; // centavos
  leads: number;
  opportunities: number;
  sales: number;
  revenue: number; // centavos
  isProjected: boolean;
}

export interface MonthlyMarketingData {
  month: string;
  monthLabel: string;
  investment: number; // centavos
  leads: number;
  opportunities: number;
  sales: number;
  revenue: number; // centavos
  cpl: number; // centavos
  roi: number; // percentual
  isProjected: boolean;
}

export interface ChannelForecast {
  channel: string;
  historicalLeads: number;
  projectedLeads: number;
  historicalSpend: number; // centavos
  projectedSpend: number; // centavos
  cpl: number; // centavos
  conversionRate: number; // percentual
  contribution: number; // percentual do total
}

// =====================================
// RESULTADO DO FORECAST
// =====================================

export interface MarketingForecast {
  // Funil projetado
  currentFunnel: MarketingFunnel;
  projectedFunnel: MarketingFunnel;
  
  // Métricas históricas
  historicalCPL: number; // centavos
  historicalConversionLeadToOpp: number; // percentual
  historicalConversionOppToSale: number; // percentual
  historicalTicket: number; // centavos
  historicalROI: number; // percentual
  
  // Dados mensais históricos + projetados
  monthlyData: MonthlyMarketingData[];
  
  // Projeções por canal
  channelForecasts: ChannelForecast[];
  
  // Projeções agregadas
  projectedLeads: number;
  projectedOpportunities: number;
  projectedSales: number;
  projectedRevenue: number; // centavos
  projectedROI: number; // percentual
  
  // Comparação com metas comerciais
  salesGoal: number;
  revenueGoal: number; // centavos
  leadsNeededForGoal: number;
  investmentNeededForGoal: number; // centavos
  goalContribution: number; // percentual - contribuição do marketing para meta
  
  // Gap analysis
  leadsGap: number;
  investmentGap: number; // centavos
  isSufficientForGoal: boolean;
  
  // Alertas
  alerts: ForecastAlert[];
}

// =====================================
// HELPERS
// =====================================

function getMonthLabel(monthRef: string): string {
  const [year, month] = monthRef.split('-');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
}

// =====================================
// CÁLCULOS PRINCIPAIS
// =====================================

function calculateHistoricalMarketingData(clientId: string): {
  totalSpend: number;
  totalLeads: number;
  totalOpportunities: number;
  totalSales: number;
  totalRevenue: number;
  byMonth: Record<string, { spend: number; leads: number; opportunities: number; sales: number; revenue: number }>;
  byChannel: Record<string, { spend: number; leads: number; conversions: number }>;
} {
  const campaigns = getCampaignsFinancial(clientId);
  const legacyCampaigns = getCampaigns(clientId);
  const leads = getLeads(clientId);
  
  let totalSpend = 0;
  let totalLeads = 0;
  let totalOpportunities = 0;
  let totalSales = 0;
  let totalRevenue = 0;
  
  const byMonth: Record<string, { spend: number; leads: number; opportunities: number; sales: number; revenue: number }> = {};
  const byChannel: Record<string, { spend: number; leads: number; conversions: number }> = {};
  
  // Usar campanhas do sistema financeiro se disponíveis
  if (campaigns.length > 0) {
    campaigns.forEach(c => {
      totalSpend += c.spendCentavos;
      totalLeads += c.leads;
      totalOpportunities += Math.round(c.leads * 0.4); // 40% viram oportunidades
      totalSales += c.conversions;
      totalRevenue += c.revenueAttributedCentavos;
      
      // Por canal
      if (!byChannel[c.channel]) {
        byChannel[c.channel] = { spend: 0, leads: 0, conversions: 0 };
      }
      byChannel[c.channel].spend += c.spendCentavos;
      byChannel[c.channel].leads += c.leads;
      byChannel[c.channel].conversions += c.conversions;
    });
  } else if (legacyCampaigns.length > 0) {
    // Fallback para campanhas legacy
    legacyCampaigns.forEach(c => {
      totalSpend += c.spent * 100; // converter para centavos
      totalLeads += c.leads;
      totalOpportunities += Math.round(c.leads * 0.4);
      totalSales += c.conversions;
      totalRevenue += c.revenue * 100;
      
      if (!byChannel[c.channel]) {
        byChannel[c.channel] = { spend: 0, leads: 0, conversions: 0 };
      }
      byChannel[c.channel].spend += c.spent * 100;
      byChannel[c.channel].leads += c.leads;
      byChannel[c.channel].conversions += c.conversions;
    });
  }
  
  // Simular dados por mês baseado em leads
  const currentYear = new Date().getFullYear();
  const months = getYearMonths(currentYear);
  const currentMonthRef = getCurrentMonthReference();
  const currentIdx = months.indexOf(currentMonthRef);
  
  // Distribuir leads pelos meses passados
  const monthsWithData = months.slice(0, currentIdx + 1);
  const avgPerMonth = Math.ceil(totalLeads / Math.max(monthsWithData.length, 1));
  
  monthsWithData.forEach((month, i) => {
    const variance = 0.7 + Math.random() * 0.6;
    const monthLeads = Math.round(avgPerMonth * variance);
    const monthSpend = Math.round((totalSpend / Math.max(monthsWithData.length, 1)) * variance);
    const monthOpps = Math.round(monthLeads * 0.4);
    const monthSales = Math.round(monthLeads * 0.15);
    const monthRevenue = Math.round((totalRevenue / Math.max(monthsWithData.length, 1)) * variance);
    
    byMonth[month] = {
      spend: monthSpend,
      leads: monthLeads,
      opportunities: monthOpps,
      sales: monthSales,
      revenue: monthRevenue,
    };
  });
  
  return {
    totalSpend,
    totalLeads,
    totalOpportunities,
    totalSales,
    totalRevenue,
    byMonth,
    byChannel,
  };
}

export function calculateMarketingForecast(
  clientId: string,
  period: MarketingForecastPeriod = 90,
  scenario: ForecastScenario = 'realistic'
): MarketingForecast {
  const multiplier = MARKETING_SCENARIO_CONFIG[scenario];
  const historical = calculateHistoricalMarketingData(clientId);
  
  // Métricas históricas
  const historicalCPL = Math.round(safeDivide(historical.totalSpend, historical.totalLeads));
  const historicalConversionLeadToOpp = safeDivide(historical.totalOpportunities, historical.totalLeads) * 100;
  const historicalConversionOppToSale = safeDivide(historical.totalSales, historical.totalOpportunities) * 100;
  const historicalTicket = Math.round(safeDivide(historical.totalRevenue, historical.totalSales));
  const historicalROI = percent(historical.totalRevenue - historical.totalSpend, historical.totalSpend);
  
  // Aplicar multiplicadores do cenário
  const adjustedCPL = Math.round(historicalCPL * multiplier.cpl);
  const adjustedConvLeadOpp = (historicalConversionLeadToOpp / 100) * multiplier.conversion;
  const adjustedConvOppSale = (historicalConversionOppToSale / 100) * multiplier.conversion;
  const adjustedTicket = Math.round(historicalTicket * multiplier.ticket);
  
  // Construir dados mensais
  const monthlyData: MonthlyMarketingData[] = [];
  const currentYear = new Date().getFullYear();
  const months = getYearMonths(currentYear);
  const currentMonthRef = getCurrentMonthReference();
  const currentIdx = months.indexOf(currentMonthRef);
  
  // Dados históricos
  months.slice(0, currentIdx + 1).forEach(month => {
    const data = historical.byMonth[month] || { spend: 0, leads: 0, opportunities: 0, sales: 0, revenue: 0 };
    const cpl = data.leads > 0 ? Math.round(safeDivide(data.spend, data.leads)) : historicalCPL;
    const roi = data.spend > 0 ? percent(data.revenue - data.spend, data.spend) : 0;
    
    monthlyData.push({
      month,
      monthLabel: getMonthLabel(month),
      investment: data.spend,
      leads: data.leads,
      opportunities: data.opportunities,
      sales: data.sales,
      revenue: data.revenue,
      cpl,
      roi,
      isProjected: false,
    });
  });
  
  // Calcular investimento médio mensal para projeção
  const historicalMonths = Object.values(historical.byMonth);
  const avgMonthlyInvestment = historicalMonths.length > 0
    ? Math.round(historicalMonths.reduce((sum, m) => sum + m.spend, 0) / historicalMonths.length)
    : 1000000; // 10k default
  
  // Projetar meses futuros
  const monthsToProject = Math.ceil(period / 30);
  const futureMonths = months.slice(currentIdx + 1, currentIdx + 1 + monthsToProject);
  
  let totalProjectedLeads = 0;
  let totalProjectedOpps = 0;
  let totalProjectedSales = 0;
  let totalProjectedRevenue = 0;
  let totalProjectedInvestment = 0;
  
  futureMonths.forEach((month, i) => {
    // Investimento ajustado pelo cenário
    const monthInvestment = Math.round(avgMonthlyInvestment * multiplier.investment);
    
    // Projeção do funil
    const projectedLeads = adjustedCPL > 0 ? Math.round(monthInvestment / adjustedCPL) : 0;
    const projectedOpps = Math.round(projectedLeads * adjustedConvLeadOpp);
    const projectedSales = Math.round(projectedOpps * adjustedConvOppSale);
    const projectedRevenue = projectedSales * adjustedTicket;
    const roi = monthInvestment > 0 ? percent(projectedRevenue - monthInvestment, monthInvestment) : 0;
    
    monthlyData.push({
      month,
      monthLabel: getMonthLabel(month),
      investment: monthInvestment,
      leads: projectedLeads,
      opportunities: projectedOpps,
      sales: projectedSales,
      revenue: projectedRevenue,
      cpl: adjustedCPL,
      roi,
      isProjected: true,
    });
    
    totalProjectedLeads += projectedLeads;
    totalProjectedOpps += projectedOpps;
    totalProjectedSales += projectedSales;
    totalProjectedRevenue += projectedRevenue;
    totalProjectedInvestment += monthInvestment;
  });
  
  // Projeção de ROI
  const projectedROI = percent(totalProjectedRevenue - totalProjectedInvestment, totalProjectedInvestment);
  
  // Metas comerciais (buscar do sistema ou simular)
  const goals = getGoals(clientId);
  const monthlyGoal = goals?.monthlyGoalCentavos || 5000000; // 50k default
  const salesGoal = Math.round(monthlyGoal / (historicalTicket || 500000)) * monthsToProject;
  const revenueGoal = monthlyGoal * monthsToProject;
  
  // Leads necessários para atingir a meta
  const fullConversionRate = adjustedConvLeadOpp * adjustedConvOppSale;
  const leadsNeededForGoal = fullConversionRate > 0 
    ? Math.ceil(salesGoal / fullConversionRate) 
    : salesGoal * 10;
  
  // Investimento necessário
  const investmentNeededForGoal = leadsNeededForGoal * adjustedCPL;
  
  // Contribuição do marketing para a meta
  const goalContribution = safeDivide(totalProjectedRevenue, revenueGoal) * 100;
  
  // Gap analysis
  const leadsGap = Math.max(0, leadsNeededForGoal - totalProjectedLeads);
  const investmentGap = Math.max(0, investmentNeededForGoal - totalProjectedInvestment);
  const isSufficientForGoal = totalProjectedRevenue >= revenueGoal;
  
  // Forecast por canal
  const channelForecasts: ChannelForecast[] = Object.entries(historical.byChannel).map(([channel, data]) => {
    const channelCPL = Math.round(safeDivide(data.spend, data.leads));
    const channelConversion = safeDivide(data.conversions, data.leads) * 100;
    const contribution = safeDivide(data.leads, historical.totalLeads) * 100;
    
    // Projetar leads por canal mantendo proporção
    const projectedLeads = Math.round(totalProjectedLeads * (contribution / 100));
    const projectedSpend = Math.round(totalProjectedInvestment * (contribution / 100));
    
    return {
      channel,
      historicalLeads: data.leads,
      projectedLeads,
      historicalSpend: data.spend,
      projectedSpend,
      cpl: channelCPL,
      conversionRate: channelConversion,
      contribution,
    };
  });
  
  // Funil atual
  const currentFunnel: MarketingFunnel = {
    investment: historical.totalSpend,
    leads: historical.totalLeads,
    opportunities: historical.totalOpportunities,
    sales: historical.totalSales,
    revenue: historical.totalRevenue,
    isProjected: false,
  };
  
  // Funil projetado
  const projectedFunnel: MarketingFunnel = {
    investment: totalProjectedInvestment,
    leads: totalProjectedLeads,
    opportunities: totalProjectedOpps,
    sales: totalProjectedSales,
    revenue: totalProjectedRevenue,
    isProjected: true,
  };
  
  // Alertas
  const alerts: ForecastAlert[] = [];
  
  if (goalContribution < 80) {
    alerts.push({
      id: 'marketing-insufficient',
      type: 'warning',
      title: 'Marketing Insuficiente',
      message: `O marketing atual gera apenas ${goalContribution.toFixed(0)}% dos leads necessários para bater a meta.`,
      metric: 'goalContribution',
      value: goalContribution,
    });
  }
  
  if (projectedROI < 0) {
    alerts.push({
      id: 'negative-roi',
      type: 'danger',
      title: 'ROI Negativo Projetado',
      message: 'O investimento em marketing não está gerando retorno positivo. Revise a estratégia.',
      metric: 'projectedROI',
      value: projectedROI,
    });
  }
  
  if (adjustedCPL > historicalCPL * 1.2) {
    alerts.push({
      id: 'cpl-increasing',
      type: 'warning',
      title: 'CPL em Alta',
      message: `O custo por lead está ${((adjustedCPL / historicalCPL - 1) * 100).toFixed(0)}% acima da média histórica.`,
      metric: 'cpl',
      value: adjustedCPL,
    });
  }
  
  if (leadsGap > 0) {
    alerts.push({
      id: 'leads-gap',
      type: 'info',
      title: 'Déficit de Leads',
      message: `Faltam ${leadsGap} leads para atingir a meta. Considere aumentar o investimento em R$ ${(investmentGap / 100).toLocaleString('pt-BR')}.`,
      metric: 'leadsGap',
      value: leadsGap,
    });
  }
  
  return {
    currentFunnel,
    projectedFunnel,
    historicalCPL,
    historicalConversionLeadToOpp,
    historicalConversionOppToSale,
    historicalTicket,
    historicalROI,
    monthlyData,
    channelForecasts,
    projectedLeads: totalProjectedLeads,
    projectedOpportunities: totalProjectedOpps,
    projectedSales: totalProjectedSales,
    projectedRevenue: totalProjectedRevenue,
    projectedROI,
    salesGoal,
    revenueGoal,
    leadsNeededForGoal,
    investmentNeededForGoal,
    goalContribution,
    leadsGap,
    investmentGap,
    isSufficientForGoal,
    alerts,
  };
}

// =====================================
// EXPORTAÇÕES AUXILIARES
// =====================================

export function getMarketingScenarioLabel(scenario: ForecastScenario): string {
  const labels: Record<ForecastScenario, string> = {
    conservative: 'Conservador',
    realistic: 'Realista',
    optimistic: 'Otimista',
  };
  return labels[scenario];
}

export function getMarketingPeriodLabel(period: MarketingForecastPeriod): string {
  return `${period} dias`;
}
