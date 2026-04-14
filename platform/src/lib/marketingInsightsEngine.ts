// I.ARA Scale - Marketing Insights Engine
// Generates marketing reports when Marketing AI is activated for a lead

import type { Lead } from './storage';

// ============= Types =============

export interface MarketingSegment {
  id: string;
  name: string;
  description: string;
  matchScore: number; // 0-100
  icon: string;
}

export interface SuggestedCampaign {
  id: string;
  name: string;
  channel: string;
  objective: string;
  estimatedReach: string;
  estimatedConversion: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface ChannelRecommendation {
  channel: string;
  score: number; // 0-100
  reason: string;
  icon: string;
}

export interface MarketingReport {
  id: string;
  leadId: string;
  activationId: string;
  segments: MarketingSegment[];
  suggestedCampaigns: SuggestedCampaign[];
  channelRecommendations: ChannelRecommendation[];
  audienceProfile: {
    engagementLevel: string;
    preferredChannel: string;
    bestContactTime: string;
    contentAffinity: string[];
  };
  generatedAt: string;
}

// ============= Storage =============

const STORAGE_KEY = 'iara_marketing_reports';

function getReports(): MarketingReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveReports(reports: MarketingReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getMarketingReport(leadId: string): MarketingReport | null {
  const reports = getReports();
  const leadReports = reports.filter(r => r.leadId === leadId);
  return leadReports.length > 0 ? leadReports[leadReports.length - 1] : null;
}

export function saveMarketingReport(report: MarketingReport): void {
  const reports = getReports();
  reports.push(report);
  saveReports(reports);
}

// ============= Generation =============

function generateSegments(lead: Lead): MarketingSegment[] {
  const segments: MarketingSegment[] = [];

  if (lead.score >= 70) {
    segments.push({ id: 'seg_high_value', name: 'Alto Valor', description: 'Leads com score elevado e alta probabilidade de conversão.', matchScore: 92, icon: 'Star' });
  }
  if (lead.status === 'qualified' || lead.status === 'converted') {
    segments.push({ id: 'seg_decision', name: 'Decisores', description: 'Leads qualificados prontos para proposta comercial.', matchScore: 85, icon: 'Target' });
  }
  if (lead.origin === 'Meta Ads' || lead.origin === 'Google Ads') {
    segments.push({ id: 'seg_paid', name: 'Tráfego Pago', description: 'Captados via campanhas pagas — responde bem a remarketing.', matchScore: 78, icon: 'Megaphone' });
  }
  if (lead.status === 'cold' || lead.status === 'nurturing') {
    segments.push({ id: 'seg_nurture', name: 'Nutrição', description: 'Leads que necessitam de educação e conteúdo antes da venda.', matchScore: 65, icon: 'BookOpen' });
  }

  // Always add a general segment
  segments.push({ id: 'seg_general', name: 'Base Ativa', description: 'Audiência geral para campanhas de awareness e branding.', matchScore: 50, icon: 'Users' });

  return segments.sort((a, b) => b.matchScore - a.matchScore);
}

function generateCampaigns(lead: Lead): SuggestedCampaign[] {
  const campaigns: SuggestedCampaign[] = [];

  if (lead.score >= 60) {
    campaigns.push({
      id: 'camp_conversion', name: 'Campanha de Conversão Direta', channel: 'Email + WhatsApp',
      objective: 'Converter lead qualificado em cliente', estimatedReach: '1 lead direto',
      estimatedConversion: '35-50%', priority: 'high',
      description: 'Envio de proposta personalizada com CTA direto. Combinar email com follow-up via WhatsApp.',
    });
  }

  if (lead.status === 'cold' || lead.status === 'nurturing') {
    campaigns.push({
      id: 'camp_reengagement', name: 'Reengajamento Personalizado', channel: 'Email Marketing',
      objective: 'Reativar interesse do lead', estimatedReach: 'Segmento similar',
      estimatedConversion: '15-25%', priority: lead.status === 'cold' ? 'high' : 'medium',
      description: 'Sequência de 3 emails com conteúdo de valor, case de sucesso e oferta exclusiva.',
    });
  }

  campaigns.push({
    id: 'camp_content', name: 'Nutrição com Conteúdo', channel: 'Email + Blog',
    objective: 'Educar e qualificar o lead', estimatedReach: 'Base completa',
    estimatedConversion: '8-15%', priority: 'medium',
    description: 'Fluxo automatizado de conteúdo educativo alinhado ao estágio do funil.',
  });

  if (lead.origin === 'Meta Ads' || lead.origin === 'Google Ads') {
    campaigns.push({
      id: 'camp_remarketing', name: 'Remarketing Avançado', channel: lead.origin,
      objective: 'Recuperar atenção com anúncios segmentados', estimatedReach: 'Lookalike audience',
      estimatedConversion: '12-20%', priority: 'medium',
      description: 'Campanha de remarketing com criativos dinâmicos baseados no comportamento do lead.',
    });
  }

  campaigns.push({
    id: 'camp_social', name: 'Social Proof & Autoridade', channel: 'LinkedIn + Instagram',
    objective: 'Construir autoridade e confiança', estimatedReach: 'Amplo',
    estimatedConversion: '5-10%', priority: 'low',
    description: 'Posts com depoimentos, resultados e bastidores para posicionar marca.',
  });

  return campaigns;
}

function generateChannelRecs(lead: Lead): ChannelRecommendation[] {
  const recs: ChannelRecommendation[] = [];
  const hasPhone = !!lead.phone;

  recs.push({ channel: 'Email', score: 80, reason: 'Canal direto e rastreável. Ideal para sequências de nutrição.', icon: 'Mail' });

  if (hasPhone) {
    recs.push({ channel: 'WhatsApp', score: 90, reason: 'Maior taxa de abertura (98%). Contato direto e conversacional.', icon: 'MessageCircle' });
  }

  if (lead.origin === 'Meta Ads') {
    recs.push({ channel: 'Meta Ads', score: 75, reason: 'Lead já veio por este canal — alto potencial de remarketing.', icon: 'Megaphone' });
  }
  if (lead.origin === 'Google Ads') {
    recs.push({ channel: 'Google Ads', score: 72, reason: 'Lead captado via busca — intenção de compra ativa.', icon: 'Search' });
  }
  if (lead.origin === 'LinkedIn') {
    recs.push({ channel: 'LinkedIn', score: 78, reason: 'Perfil B2B forte. Ideal para conteúdo profissional.', icon: 'Briefcase' });
  }

  recs.push({ channel: 'SMS', score: 45, reason: 'Complementar para lembretes e urgência. Usar com parcimônia.', icon: 'Smartphone' });

  return recs.sort((a, b) => b.score - a.score);
}

export function generateMarketingInsights(lead: Lead, activationId: string): MarketingReport {
  const channelRecs = generateChannelRecs(lead);
  const contentAffinities = [];
  if (lead.status === 'new' || lead.status === 'cold') contentAffinities.push('Cases de Sucesso', 'Conteúdo Educativo');
  if (lead.status === 'qualified') contentAffinities.push('Comparativos', 'Demos', 'ROI');
  if (lead.status === 'converted') contentAffinities.push('Novidades', 'Webinars', 'Comunidade');
  contentAffinities.push('Infográficos', 'Vídeos curtos');

  const report: MarketingReport = {
    id: `mkt_${Date.now()}`,
    leadId: lead.id,
    activationId,
    segments: generateSegments(lead),
    suggestedCampaigns: generateCampaigns(lead),
    channelRecommendations: channelRecs,
    audienceProfile: {
      engagementLevel: lead.score >= 70 ? 'Alto' : lead.score >= 40 ? 'Médio' : 'Baixo',
      preferredChannel: channelRecs[0]?.channel || 'Email',
      bestContactTime: lead.score >= 60 ? 'Manhã (9h-11h)' : 'Tarde (14h-16h)',
      contentAffinity: contentAffinities,
    },
    generatedAt: new Date().toISOString(),
  };

  saveMarketingReport(report);
  return report;
}
