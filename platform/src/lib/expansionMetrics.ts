// Expansion Metrics Calculations for I.ARA Scale

import type { Client, Lead, Campaign, User } from './storage';
import { getClients, getLeads, getCampaigns, getUsers } from './storage';

// Expansion Metrics Types
export interface ExpansionMetrics {
  nrr: number; // Net Revenue Retention (%)
  expansionMRR: number; // R$ from upgrades/cross-sells this month
  poolUtilization: number; // % of pools used
  attachRate: number; // % with complementary modules
  churnRisk: number; // Clients at risk count
  upgradeReady: number; // Clients ready for upgrade
}

export interface ActionableInsight {
  id: string;
  type: 'usage_peak' | 'technical_maturity' | 'churn_risk' | 'demographic_fit' | 'upsell_ready' | 'cross_sell';
  severity: 'high' | 'medium' | 'low';
  signal: string;
  insight: string;
  action: string;
  actionLabel: string;
  entityId?: string;
  entityName?: string;
  entityType: 'client' | 'lead';
  score?: number;
}

export interface ModuleUsage {
  module: string;
  usagePercent: number;
  trend: 'up' | 'down' | 'stable';
  lastUsed: string;
}

export interface ROICalculation {
  sdrAISavings: number;
  hoursAutomated: number;
  costPerLead: number;
  efficiency: number;
}

// Calculate NRR (Net Revenue Retention)
// NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR * 100
export function calculateNRR(clientId?: string): number {
  const campaigns = getCampaigns(clientId);
  
  // Simulated data based on campaigns
  const startingMRR = campaigns.reduce((sum, c) => sum + c.budget, 0) || 50000;
  const expansionRevenue = campaigns.filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.revenue * 0.15), 0); // 15% expansion rate
  const contraction = startingMRR * 0.02; // 2% contraction
  const churn = startingMRR * 0.03; // 3% churn
  
  const nrr = ((startingMRR + expansionRevenue - contraction - churn) / startingMRR) * 100;
  return Math.round(nrr);
}

// Calculate Expansion MRR
export function calculateExpansionMRR(clientId?: string): number {
  const campaigns = getCampaigns(clientId);
  const leads = getLeads(clientId);
  
  // Revenue from upgrades (high-score converted leads)
  const upgradeRevenue = leads
    .filter(l => l.score >= 70 && l.status === 'converted')
    .length * 2500; // R$ 2500 avg per upgrade
  
  // Revenue from cross-sells (medium-score leads with activity)
  const crossSellRevenue = leads
    .filter(l => l.score >= 50 && l.score < 70 && l.poolActivated)
    .length * 800; // R$ 800 avg per cross-sell
  
  return upgradeRevenue + crossSellRevenue;
}

// Helper to calculate total pools for a client
function getTotalPools(client: Client): number {
  return (client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0);
}

// Calculate Pool Utilization
export function calculatePoolUtilization(client?: Client): number {
  if (!client) return 0;
  const totalPools = getTotalPools(client);
  return totalPools > 0 ? Math.round((client.poolsUsed / totalPools) * 100) : 0;
}

// Calculate Attach Rate (clients with complementary modules)
export function calculateAttachRate(): number {
  const clients = getClients();
  if (clients.length === 0) return 0;
  
  // Simulated: clients with high pool usage likely have multiple modules
  const withModules = clients.filter(c => {
    const utilization = calculatePoolUtilization(c);
    return utilization > 40;
  }).length;
  
  return Math.round((withModules / clients.length) * 100);
}

// Calculate all expansion metrics
export function calculateExpansionMetrics(clientId?: string, client?: Client): ExpansionMetrics {
  const clients = getClients();
  
  return {
    nrr: calculateNRR(clientId),
    expansionMRR: calculateExpansionMRR(clientId),
    poolUtilization: calculatePoolUtilization(client),
    attachRate: calculateAttachRate(),
    churnRisk: clients.filter(c => calculatePoolUtilization(c) < 20).length,
    upgradeReady: clients.filter(c => calculatePoolUtilization(c) > 80).length,
  };
}

