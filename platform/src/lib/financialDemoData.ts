// I.ARA Scale - Financial Demo Data Initialization
// Gera dados de demonstração para os dashboards financeiros

import {
  getPayments,
  getSubscriptions,
  getCampaignsFinancial,
  getGoals,
  getPoolsUsage,
  savePayment,
  saveSubscription,
  saveCampaignFinancial,
  saveGoals,
  savePoolsUsage,
  getCurrentMonthReference,
  generateFinancialId,
  type Payment,
  type Subscription,
  type CampaignFinancial,
  type Goals,
  type PoolsUsage,
} from './financialData';

import { PLANS } from './plans';

// Flag para evitar reinicialização
const FINANCIAL_DEMO_FLAG = 'iara_financial_demo_initialized';

/**
 * Inicializa dados de demonstração financeiros para um cliente
 */
export function initializeFinancialDemoData(clientId: string, plan: 'ESSENCIAL' | 'GROWTH' | 'PRO'): void {
  // Verifica se já foi inicializado
  const flag = localStorage.getItem(`${FINANCIAL_DEMO_FLAG}_${clientId}`);
  if (flag === 'true') return;
  
  const planConfig = PLANS[plan];
  const currentMonth = getCurrentMonthReference();
  const currentDate = new Date();
  
  // 1. Criar Subscription
  const subscription: Subscription = {
    clientId,
    plan,
    monthlyFeeCentavos: planConfig.monthlyPrice * 100, // Converter para centavos
    poolsIncluded: planConfig.poolsIncluded,
    usersLimit: planConfig.userLimit,
    status: 'active',
    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1).toISOString(),
  };
  saveSubscription(subscription);
  
  // 2. Criar Goals baseados no plano
  const multiplier = plan === 'PRO' ? 3 : plan === 'GROWTH' ? 2 : 1;
  const goals: Goals = {
    clientId,
    monthlyGoalCentavos: 5000000 * multiplier, // R$ 50.000 * multiplier
    annualGoalCentavos: 60000000 * multiplier, // R$ 600.000 * multiplier
  };
  saveGoals(goals);
  
  // 3. Criar Payments históricos (últimos 6 meses)
  for (let i = 5; i >= 0; i--) {
    const paymentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 15);
    const monthRef = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Payment de subscription
    const subscriptionPayment: Payment = {
      id: generateFinancialId('pay'),
      clientId,
      amountCentavos: planConfig.monthlyPrice * 100,
      status: 'paid',
      paymentDate: paymentDate.toISOString(),
      type: 'subscription',
    };
    savePayment(subscriptionPayment);
    
    // Alguns meses com pools extras (variação)
    if (i % 2 === 0 && i < 4) {
      const extraPoolsPayment: Payment = {
        id: generateFinancialId('pay'),
        clientId,
        amountCentavos: 99000, // R$ 990,00 = 500 pools
        status: 'paid',
        paymentDate: new Date(paymentDate.getTime() + 86400000 * 5).toISOString(),
        type: 'extra_pools',
      };
      savePayment(extraPoolsPayment);
    }
    
    // Adicionar receita de campanhas como payments (simulação de atribuição)
    const campaignRevenue = (2000000 + Math.random() * 3000000) * multiplier; // R$ 20k a R$ 50k
    const campaignPayment: Payment = {
      id: generateFinancialId('pay'),
      clientId,
      amountCentavos: Math.round(campaignRevenue),
      status: 'paid',
      paymentDate: new Date(paymentDate.getTime() + 86400000 * 10).toISOString(),
      type: 'subscription', // Receita atribuída
    };
    savePayment(campaignPayment);
  }
  
  // 4. Criar Campaigns Financial
  const channels = ['Meta Ads', 'Google Ads', 'LinkedIn', 'Email', 'Organic'];
  const campaignNames = [
    'Lançamento Produto',
    'Black Friday',
    'Remarketing Q1',
    'Lead Magnet eBook',
    'Webinar Exclusivo',
    'Prospecção LinkedIn',
  ];
  
  campaignNames.forEach((name, index) => {
    const channel = channels[index % channels.length];
    const spend = (50000 + Math.random() * 100000) * multiplier; // R$ 500 a R$ 1.500
    const leads = Math.floor(20 + Math.random() * 80);
    const conversions = Math.floor(leads * (0.05 + Math.random() * 0.15));
    const revenuePerConversion = 100000 + Math.random() * 200000; // R$ 1k a R$ 3k
    
    const campaign: CampaignFinancial = {
      id: generateFinancialId('camp'),
      clientId,
      name,
      channel,
      spendCentavos: Math.round(spend),
      leads,
      conversions,
      revenueAttributedCentavos: Math.round(conversions * revenuePerConversion),
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() - Math.floor(index / 2), 10 + index).toISOString(),
    };
    saveCampaignFinancial(campaign);
  });
  
  // 5. Criar Pools Usage (últimos 3 meses)
  for (let i = 2; i >= 0; i--) {
    const usageDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthRef = `${usageDate.getFullYear()}-${String(usageDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Uso progressivo - mês atual tem mais uso
    const baseUsage = planConfig.poolsIncluded * (0.4 + (2 - i) * 0.15);
    const variance = Math.random() * 0.2 - 0.1; // ±10%
    
    const usage: PoolsUsage = {
      clientId,
      monthReference: monthRef,
      poolsUsed: Math.round(baseUsage * (1 + variance)),
    };
    savePoolsUsage(usage);
  }
  
  // Marcar como inicializado
  localStorage.setItem(`${FINANCIAL_DEMO_FLAG}_${clientId}`, 'true');
}

/**
 * Força reinicialização dos dados demo (para debugging)
 */
export function resetFinancialDemoData(clientId: string): void {
  localStorage.removeItem(`${FINANCIAL_DEMO_FLAG}_${clientId}`);
}

/**
 * Verifica se já foi inicializado
 */
export function isFinancialDemoInitialized(clientId: string): boolean {
  return localStorage.getItem(`${FINANCIAL_DEMO_FLAG}_${clientId}`) === 'true';
}
