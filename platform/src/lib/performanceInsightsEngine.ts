// I.ARA Scale - Performance Insights Engine
// Generates comprehensive performance reports when Performance & Insights AI is activated

import type { Lead } from './storage';
import { analyzeCustomer, type CustomerAnalysis } from './revenueScorer';

// ============= Types =============

export type HealthLevel = 'excellent' | 'good' | 'attention' | 'critical';
export type InsightSeverity = 'positive' | 'alert' | 'critical';
export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface PerformanceInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  icon: string; // Lucide icon name
}

export interface PerformanceRecommendation {
  id: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  category: string;
}

export interface EngagementMetrics {
  daysSinceLastInteraction: number;
  origin: string;
  funnelStatus: string;
  scoreValue: number;
  poolActivated: boolean;
  createdDaysAgo: number;
}

export interface PerformanceReport {
  id: string;
  leadId: string;
  activationId: string;
  overallHealth: HealthLevel;
  healthScore: number; // 0-100
  scores: {
    upsell: { score: number; summary: string; factors: Array<{ name: string; impact: string; value: number; description: string }> };
    crossSell: { score: number; summary: string; factors: Array<{ name: string; impact: string; value: number; description: string }> };
    churnRisk: { score: number; summary: string; factors: Array<{ name: string; impact: string; value: number; description: string }> };
  };
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  engagementMetrics: EngagementMetrics;
  generatedAt: string;
}

// ============= Storage =============

const STORAGE_KEY = 'iara_performance_reports';

function getReports(): PerformanceReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReports(reports: PerformanceReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getPerformanceReport(leadId: string): PerformanceReport | null {
  const reports = getReports();
  // Return the most recent report for this lead
  const leadReports = reports.filter(r => r.leadId === leadId);
  return leadReports.length > 0 ? leadReports[leadReports.length - 1] : null;
}

export function savePerformanceReport(report: PerformanceReport): void {
  const reports = getReports();
  reports.push(report);
  saveReports(reports);
}

// ============= Insight Generation =============

function daysSince(dateString: string): number {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
}

function generateInsights(lead: Lead, analysis: CustomerAnalysis): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const days = daysSince(lead.lastInteraction);

  // Engagement insights
  if (days <= 7) {
    insights.push({
      id: 'engagement_high',
      title: 'Engajamento Elevado',
      description: `Última interação há ${days} dias. Cliente altamente engajado e receptivo.`,
      severity: 'positive',
      icon: 'TrendingUp',
    });
  } else if (days > 30) {
    insights.push({
      id: 'engagement_low',
      title: 'Inatividade Detectada',
      description: `Sem interação há ${days} dias. Risco de desengajamento aumentando.`,
      severity: 'critical',
      icon: 'AlertTriangle',
    });
  } else if (days > 14) {
    insights.push({
      id: 'engagement_medium',
      title: 'Engajamento em Queda',
      description: `${days} dias sem contato. Recomendamos reengajamento proativo.`,
      severity: 'alert',
      icon: 'Clock',
    });
  }

  // Score-based insights
  if (lead.score >= 80) {
    insights.push({
      id: 'score_high',
      title: 'Score Excelente',
      description: `Score de ${lead.score} indica forte potencial de conversão e expansão.`,
      severity: 'positive',
      icon: 'Star',
    });
  } else if (lead.score < 30) {
    insights.push({
      id: 'score_low',
      title: 'Score Crítico',
      description: `Score de ${lead.score} requer atenção imediata para evitar perda.`,
      severity: 'critical',
      icon: 'AlertOctagon',
    });
  }

  // Status insights
  if (lead.status === 'converted') {
    insights.push({
      id: 'status_converted',
      title: 'Cliente Convertido',
      description: 'Lead já convertido — foco em retenção e expansão da conta.',
      severity: 'positive',
      icon: 'CheckCircle',
    });
  } else if (lead.status === 'cold') {
    insights.push({
      id: 'status_cold',
      title: 'Lead Frio',
      description: 'Lead classificado como frio. Necessita campanha de reativação.',
      severity: 'critical',
      icon: 'Snowflake',
    });
  } else if (lead.status === 'qualified') {
    insights.push({
      id: 'status_qualified',
      title: 'Lead Qualificado',
      description: 'Lead qualificado e pronto para abordagem comercial direta.',
      severity: 'positive',
      icon: 'Target',
    });
  }

  // Churn risk insight
  if (analysis.scores.churnRisk < 40) {
    insights.push({
      id: 'churn_high',
      title: 'Alto Risco de Churn',
      description: 'Múltiplos sinais indicam risco elevado de perda. Ação imediata recomendada.',
      severity: 'critical',
      icon: 'ShieldAlert',
    });
  }

  // Upsell opportunity
  if (analysis.scores.upsell >= 70) {
    insights.push({
      id: 'upsell_opportunity',
      title: 'Oportunidade de Upsell',
      description: 'Perfil do cliente indica forte receptividade para upgrade de serviços.',
      severity: 'positive',
      icon: 'ArrowUpCircle',
    });
  }

  // Pool activation
  if (!lead.poolActivated) {
    insights.push({
      id: 'pool_not_activated',
      title: 'Automação Não Ativada',
      description: 'Lead ainda não utiliza automação de IA — oportunidade de ativação.',
      severity: 'alert',
      icon: 'Zap',
    });
  }

  return insights;
}