// Generate Actionable Insights
export function generateActionableInsights(clientId?: string, client?: Client): ActionableInsight[] {
  const insights: ActionableInsight[] = [];
  const leads = getLeads(clientId);
  const clients = getClients();
  
  // 1. Peak Usage Detection (>80% pool usage)
  const poolUtilization = calculatePoolUtilization(client);
  if (client && poolUtilization >= 80) {
    const daysInMonth = 30;
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    
    insights.push({
      id: 'usage_peak_' + client.id,
      type: 'usage_peak',
      severity: 'high',
      signal: `${poolUtilization}% da franquia utilizada`,
      insight: `Cliente atingiu limite de pools ${daysRemaining} dias antes do fim do mês.`,
      action: 'migrate_plan',
      actionLabel: client.plan === 'PRO' ? 'Ofertar Enterprise' : 'Migrar para Plano ' + (client.plan === 'ESSENCIAL' ? 'Growth' : 'Pro'),
      entityId: client.id,
      entityName: client.name,
      entityType: 'client',
    });
  }

  // 2. High-Score Leads Ready for Upsell
  const upsellLeads = leads.filter(l => l.score >= 80 && l.status !== 'converted' && l.status !== 'lost');
  upsellLeads.slice(0, 3).forEach(lead => {
    insights.push({
      id: 'upsell_' + lead.id,
      type: 'upsell_ready',
      severity: 'high',
      signal: `Score ${lead.score} detectado`,
      insight: `Lead ${lead.name} apresenta alto potencial de conversão baseado em sinais comportamentais.`,
      action: 'contact_lead',
      actionLabel: 'Priorizar Contato',
      entityId: lead.id,
      entityName: lead.name,
      entityType: 'lead',
      score: lead.score,
    });
  });

  // 3. Churn Risk Detection (inactive leads)
  const now = new Date();
  const inactiveLeads = leads.filter(l => {
    const lastInteraction = new Date(l.lastInteraction);
    const daysSince = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= 7 && l.poolActivated && l.status !== 'converted' && l.status !== 'lost';
  });
  
  inactiveLeads.slice(0, 2).forEach(lead => {
    const lastInteraction = new Date(lead.lastInteraction);
    const daysSince = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
    
    insights.push({
      id: 'churn_' + lead.id,
      type: 'churn_risk',
      severity: 'medium',
      signal: `${daysSince} dias sem interação`,
      insight: `Lead ${lead.name} inativo há ${daysSince} dias em conta com histórico de alto uso.`,
      action: 'reactivate',
      actionLabel: 'Iniciar Reativação',
      entityId: lead.id,
      entityName: lead.name,
      entityType: 'lead',
    });
  });

  // 4. Cross-sell Opportunities
  const crossSellLeads = leads.filter(l => 
    l.score >= 50 && l.score < 75 && 
    l.poolActivated && 
    l.status !== 'lost'
  );
  
  crossSellLeads.slice(0, 2).forEach(lead => {
    insights.push({
      id: 'cross_' + lead.id,
      type: 'cross_sell',
      severity: 'medium',
      signal: 'Uso recorrente de funcionalidade básica',
      insight: `${lead.name} usa dashboards básicos diariamente, mas nunca ativou o Motor de Score.`,
      action: 'offer_module',
      actionLabel: 'Ofertar Motor de Score',
      entityId: lead.id,
      entityName: lead.name,
      entityType: 'lead',
      score: lead.score,
    });
  });

  // 5. Demographic Fit (for admin view - clients ready for enterprise)
  const enterpriseFitClients = clients.filter(c => {
    const users = getUsers(c.id);
    return c.plan === 'PRO' && users.length >= 3 && calculatePoolUtilization(c) > 60;
  });
  
  enterpriseFitClients.slice(0, 1).forEach(c => {
    const users = getUsers(c.id);
    insights.push({
      id: 'demo_fit_' + c.id,
      type: 'demographic_fit',
      severity: 'high',
      signal: `${users.length} usuários ativos no plano Pro`,
      insight: `Empresa com ${users.length} usuários (limite do plano Pro). Alta compatibilidade com Enterprise.`,
      action: 'offer_enterprise',
      actionLabel: 'Ofertar Plano Enterprise',
      entityId: c.id,
      entityName: c.name,
      entityType: 'client',
    });
  });

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights;
}

