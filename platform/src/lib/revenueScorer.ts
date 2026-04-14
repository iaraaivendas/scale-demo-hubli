// ============================================================
// I.ARA Scale - Predictive Score Engine (Upsell & Cross-Sell)
// Motor Score Preditivo com fórmula normalizada (0–100)
// Fontes: CRM (intent_signals, growth_signals) + ERP (payment_behavior, tenure)
// ============================================================

import { Lead, getLeads, getCampaigns } from './storage';
import type { PlanId } from './plans';

// ============= ERP & CRM Data Interfaces =============

export interface PaymentRecord {
  date: string;
  amount_centavos: number;
  status: 'paid' | 'pending' | 'failed';
  days_late: number;
}

export interface ERPData {
  client_id: string;
  payment_history: PaymentRecord[];
  purchase_recurrence: number; // months of consecutive purchase
  contract_start_date: string;
}

export interface IntentEvent {
  id: string;
  type: 'complementary_inquiry' | 'relationship_meeting' | 'support_praise';
  product_reference?: string; // product/plan mentioned
  date: string;
  notes?: string;
}

export interface GrowthSignal {
  id: string;
  type: 'new_branch' | 'team_increase';
  detected_at: string;
  details?: string;
}

export interface CRMData {
  client_id: string;
  intent_events: IntentEvent[];
  growth_signals: GrowthSignal[];
  current_product: string; // current plan ID
  complementary_products: string[];
}

// ============= Opportunity Types =============

export type OpportunityType = 'upsell' | 'cross_sell';
export type OpportunityLevel = 'warming' | 'ready';

export interface OpportunityAlert {
  opportunity_type: OpportunityType;
  score: number;
  level: OpportunityLevel;
  suggested_script: string;
  lead_id: string;
  triggered_at: Date;
}

// ============= Score Components =============

export interface PredictiveScoreBreakdown {
  intent_signals: number;     // 0–100, weight 35%
  payment_behavior: number;   // 0–100, weight 30%
  tenure_score: number;       // 0–100, weight 20%
  growth_signals: number;     // 0–100, weight 15%
  final_score: number;        // 0–100 normalized
}

// ============= Legacy Types (kept for compatibility) =============

export interface RevenueScores {
  upsell: number;
  crossSell: number;
  churnRisk: number;
}

export interface ScoreExplanation {
  score: number;
  factors: ScoreFactor[];
  summary: string;
}

export interface ScoreFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  value: number;
  description: string;
}

export type PriorityAction =
  | 'expansion'
  | 'complementary'
  | 'retention'
  | 'monitoring';

export interface CustomerAnalysis {
  lead: Lead;
  scores: RevenueScores;
  upsellExplanation: ScoreExplanation;
  crossSellExplanation: ScoreExplanation;
  churnExplanation: ScoreExplanation;
  priority: PriorityAction;
  priorityLabel: string;
  priorityDescription: string;
  overallHealth: 'excellent' | 'good' | 'attention' | 'critical';
  // New predictive engine fields
  predictiveBreakdown?: PredictiveScoreBreakdown;
  opportunity?: OpportunityAlert;
}

export type ScoreFilter = 'all' | 'upsell' | 'crossSell' | 'churnRisk';
export type SortDirection = 'asc' | 'desc';

// ============= Constants =============

const THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
} as const;

const PREDICTIVE_WEIGHTS = {
  intent_signals: 0.35,
  payment_behavior: 0.30,
  tenure_score: 0.20,
  growth_signals: 0.15,
} as const;

const OPPORTUNITY_THRESHOLDS = {
  WARMING_MIN: 75,
  READY_MIN: 85,
} as const;

// ============= Helper Functions =============