function generateRecommendations(lead: Lead, analysis: CustomerAnalysis): PerformanceRecommendation[] {
  const recs: PerformanceRecommendation[] = [];

  // Based on priority action
  if (analysis.priority === 'retention') {
    recs.push({
      id: 'rec_retention',
      title: 'Ação de Retenção Urgente',
      description: 'Iniciar contato personalizado imediatamente. Oferecer benefício exclusivo para manter o relacionamento.',
      priority: 'high',
      category: 'Retenção',
    });
  }

  if (analysis.priority === 'expansion') {
    recs.push({
      id: 'rec_expansion',
      title: 'Proposta de Expansão',
      description: 'Apresentar upgrade de plano ou volume maior. Cliente tem perfil ideal para expansão.',
      priority: 'high',
      category: 'Vendas',
    });
  }

  if (analysis.priority === 'complementary') {
    recs.push({
      id: 'rec_crosssell',
      title: 'Oferta Complementar',
      description: 'Avaliar produtos/serviços complementares que agreguem valor à conta atual.',
      priority: 'medium',
      category: 'Cross-sell',
    });
  }

  // Generic recommendations based on data
  const days = daysSince(lead.lastInteraction);
  if (days > 14) {
    recs.push({
      id: 'rec_reengagement',
      title: 'Campanha de Reengajamento',
      description: `${days} dias sem contato. Enviar conteúdo de valor ou oferta personalizada.`,
      priority: days > 30 ? 'high' : 'medium',
      category: 'Engajamento',
    });
  }

  if (lead.score < 50 && lead.status !== 'lost') {
    recs.push({
      id: 'rec_nurturing',
      title: 'Programa de Nutrição',
      description: 'Incluir em fluxo de nutrição com conteúdo educativo e cases de sucesso.',
      priority: 'medium',
      category: 'Nutrição',
    });
  }

  if (!lead.poolActivated) {
    recs.push({
      id: 'rec_activate_ai',
      title: 'Ativar Automação de IA',
      description: 'Ativar IA conversacional para automatizar follow-ups e qualificação.',
      priority: 'low',
      category: 'Automação',
    });
  }

  // Always add a monitoring recommendation
  recs.push({
    id: 'rec_monitor',
    title: 'Monitoramento Contínuo',
    description: 'Acompanhar evolução dos scores e métricas semanalmente para ajustar estratégia.',
    priority: 'low',
    category: 'Acompanhamento',
  });

  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ============= Main Generation Function =============

export function generatePerformanceInsights(lead: Lead, activationId: string): PerformanceReport {
  const analysis = analyzeCustomer(lead);
  const days = daysSince(lead.lastInteraction);
  const createdDays = daysSince(lead.createdAt);

  const healthScore = Math.round(
    (analysis.scores.upsell + analysis.scores.crossSell + analysis.scores.churnRisk) / 3
  );

  const report: PerformanceReport = {
    id: `perf_${Date.now()}`,
    leadId: lead.id,
    activationId,
    overallHealth: analysis.overallHealth,
    healthScore,
    scores: {
      upsell: {
        score: analysis.upsellExplanation.score,
        summary: analysis.upsellExplanation.summary,
        factors: analysis.upsellExplanation.factors,
      },
      crossSell: {
        score: analysis.crossSellExplanation.score,
        summary: analysis.crossSellExplanation.summary,
        factors: analysis.crossSellExplanation.factors,
      },
      churnRisk: {
        score: analysis.churnExplanation.score,
        summary: analysis.churnExplanation.summary,
        factors: analysis.churnExplanation.factors,
      },
    },
    insights: generateInsights(lead, analysis),
    recommendations: generateRecommendations(lead, analysis),
    engagementMetrics: {
      daysSinceLastInteraction: days,
      origin: lead.origin,
      funnelStatus: lead.status,
      scoreValue: lead.score,
      poolActivated: lead.poolActivated,
      createdDaysAgo: createdDays,
    },
    generatedAt: new Date().toISOString(),
  };

  savePerformanceReport(report);
  return report;
}