// Calculate Module Usage (simulated heatmap data)
export function calculateModuleUsage(clientId?: string): ModuleUsage[] {
  const leads = getLeads(clientId);
  const activatedCount = leads.filter(l => l.poolActivated).length;
  const totalLeads = leads.length || 1;
  
  const modules: ModuleUsage[] = [
    {
      module: 'SDR IA',
      usagePercent: Math.min(95, Math.round((activatedCount / totalLeads) * 100) + 30),
      trend: 'up' as const,
      lastUsed: new Date().toISOString().split('T')[0],
    },
    {
      module: 'Lead Scoring',
      usagePercent: Math.min(88, Math.round((activatedCount / totalLeads) * 100) + 20),
      trend: 'stable' as const,
      lastUsed: new Date().toISOString().split('T')[0],
    },
    {
      module: 'Copy Generator',
      usagePercent: Math.round(Math.random() * 30 + 40),
      trend: 'up' as const,
      lastUsed: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      module: 'Analytics',
      usagePercent: Math.round(Math.random() * 25 + 50),
      trend: 'stable' as const,
      lastUsed: new Date().toISOString().split('T')[0],
    },
    {
      module: 'WhatsApp Bot',
      usagePercent: Math.round(Math.random() * 20 + 25),
      trend: 'down' as const,
      lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      module: 'CRM Integration',
      usagePercent: Math.round(Math.random() * 15 + 15),
      trend: 'stable' as const,
      lastUsed: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ];
  
  return modules.sort((a, b) => b.usagePercent - a.usagePercent);
}

// Calculate ROI vs Human SDR
export function calculateROI(clientId?: string, client?: Client): ROICalculation {
  const leads = getLeads(clientId);
  const activatedLeads = leads.filter(l => l.poolActivated).length;
  
  // Assumptions
  const hourlyHumanCost = 45; // R$/hour for human SDR
  const avgTimePerLeadHuman = 0.5; // 30 min per lead
  const avgTimePerLeadAI = 0.05; // 3 min per lead
  const aiCostPerPool = client ? 
    (client.plan === 'ESSENCIAL' ? 8 : client.plan === 'GROWTH' ? 12 : 20) : 12;
  
  const hoursAutomated = activatedLeads * (avgTimePerLeadHuman - avgTimePerLeadAI);
  const humanCost = activatedLeads * avgTimePerLeadHuman * hourlyHumanCost;
  const aiCost = activatedLeads * aiCostPerPool;
  const savings = humanCost - aiCost;
  
  const costPerLead = activatedLeads > 0 ? aiCost / activatedLeads : 0;
  const efficiency = humanCost > 0 ? Math.round((1 - (aiCost / humanCost)) * 100) : 0;
  
  return {
    sdrAISavings: Math.max(0, savings),
    hoursAutomated: Math.round(hoursAutomated * 10) / 10,
    costPerLead: Math.round(costPerLead * 100) / 100,
    efficiency,
  };
}

// Predictive Score Calculation (Enhanced Double Signal Method)
export interface PredictiveScore {
  score: number;
  upgradeReady: boolean;
  signals: {
    behavioral: BehavioralSignal[];
    demographic: DemographicSignal[];
  };
  recommendation: string;
}

export interface BehavioralSignal {
  name: string;
  value: number;
  weight: number;
  indicator: string;
}

export interface DemographicSignal {
  name: string;
  value: number;
  weight: number;
  indicator: string;
}

export function calculatePredictiveScore(lead: Lead, client?: Client): PredictiveScore {
  const now = new Date();
  const lastInteraction = new Date(lead.lastInteraction);
  const daysSinceInteraction = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
  const createdAt = new Date(lead.createdAt);
  const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // ========================================
  // BEHAVIORAL SIGNALS - Focused on CUSTOMER behavior (not platform usage)
  // These reflect how the LEAD/CUSTOMER interacts with the COMPANY
  // ========================================
  const behavioralSignals: BehavioralSignal[] = [
    {
      name: 'Frequência de Contato',
      value: daysSinceInteraction <= 7 ? 100 : daysSinceInteraction <= 14 ? 75 : daysSinceInteraction <= 30 ? 50 : 25,
      weight: 0.25,
      indicator: daysSinceInteraction <= 7 ? 'Ativo' : daysSinceInteraction <= 14 ? 'Recente' : daysSinceInteraction <= 30 ? 'Moderado' : 'Inativo',
    },
    {
      name: 'Resposta a Contatos',
      // Simulated based on status - converted/qualified respond well
      value: lead.status === 'converted' ? 95 : lead.status === 'qualified' ? 80 : lead.status === 'nurturing' ? 60 : lead.status === 'cold' ? 20 : 40,
      weight: 0.20,
      indicator: lead.status === 'converted' || lead.status === 'qualified' ? 'Alta' : lead.status === 'nurturing' ? 'Média' : 'Baixa',
    },
    {
      name: 'Interesse em Ofertas',
      // Based on score - high score means high interest
      value: lead.score >= 70 ? 90 : lead.score >= 50 ? 65 : lead.score >= 30 ? 40 : 20,
      weight: 0.15,
      indicator: lead.score >= 70 ? 'Alto' : lead.score >= 50 ? 'Médio' : 'Baixo',
    },
    {
      name: 'Tempo de Relacionamento',
      // How long has this lead been in the funnel
      value: daysSinceCreated >= 90 ? 85 : daysSinceCreated >= 30 ? 70 : daysSinceCreated >= 14 ? 50 : 30,
      weight: 0.10,
      indicator: daysSinceCreated >= 90 ? '> 3 meses' : daysSinceCreated >= 30 ? '1-3 meses' : '< 1 mês',
    },
  ];

  // ========================================
  // DEMOGRAPHIC SIGNALS - Focused on CUSTOMER profile
  // These reflect the LEAD/CUSTOMER's business characteristics
  // ========================================
  const demographicSignals: DemographicSignal[] = [
    {
      name: 'Perfil Empresarial',
      // Company presence indicates B2B potential
      value: lead.company ? 85 : 45,
      weight: 0.10,
      indicator: lead.company ? 'Qualificado' : 'Individual',
    },
    {
      name: 'Canal de Origem',
      // High-value origins indicate better fit
      value: ['LinkedIn', 'Google Ads', 'Referral', 'Indicação'].some(o => 
        lead.origin.toLowerCase().includes(o.toLowerCase())
      ) ? 90 : ['Site', 'Organic'].some(o => 
        lead.origin.toLowerCase().includes(o.toLowerCase())
      ) ? 70 : 50,
      weight: 0.10,
      indicator: ['LinkedIn', 'Referral', 'Indicação'].some(o => 
        lead.origin.toLowerCase().includes(o.toLowerCase())
      ) ? 'Premium' : 'Padrão',
    },
    {
      name: 'Potencial de Receita',
      // Estimated based on status and score
      value: (lead.status === 'converted' || lead.status === 'qualified') && lead.score >= 60 ? 90 :
             lead.score >= 70 ? 75 :
             lead.score >= 40 ? 55 : 30,
      weight: 0.10,
      indicator: lead.score >= 70 ? 'Alto' : lead.score >= 40 ? 'Médio' : 'Baixo',
    },
  ];

  // Calculate total score
  let totalScore = 0;
  behavioralSignals.forEach(s => totalScore += s.value * s.weight);
  demographicSignals.forEach(s => totalScore += s.value * s.weight);
  totalScore = Math.round(totalScore);

  const upgradeReady = totalScore >= 75 && (lead.status === 'qualified' || lead.status === 'converted');
  
  // Customer-focused recommendations
  let recommendation = '';
  if (totalScore >= 80 && lead.status === 'converted') {
    recommendation = 'Cliente fiel com alto engajamento. Priorizar para expansão de conta ou indicação.';
  } else if (totalScore >= 75) {
    recommendation = 'Perfil ideal para abordagem comercial. Agendar contato prioritário.';
  } else if (totalScore >= 60) {
    recommendation = 'Cliente com potencial moderado. Manter nutrição e monitorar sinais de interesse.';
  } else if (totalScore >= 40) {
    recommendation = 'Relacionamento precisa ser desenvolvido. Aplicar estratégia de reengajamento.';
  } else {
    recommendation = 'Baixo engajamento. Avaliar se vale manter na base ou arquivar.';
  }

  return {
    score: totalScore,
    upgradeReady,
    signals: {
      behavioral: behavioralSignals,
      demographic: demographicSignals,
    },
    recommendation,
  };
}