function daysSinceDate(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function monthsSinceDate(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
}

// ============================================================
// PREDICTIVE SCORE ENGINE — New Formula
// score = (intent × 0.35) + (payment × 0.30) + (tenure × 0.20) + (growth × 0.15)
// ============================================================

/**
 * Calculate intent_signals score (0–100)
 * Source: CRM
 * - Complementary product inquiry = +30pts
 * - Relationship meeting = +20pts
 * - Support praise = +10pts
 * Max: 100pts
 */
export function calculateIntentSignals(crmData: CRMData): number {
  let score = 0;

  for (const event of crmData.intent_events) {
    switch (event.type) {
      case 'complementary_inquiry':
        score += 30;
        break;
      case 'relationship_meeting':
        score += 20;
        break;
      case 'support_praise':
        score += 10;
        break;
    }
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate payment_behavior score (0–100)
 * Source: ERP
 * - On-time payments + monthly recurrence = 100pts
 * - Late payment = -20pts per occurrence
 * - Purchase irregularity = -10pts
 */
export function calculatePaymentBehavior(erpData: ERPData): number {
  let score = 100;

  const latePayments = erpData.payment_history.filter(p => p.days_late > 0);
  score -= latePayments.length * 20;

  // Purchase irregularity: if recurrence is low
  if (erpData.purchase_recurrence < 3) {
    score -= 10;
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate tenure_score (0–100)
 * Source: ERP/CRM
 * 0–3 months = 20pts
 * 3–6 months = 50pts
 * 6–12 months = 75pts
 * 12+ months = 100pts
 */
export function calculateTenureScore(erpData: ERPData): number {
  const months = monthsSinceDate(erpData.contract_start_date);

  if (months >= 12) return 100;
  if (months >= 6) return 75;
  if (months >= 3) return 50;
  return 20;
}

/**
 * Calculate growth_signals score (0–100)
 * Source: CRM
 * - New branch detected = +40pts
 * - Team increase detected = +30pts
 * - No growth data = 0pts
 */
export function calculateGrowthSignals(crmData: CRMData): number {
  let score = 0;

  for (const signal of crmData.growth_signals) {
    switch (signal.type) {
      case 'new_branch':
        score += 40;
        break;
      case 'team_increase':
        score += 30;
        break;
    }
  }

  return clamp(score, 0, 100);
}

/**
 * Calculate the full predictive score (0–100) using weighted formula
 */
export function calculatePredictiveScore(
  crmData: CRMData,
  erpData: ERPData
): PredictiveScoreBreakdown {
  const intent = calculateIntentSignals(crmData);
  const payment = calculatePaymentBehavior(erpData);
  const tenure = calculateTenureScore(erpData);
  const growth = calculateGrowthSignals(crmData);

  const finalScore = Math.round(
    intent * PREDICTIVE_WEIGHTS.intent_signals +
    payment * PREDICTIVE_WEIGHTS.payment_behavior +
    tenure * PREDICTIVE_WEIGHTS.tenure_score +
    growth * PREDICTIVE_WEIGHTS.growth_signals
  );

  return {
    intent_signals: intent,
    payment_behavior: payment,
    tenure_score: tenure,
    growth_signals: growth,
    final_score: clamp(finalScore, 0, 100),
  };
}

// ============================================================
// Upsell vs Cross-Sell Classification
// ============================================================

/**
 * Classify opportunity type based on intent signals:
 * - If intent points to same product/plan → upsell
 * - If intent points to different/complementary product → cross_sell
 */
export function classifyOpportunityType(crmData: CRMData): OpportunityType {
  const inquiries = crmData.intent_events.filter(
    e => e.type === 'complementary_inquiry'
  );

  if (inquiries.length === 0) {
    // No specific inquiry — default to upsell (upgrade volume/plan)
    return 'upsell';
  }

  // Check if any inquiry references a different product
  const referencesDifferentProduct = inquiries.some(e => {
    if (!e.product_reference) return false;
    return (
      e.product_reference !== crmData.current_product &&
      crmData.complementary_products.includes(e.product_reference)
    );
  });

  return referencesDifferentProduct ? 'cross_sell' : 'upsell';
}

/**
 * Determine opportunity level based on score thresholds
 */
export function getOpportunityLevel(score: number): OpportunityLevel | null {
  if (score >= OPPORTUNITY_THRESHOLDS.READY_MIN) return 'ready';
  if (score >= OPPORTUNITY_THRESHOLDS.WARMING_MIN) return 'warming';
  return null; // score < 75 → no action
}

// ============================================================
// Suggested Scripts
// ============================================================

function generateUpsellScript(lead: Lead, score: number): string {
  return `Olá, tudo bem? Notamos que a ${lead.company || lead.name} tem aproveitado muito bem nosso plano atual. ` +
    `Com base no seu perfil (score ${score}/100), identificamos uma oportunidade de escalar seus resultados ` +
    `com um upgrade de volume ou plano. Podemos apresentar um comparativo de ROI atual vs potencial? ` +
    `O argumento de escala é forte no seu caso.`;
}

function generateCrossSellScript(lead: Lead, score: number): string {
  return `Olá, tudo bem? Analisando o perfil da ${lead.company || lead.name} (score ${score}/100), ` +
    `identificamos um produto complementar que pode potencializar os resultados que você já tem. ` +
    `Ele resolve [problema específico] e tem sinergia direta com o que vocês já usam. ` +
    `Posso mostrar como funciona?`;
}

/**
 * Generate a full OpportunityAlert if the score qualifies
 */
export function evaluateOpportunity(
  lead: Lead,
  crmData: CRMData,
  erpData: ERPData
): OpportunityAlert | null {
  const breakdown = calculatePredictiveScore(crmData, erpData);
  const level = getOpportunityLevel(breakdown.final_score);

  if (!level) return null; // score < 75

  const opportunityType = classifyOpportunityType(crmData);

  const suggestedScript =
    opportunityType === 'upsell'
      ? generateUpsellScript(lead, breakdown.final_score)
      : generateCrossSellScript(lead, breakdown.final_score);

  return {
    opportunity_type: opportunityType,
    score: breakdown.final_score,
    level,
    suggested_script: suggestedScript,
    lead_id: lead.id,
    triggered_at: new Date(),
  };
}

// ============================================================
// Plan Gating
// ============================================================

/**
 * Check if the client's plan has access to the predictive score engine.
 * GROWTH and PRO: full access to all 4 signals
 * ESSENCIAL: blocked — show upsell card
 */
export function isPredictiveScoreAvailable(planId: PlanId): boolean {
  return planId === 'GROWTH' || planId === 'PRO';
}

export function getPlanGateMessage(planId: PlanId): string | null {
  if (isPredictiveScoreAvailable(planId)) return null;
  return 'O Motor Score Preditivo de Upsell & Cross-Sell está disponível nos planos Growth e Pro. Faça upgrade para desbloquear.';
}

// ============================================================
// Simulated ERP/CRM Data (demo)
// ============================================================

export function simulateERPData(lead: Lead): ERPData {
  const months = monthsSinceDate(lead.createdAt);
  const lateCount = lead.score < 40 ? 2 : lead.score < 60 ? 1 : 0;

  const paymentHistory: PaymentRecord[] = Array.from({ length: Math.min(months, 12) }, (_, i) => ({
    date: new Date(Date.now() - i * 30 * 86400000).toISOString(),
    amount_centavos: 99900,
    status: (i < lateCount ? 'pending' : 'paid') as PaymentRecord['status'],
    days_late: i < lateCount ? 15 : 0,
  }));

  return {
    client_id: lead.clientId,
    payment_history: paymentHistory,
    purchase_recurrence: Math.min(months, 12),
    contract_start_date: lead.createdAt,
  };
}

export function simulateCRMData(lead: Lead, clientPlan: PlanId): CRMData {
  const intentEvents: IntentEvent[] = [];
  const growthSignals: GrowthSignal[] = [];

  // Simulate intent events based on lead score and status
  if (lead.score >= 70 && lead.status === 'converted') {
    intentEvents.push({
      id: `ie_${lead.id}_1`,
      type: 'complementary_inquiry',
      product_reference: clientPlan === 'ESSENCIAL' ? 'GROWTH' : clientPlan === 'GROWTH' ? 'PRO' : 'PRO',
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
    });
  }

  if (lead.score >= 60) {
    intentEvents.push({
      id: `ie_${lead.id}_2`,
      type: 'relationship_meeting',
      date: new Date(Date.now() - 14 * 86400000).toISOString(),
    });
  }

  if (lead.score >= 80) {
    intentEvents.push({
      id: `ie_${lead.id}_3`,
      type: 'support_praise',
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
    });
  }

  // Simulate growth signals
  if (lead.company && lead.score >= 75) {
    growthSignals.push({
      id: `gs_${lead.id}_1`,
      type: 'new_branch',
      detected_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      details: 'Nova filial detectada no perfil',
    });
  }

  if (lead.score >= 65 && lead.poolActivated) {
    growthSignals.push({
      id: `gs_${lead.id}_2`,
      type: 'team_increase',
      detected_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      details: 'Aumento de equipe detectado',
    });
  }

  // Determine complementary products
  const allPlans = ['ESSENCIAL', 'GROWTH', 'PRO'];
  const complementary = allPlans.filter(p => p !== clientPlan);

  return {
    client_id: lead.clientId,
    intent_events: intentEvents,
    growth_signals: growthSignals,
    current_product: clientPlan,
    complementary_products: complementary,
  };
}

// ============================================================
// Legacy Score Calculators (kept for backward compatibility)
// ============================================================

export function calculateUpsellScore(lead: Lead): ScoreExplanation {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  const scoreContribution = (lead.score / 100) * 30;
  factors.push({
    name: 'Score de Engajamento',
    impact: lead.score >= 70 ? 'positive' : lead.score >= 40 ? 'neutral' : 'negative',
    value: Math.round(scoreContribution),
    description: lead.score >= 70
      ? 'Engajamento alto indica potencial de expansão'
      : lead.score >= 40
      ? 'Engajamento moderado, pode melhorar'
      : 'Engajamento baixo, foco em nutrição primeiro',
  });
  totalScore += scoreContribution;

  const statusScores: Record<string, number> = {
    converted: 25, qualified: 20, nurturing: 10, new: 5, cold: 2, lost: 0,
  };
  const statusContribution = statusScores[lead.status] || 0;
  factors.push({
    name: 'Status do Cliente',
    impact: statusContribution >= 20 ? 'positive' : statusContribution >= 10 ? 'neutral' : 'negative',
    value: statusContribution,
    description: lead.status === 'converted'
      ? 'Cliente convertido - pronto para expansão'
      : `Status ${lead.status} - necessita evolução`,
  });
  totalScore += statusContribution;

  const daysSinceInteraction = daysSinceDate(lead.lastInteraction);
  const interactionContribution = daysSinceInteraction <= 7 ? 20 : daysSinceInteraction <= 14 ? 15 : daysSinceInteraction <= 30 ? 10 : 5;
  factors.push({
    name: 'Interação Recente',
    impact: interactionContribution >= 15 ? 'positive' : interactionContribution >= 10 ? 'neutral' : 'negative',
    value: interactionContribution,
    description: `Interação há ${daysSinceInteraction} dias`,
  });
  totalScore += interactionContribution;

  const poolContribution = lead.poolActivated ? 15 : 5;
  factors.push({
    name: 'Uso de Automação (IA)',
    impact: lead.poolActivated ? 'positive' : 'negative',
    value: poolContribution,
    description: lead.poolActivated ? 'Usa automação de IA' : 'Não usa automação de IA',
  });
  totalScore += poolContribution;

  const highValueOrigins = ['LinkedIn', 'Google Ads', 'Referral', 'Indicação'];
  const isHighValue = highValueOrigins.some(o => lead.origin.toLowerCase().includes(o.toLowerCase()));
  const originContribution = isHighValue ? 10 : 5;
  factors.push({
    name: 'Origem do Lead',
    impact: isHighValue ? 'positive' : 'neutral',
    value: originContribution,
    description: `Origem: ${lead.origin}`,
  });
  totalScore += originContribution;

  const finalScore = clamp(Math.round(totalScore), 0, 100);
  let summary = '';
  if (finalScore >= THRESHOLDS.HIGH) {
    summary = 'Forte potencial de upsell. Cliente engajado e pronto para expansão de conta.';
  } else if (finalScore >= THRESHOLDS.MEDIUM) {
    summary = 'Potencial moderado de upsell. Avaliar oportunidade com abordagem personalizada.';
  } else {
    summary = 'Baixo potencial de upsell no momento. Focar em nutrição e qualificação.';
  }

  return { score: finalScore, factors, summary };
}

export function calculateCrossSellScore(lead: Lead): ScoreExplanation {
  const factors: ScoreFactor[] = [];
  let totalScore = 0;

  const activeStatuses = ['converted', 'qualified', 'nurturing'];
  const hasActiveRelation = activeStatuses.includes(lead.status);
  const relationContribution = hasActiveRelation
    ? (lead.status === 'converted' ? 30 : lead.status === 'qualified' ? 25 : 15)
    : 5;
  factors.push({
    name: 'Relacionamento Ativo',
    impact: relationContribution >= 20 ? 'positive' : relationContribution >= 10 ? 'neutral' : 'negative',
    value: relationContribution,
    description: hasActiveRelation ? 'Relacionamento ativo' : 'Relacionamento inativo',
  });
  totalScore += relationContribution;

  let engagementContribution = 0;
  if (lead.score >= 50 && lead.score < 80) engagementContribution = 25;
  else if (lead.score >= 80) engagementContribution = 20;
  else if (lead.score >= 30) engagementContribution = 15;
  else engagementContribution = 5;
  factors.push({
    name: 'Nível de Engajamento',
    impact: engagementContribution >= 20 ? 'positive' : engagementContribution >= 10 ? 'neutral' : 'negative',
    value: engagementContribution,
    description: `Score de engajamento: ${lead.score}`,
  });
  totalScore += engagementContribution;

  const gapContribution = !lead.poolActivated ? 20 : 10;
  factors.push({
    name: 'Lacuna de Produtos',
    impact: !lead.poolActivated ? 'positive' : 'neutral',
    value: gapContribution,
    description: !lead.poolActivated ? 'Oportunidade de oferta complementar' : 'Avaliar outros complementares',
  });
  totalScore += gapContribution;

  const daysSinceInteraction = daysSinceDate(lead.lastInteraction);
  const recencyContribution = daysSinceInteraction <= 14 ? 15 : daysSinceInteraction <= 30 ? 10 : 5;
  factors.push({
    name: 'Momento de Contato',
    impact: recencyContribution >= 10 ? 'positive' : 'negative',
    value: recencyContribution,
    description: `Último contato há ${daysSinceInteraction} dias`,
  });
  totalScore += recencyContribution;

  const diverseOrigins = ['LinkedIn', 'Email', 'Organic', 'Site'];
  const hasDiverseOrigin = diverseOrigins.some(o => lead.origin.toLowerCase().includes(o.toLowerCase()));
  const originContribution = hasDiverseOrigin ? 10 : 5;
  factors.push({
    name: 'Perfil Compatível',
    impact: hasDiverseOrigin ? 'positive' : 'neutral',
    value: originContribution,
    description: `Origem: ${lead.origin}`,
  });
  totalScore += originContribution;

  const finalScore = clamp(Math.round(totalScore), 0, 100);
  let summary = '';
  if (finalScore >= THRESHOLDS.HIGH) {
    summary = 'Forte potencial de cross-sell. Cliente receptivo a produtos complementares.';
  } else if (finalScore >= THRESHOLDS.MEDIUM) {
    summary = 'Potencial moderado de cross-sell. Avaliar compatibilidade de oferta.';
  } else {
    summary = 'Baixo potencial de cross-sell. Focar em fortalecer relacionamento atual.';
  }

  return { score: finalScore, factors, summary };
}

export function calculateChurnScore(lead: Lead): ScoreExplanation {
  const factors: ScoreFactor[] = [];
  let totalScore = 100;

  const statusRisks: Record<string, number> = {
    converted: 0, qualified: 5, nurturing: 10, new: 15, cold: 25, lost: 30,
  };
  const statusDeduction = statusRisks[lead.status] || 0;
  totalScore -= statusDeduction;
  factors.push({
    name: 'Status do Cliente',
    impact: statusDeduction <= 5 ? 'positive' : statusDeduction <= 15 ? 'neutral' : 'negative',
    value: 30 - statusDeduction,
    description: statusDeduction === 0 ? 'Relacionamento saudável' : `Status ${lead.status}`,
  });

  const daysSinceInteraction = daysSinceDate(lead.lastInteraction);
  const inactivityDeduction = daysSinceInteraction > 60 ? 25 : daysSinceInteraction > 30 ? 15 : daysSinceInteraction > 14 ? 8 : 0;
  totalScore -= inactivityDeduction;
  factors.push({
    name: 'Atividade Recente',
    impact: inactivityDeduction === 0 ? 'positive' : inactivityDeduction <= 10 ? 'neutral' : 'negative',
    value: 25 - inactivityDeduction,
    description: `${daysSinceInteraction} dias desde última interação`,
  });

  const engagementDeduction = lead.score < 30 ? 20 : lead.score < 50 ? 10 : 0;
  totalScore -= engagementDeduction;
  factors.push({
    name: 'Nível de Engajamento',
    impact: engagementDeduction === 0 ? 'positive' : engagementDeduction <= 10 ? 'neutral' : 'negative',
    value: 20 - engagementDeduction,
    description: `Score: ${lead.score}`,
  });

  const usageDeduction = lead.poolActivated ? 0 : 10;
  totalScore -= usageDeduction;
  factors.push({
    name: 'Uso de Recursos',
    impact: usageDeduction === 0 ? 'positive' : 'neutral',
    value: 15 - usageDeduction,
    description: lead.poolActivated ? 'Usa recursos avançados' : 'Não usa recursos avançados',
  });

  const hasLossSignal = lead.lossReason || lead.status === 'cold';
  const lossDeduction = hasLossSignal ? 10 : 0;
  totalScore -= lossDeduction;
  factors.push({
    name: 'Sinais de Insatisfação',
    impact: hasLossSignal ? 'negative' : 'positive',
    value: 10 - lossDeduction,
    description: hasLossSignal ? `Sinal detectado${lead.lossReason ? `: ${lead.lossReason}` : ''}` : 'Nenhum sinal',
  });

  const finalScore = clamp(Math.round(totalScore), 0, 100);
  let summary = '';
  if (finalScore >= THRESHOLDS.HIGH) {
    summary = 'Cliente saudável com baixo risco de churn.';
  } else if (finalScore >= THRESHOLDS.MEDIUM) {
    summary = 'Atenção necessária. Monitoramento recomendado.';
  } else {
    summary = 'Risco alto de churn! Ação imediata de retenção recomendada.';
  }

  return { score: finalScore, factors, summary };
}

// ============= Priority Action Determiner =============

function determinePriority(scores: RevenueScores): {
  priority: PriorityAction;
  label: string;
  description: string;
} {
  if (scores.churnRisk < THRESHOLDS.MEDIUM) {
    return {
      priority: 'retention',
      label: 'Ação Imediata para Retenção',
      description: 'Cliente em risco de churn. Priorizar contato e ações de retenção.',
    };
  }

  if (scores.upsell >= THRESHOLDS.HIGH && scores.churnRisk >= THRESHOLDS.MEDIUM) {
    return {
      priority: 'expansion',
      label: 'Prioridade para Expansão',
      description: 'Cliente com alto potencial de expansão.',
    };
  }

  if (scores.crossSell >= THRESHOLDS.HIGH && scores.upsell < THRESHOLDS.HIGH) {
    return {
      priority: 'complementary',
      label: 'Oportunidade de Oferta Complementar',
      description: 'Cliente receptivo a produtos/serviços complementares.',
    };
  }

  return {
    priority: 'monitoring',
    label: 'Manter Acompanhamento',
    description: 'Cliente estável. Continuar nutrição.',
  };
}

function determineOverallHealth(scores: RevenueScores): CustomerAnalysis['overallHealth'] {
  const avgPositive = (scores.upsell + scores.crossSell + scores.churnRisk) / 3;

  if (scores.churnRisk < THRESHOLDS.MEDIUM) return 'critical';
  if (avgPositive >= 75) return 'excellent';
  if (avgPositive >= 55) return 'good';
  if (avgPositive >= 40) return 'attention';
  return 'critical';
}

// ============= Main Analysis Function =============

export function analyzeCustomer(lead: Lead, clientPlan?: PlanId): CustomerAnalysis {
  const upsellExplanation = calculateUpsellScore(lead);
  const crossSellExplanation = calculateCrossSellScore(lead);
  const churnExplanation = calculateChurnScore(lead);

  const scores: RevenueScores = {
    upsell: upsellExplanation.score,
    crossSell: crossSellExplanation.score,
    churnRisk: churnExplanation.score,
  };

  const { priority, label, description } = determinePriority(scores);
  const overallHealth = determineOverallHealth(scores);

  const analysis: CustomerAnalysis = {
    lead,
    scores,
    upsellExplanation,
    crossSellExplanation,
    churnExplanation,
    priority,
    priorityLabel: label,
    priorityDescription: description,
    overallHealth,
  };

  // Add predictive score if plan allows
  const plan = clientPlan || 'GROWTH'; // default for demo
  if (isPredictiveScoreAvailable(plan)) {
    const erpData = simulateERPData(lead);
    const crmData = simulateCRMData(lead, plan);
    analysis.predictiveBreakdown = calculatePredictiveScore(crmData, erpData);
    analysis.opportunity = evaluateOpportunity(lead, crmData, erpData) ?? undefined;
  }

  return analysis;
}

// ============= Batch Analysis =============

export function analyzeCustomerBase(clientId: string, clientPlan?: PlanId): CustomerAnalysis[] {
  const leads = getLeads(clientId);
  return leads.map(lead => analyzeCustomer(lead, clientPlan));
}

// ============= Filtering & Sorting =============

export function filterAnalyses(
  analyses: CustomerAnalysis[],
  filter: ScoreFilter,
  minScore: number = 0
): CustomerAnalysis[] {
  switch (filter) {
    case 'upsell':
      return analyses.filter(a => a.scores.upsell >= minScore);
    case 'crossSell':
      return analyses.filter(a => a.scores.crossSell >= minScore);
    case 'churnRisk':
      return analyses.filter(a => a.scores.churnRisk <= (100 - minScore));
    default:
      return analyses;
  }
}

export function sortAnalyses(
  analyses: CustomerAnalysis[],
  sortBy: ScoreFilter,
  direction: SortDirection = 'desc'
): CustomerAnalysis[] {
  const sorted = [...analyses].sort((a, b) => {
    let valueA: number, valueB: number;

    switch (sortBy) {
      case 'upsell':
        valueA = a.scores.upsell;
        valueB = b.scores.upsell;
        break;
      case 'crossSell':
        valueA = a.scores.crossSell;
        valueB = b.scores.crossSell;
        break;
      case 'churnRisk':
        valueA = 100 - a.scores.churnRisk;
        valueB = 100 - b.scores.churnRisk;
        break;
      default:
        valueA = (a.scores.upsell + a.scores.crossSell + a.scores.churnRisk) / 3;
        valueB = (b.scores.upsell + b.scores.crossSell + b.scores.churnRisk) / 3;
    }

    return direction === 'desc' ? valueB - valueA : valueA - valueB;
  });

  return sorted;
}

// ============= Summary Statistics =============

export interface CustomerBaseSummary {
  total: number;
  upsellReady: number;
  crossSellReady: number;
  churnRisk: number;
  healthy: number;
  averageUpsell: number;
  averageCrossSell: number;
  averageHealth: number;
}

export function summarizeCustomerBase(analyses: CustomerAnalysis[]): CustomerBaseSummary {
  if (analyses.length === 0) {
    return {
      total: 0, upsellReady: 0, crossSellReady: 0, churnRisk: 0, healthy: 0,
      averageUpsell: 0, averageCrossSell: 0, averageHealth: 0,
    };
  }

  return {
    total: analyses.length,
    upsellReady: analyses.filter(a => a.scores.upsell >= THRESHOLDS.HIGH).length,
    crossSellReady: analyses.filter(a => a.scores.crossSell >= THRESHOLDS.HIGH).length,
    churnRisk: analyses.filter(a => a.scores.churnRisk < THRESHOLDS.MEDIUM).length,
    healthy: analyses.filter(a => a.scores.churnRisk >= THRESHOLDS.HIGH).length,
    averageUpsell: Math.round(analyses.reduce((sum, a) => sum + a.scores.upsell, 0) / analyses.length),
    averageCrossSell: Math.round(analyses.reduce((sum, a) => sum + a.scores.crossSell, 0) / analyses.length),
    averageHealth: Math.round(analyses.reduce((sum, a) => sum + a.scores.churnRisk, 0) / analyses.length),
  };
}

// ============= Score Level Helpers =============

export function getScoreLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= THRESHOLDS.HIGH) return 'high';
  if (score >= THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

export function getChurnRiskLevel(score: number): 'high' | 'medium' | 'low' {
  if (score < THRESHOLDS.MEDIUM) return 'high';
  if (score < THRESHOLDS.HIGH) return 'medium';
  return 'low';
}

export function getHealthColor(health: CustomerAnalysis['overallHealth']): string {
  switch (health) {
    case 'excellent': return 'text-primary';
    case 'good': return 'text-accent-foreground';
    case 'attention': return 'text-warning';
    case 'critical': return 'text-destructive';
  }
}

export function getPriorityColor(priority: PriorityAction): string {
  switch (priority) {
    case 'expansion': return 'text-primary bg-primary/10';
    case 'complementary': return 'text-accent-foreground bg-accent/50';
    case 'retention': return 'text-destructive bg-destructive/10';
    case 'monitoring': return 'text-muted-foreground bg-muted';
  }
}
