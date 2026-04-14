// AI Types and Governance for I.ARA Scale
import type { Client } from './storage';

// AI Type Definition
export type AITypeId = 
  | 'commercial'      // IA Comercial
  | 'reactivation'    // IA Reativação
  | 'performance'     // IA Performance & Insights
  | 'upsell'          // IA Upsell & Cross-sell
  | 'marketing'       // IA Marketing & Copy
  | 'copy';           // IA Copy Avançada

export type AIActivationStatus = 'active' | 'paused' | 'finished' | 'blocked';

export interface AIType {
  id: AITypeId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  poolCost: number;
  requiredPlan: Client['plan'];
  conversational: boolean; // Whether it appears in WhatsApp
}

// AI Type Configuration
export const AI_TYPES: Record<AITypeId, AIType> = {
  commercial: {
    id: 'commercial',
    name: 'IA Comercial',
    description: 'Atendimento comercial automatizado via WhatsApp. Qualifica leads, responde dúvidas e agenda demonstrações.',
    icon: 'MessageSquare',
    color: 'text-primary',
    poolCost: 1,
    requiredPlan: 'ESSENCIAL',
    conversational: true,
  },
  reactivation: {
    id: 'reactivation',
    name: 'IA Reativação',
    description: 'Reativa leads inativos com campanhas personalizadas. Identifica oportunidades de retorno.',
    icon: 'RefreshCw',
    color: 'text-warning',
    poolCost: 1,
    requiredPlan: 'ESSENCIAL',
    conversational: true,
  },
  performance: {
    id: 'performance',
    name: 'IA Performance & Insights',
    description: 'Análise de performance do lead com insights de comportamento. Sugere ações otimizadas.',
    icon: 'LineChart',
    color: 'text-info',
    poolCost: 1,
    requiredPlan: 'GROWTH',
    conversational: false,
  },
  upsell: {
    id: 'upsell',
    name: 'IA Upsell & Cross-sell',
    description: 'Identifica oportunidades de vendas adicionais. Sugere upgrades e produtos complementares.',
    icon: 'TrendingUp',
    color: 'text-purple-400',
    poolCost: 1,
    requiredPlan: 'GROWTH',
    conversational: true,
  },
  marketing: {
    id: 'marketing',
    name: 'IA Marketing',
    description: 'Automação de campanhas de marketing personalizadas. Segmentação inteligente.',
    icon: 'Megaphone',
    color: 'text-pink-400',
    poolCost: 1,
    requiredPlan: 'PRO',
    conversational: false,
  },
  copy: {
    id: 'copy',
    name: 'IA Copy Avançada',
    description: 'Geração de copy persuasivo com atribuição avançada. Otimiza mensagens por canal.',
    icon: 'FileEdit',
    color: 'text-emerald-400',
    poolCost: 1,
    requiredPlan: 'PRO',
    conversational: false,
  },
};

// Lead AI Activation (per AI type)
export interface LeadAIActivation {
  id: string;
  leadId: string;
  clientId: string;
  aiTypeId: AITypeId;
  status: AIActivationStatus;
  activatedBy: string;
  activatedByName: string;
  activatedAt: string;
  pausedAt?: string;
  finishedAt?: string;
  poolConsumed: boolean;
  lastInteraction?: string;
}

// Plan governance - which AIs are available for each plan
export const PLAN_AI_ACCESS: Record<Client['plan'], AITypeId[]> = {
  ESSENCIAL: ['commercial', 'reactivation'],
  GROWTH: ['commercial', 'reactivation', 'performance', 'upsell'],
  PRO: ['commercial', 'reactivation', 'performance', 'upsell', 'marketing', 'copy'],
};

// Helper functions
export function isAIAvailableForPlan(aiTypeId: AITypeId, plan: Client['plan']): boolean {
  return PLAN_AI_ACCESS[plan].includes(aiTypeId);
}

export function getAvailableAIsForPlan(plan: Client['plan']): AIType[] {
  return PLAN_AI_ACCESS[plan].map(id => AI_TYPES[id]);
}

export function getAllAITypes(): AIType[] {
  return Object.values(AI_TYPES);
}

export function getAIType(id: AITypeId): AIType {
  return AI_TYPES[id];
}

export function getRequiredPlanForAI(aiTypeId: AITypeId): Client['plan'] {
  return AI_TYPES[aiTypeId].requiredPlan;
}

// Get the minimum plan needed for an AI
export function getPlanUpgradeInfo(currentPlan: Client['plan'], requiredPlan: Client['plan']): {
  needsUpgrade: boolean;
  targetPlan: Client['plan'] | null;
} {
  const planOrder: Client['plan'][] = ['ESSENCIAL', 'GROWTH', 'PRO'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const requiredIndex = planOrder.indexOf(requiredPlan);
  
  if (currentIndex >= requiredIndex) {
    return { needsUpgrade: false, targetPlan: null };
  }
  
  return { needsUpgrade: true, targetPlan: requiredPlan };
}

// Get conversational AIs for WhatsApp display
export function getConversationalAIs(): AIType[] {
  return Object.values(AI_TYPES).filter(ai => ai.conversational);
}
