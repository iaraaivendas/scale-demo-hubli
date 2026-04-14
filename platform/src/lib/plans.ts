// I.ARA Scale - Plans Configuration
// Sistema de planos, pools e regras comerciais

export type PlanId = 'ESSENCIAL' | 'GROWTH' | 'PRO';

export interface Plan {
  id: PlanId;
  name: string;
  displayName: string;
  monthlyPrice: number;
  poolsIncluded: number;
  userLimit: number;
  setupFee: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface AdditionalPoolsPackage {
  id: string;
  pools: number;
  price: number;
  description: string;
}

// ===========================================
// PLANOS I.ARA SCALE
// ===========================================

export const PLANS: Record<PlanId, Plan> = {
  ESSENCIAL: {
    id: 'ESSENCIAL',
    name: 'ESSENCIAL',
    displayName: 'I.ARA Essencial',
    monthlyPrice: 999,
    poolsIncluded: 450,
    userLimit: 2,
    setupFee: 0,
    description: 'Ideal para pequenas operações',
    features: [
      '450 pools/mês',
      'IA Comercial WhatsApp',
      'IA Reativação',
      'Dashboard básico',
      'Integrações CRM',
    ],
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'GROWTH',
    displayName: 'I.ARA Growth',
    monthlyPrice: 1499,
    poolsIncluded: 1000,
    userLimit: 5,
    setupFee: 0,
    description: 'Para empresas em crescimento',
    recommended: true,
    features: [
      '1.000 pools/mês',
      'Tudo do Essencial',
      'WhatsApp com Áudio',
      'IA Performance',
      'Score de Upsell',
      'Analytics Avançado',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'PRO',
    displayName: 'I.ARA Pro',
    monthlyPrice: 2399,
    poolsIncluded: 2000,
    userLimit: 8,
    setupFee: 0,
    description: 'Para operações maduras e times maiores',
    features: [
      '2.000 pools/mês',
      'Tudo do Growth',
      'Copy Marketing IA',
      'Propostas Automáticas',
      'Forecast Comercial',
      'API Dedicada',
    ],
  },
};

// ===========================================
// PACOTES DE POOLS ADICIONAIS
// ===========================================

export const ADDITIONAL_POOLS_PACKAGES: AdditionalPoolsPackage[] = [
  {
    id: 'pack_500',
    pools: 500,
    price: 990,
    description: '+500 pools adicionais',
  },
  {
    id: 'pack_1000',
    pools: 1000,
    price: 1790,
    description: '+1.000 pools adicionais',
  },
];

// Limite máximo de pools adicionais por mês
export const MAX_ADDITIONAL_POOLS_PER_MONTH = 1000;

// ===========================================
// THRESHOLDS DE ALERTA
// ===========================================

export const POOL_ALERT_THRESHOLDS = {
  warning70: 70,
  warning90: 90,
  critical100: 100,
} as const;

// ===========================================
// FUNÇÕES AUXILIARES
// ===========================================

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

export function getNextPlan(currentPlanId: PlanId): Plan | null {
  if (currentPlanId === 'ESSENCIAL') return PLANS.GROWTH;
  if (currentPlanId === 'GROWTH') return PLANS.PRO;
  return null; // PRO é o maior plano
}

export function getPreviousPlan(currentPlanId: PlanId): Plan | null {
  if (currentPlanId === 'PRO') return PLANS.GROWTH;
  if (currentPlanId === 'GROWTH') return PLANS.ESSENCIAL;
  return null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getPoolAlertLevel(
  usedPools: number,
  totalPools: number
): 'normal' | 'warning70' | 'warning90' | 'critical' {
  const percentage = (usedPools / totalPools) * 100;
  
  if (percentage >= 100) return 'critical';
  if (percentage >= 90) return 'warning90';
  if (percentage >= 70) return 'warning70';
  return 'normal';
}

export function canAddMoreUsers(
  currentUsers: number,
  planId: PlanId
): { allowed: boolean; message: string } {
  const plan = PLANS[planId];
  
  if (currentUsers >= plan.userLimit) {
    return {
      allowed: false,
      message: `Limite de ${plan.userLimit} usuários atingido. Faça upgrade do seu plano para adicionar mais usuários.`,
    };
  }
  
  return {
    allowed: true,
    message: `Você pode adicionar mais ${plan.userLimit - currentUsers} usuário(s).`,
  };
}

export function canPurchaseAdditionalPools(
  currentAdditionalPools: number,
  packageToPurchase: AdditionalPoolsPackage
): { allowed: boolean; message: string } {
  const newTotal = currentAdditionalPools + packageToPurchase.pools;
  
  if (newTotal > MAX_ADDITIONAL_POOLS_PER_MONTH) {
    const remaining = MAX_ADDITIONAL_POOLS_PER_MONTH - currentAdditionalPools;
    return {
      allowed: false,
      message: remaining > 0
        ? `Você pode adicionar no máximo mais ${remaining} pools este mês. Para mais ativações, faça upgrade do seu plano.`
        : `Limite de pools adicionais atingido (${MAX_ADDITIONAL_POOLS_PER_MONTH}/mês). Faça upgrade do seu plano para mais ativações.`,
    };
  }
  
  return {
    allowed: true,
    message: `Pacote de ${packageToPurchase.pools} pools disponível para compra.`,
  };
}

export function canActivateAI(
  usedPools: number,
  includedPools: number,
  additionalPools: number
): { allowed: boolean; message: string; remaining: number } {
  const totalPools = includedPools + additionalPools;
  const remaining = totalPools - usedPools;
  
  if (usedPools >= totalPools) {
    return {
      allowed: false,
      message: 'Limite de pools atingido. Adquira pools adicionais ou faça upgrade do seu plano.',
      remaining: 0,
    };
  }
  
  return {
    allowed: true,
    message: `${remaining} pools disponíveis.`,
    remaining,
  };
}

export function calculateMonthlyTotal(
  planId: PlanId,
  additionalPools: number
): { planPrice: number; additionalPrice: number; total: number } {
  const plan = PLANS[planId];
  let additionalPrice = 0;
  
  // Calcula preço dos pools adicionais
  if (additionalPools >= 1000) {
    additionalPrice = 1790;
  } else if (additionalPools >= 500) {
    additionalPrice = 990;
  }
  
  return {
    planPrice: plan.monthlyPrice,
    additionalPrice,
    total: plan.monthlyPrice + additionalPrice,
  };
}
