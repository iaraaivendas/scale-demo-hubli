// I.ARA Scale - Copy Insights Engine
// Generates optimized copy suggestions when Copy AI is activated for a lead

import type { Lead } from './storage';

// ============= Types =============

export interface CopyVariant {
  id: string;
  channel: string;
  channelIcon: string;
  headline: string;
  body: string;
  cta: string;
  tone: string;
  estimatedCTR: string;
}

export interface CopyInsight {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'optimization';
}

export interface CopyReport {
  id: string;
  leadId: string;
  activationId: string;
  variants: CopyVariant[];
  insights: CopyInsight[];
  toneAnalysis: {
    recommended: string;
    reason: string;
    alternatives: string[];
  };
  keyMessages: string[];
  generatedAt: string;
}

// ============= Storage =============

const STORAGE_KEY = 'iara_copy_reports';

function getReports(): CopyReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveReports(reports: CopyReport[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getCopyReport(leadId: string): CopyReport | null {
  const reports = getReports();
  const leadReports = reports.filter(r => r.leadId === leadId);
  return leadReports.length > 0 ? leadReports[leadReports.length - 1] : null;
}

export function saveCopyReport(report: CopyReport): void {
  const reports = getReports();
  reports.push(report);
  saveReports(reports);
}

// ============= Generation =============

function getTone(lead: Lead): { recommended: string; reason: string; alternatives: string[] } {
  if (lead.status === 'cold') {
    return { recommended: 'Empático e curioso', reason: 'Lead frio precisa ser reengajado com empatia, sem pressão.', alternatives: ['Informativo', 'Casual'] };
  }
  if (lead.status === 'qualified') {
    return { recommended: 'Confiante e direto', reason: 'Lead qualificado responde bem a abordagem assertiva com prova social.', alternatives: ['Persuasivo', 'Consultivo'] };
  }
  if (lead.status === 'converted') {
    return { recommended: 'Próximo e exclusivo', reason: 'Cliente convertido valoriza exclusividade e relacionamento.', alternatives: ['Celebrativo', 'Informativo'] };
  }
  return { recommended: 'Profissional e acolhedor', reason: 'Abordagem equilibrada para leads em estágio inicial.', alternatives: ['Educativo', 'Inspirador'] };
}

function generateVariants(lead: Lead): CopyVariant[] {
  const variants: CopyVariant[] = [];
  const name = lead.name.split(' ')[0];
  const company = lead.company || 'sua empresa';

  // WhatsApp variant
  if (lead.phone) {
    if (lead.status === 'cold') {
      variants.push({
        id: 'copy_whatsapp', channel: 'WhatsApp', channelIcon: 'MessageCircle',
        headline: `Oi ${name}, tudo bem?`,
        body: `Faz um tempo que não conversamos e eu queria compartilhar algo que pode ser valioso para ${company}. Temos novidades que estão gerando resultados incríveis para empresas como a sua.`,
        cta: 'Posso te contar em 2 minutos?', tone: 'Empático',
        estimatedCTR: '25-35%',
      });
    } else {
      variants.push({
        id: 'copy_whatsapp', channel: 'WhatsApp', channelIcon: 'MessageCircle',
        headline: `${name}, tenho algo especial!`,
        body: `Vi que ${company} tem potencial para alcançar resultados ainda melhores. Preparei uma sugestão personalizada baseada no seu perfil.`,
        cta: 'Quer que eu envie os detalhes?', tone: 'Direto',
        estimatedCTR: '30-45%',
      });
    }
  }

  // Email variant
  variants.push({
    id: 'copy_email', channel: 'Email', channelIcon: 'Mail',
    headline: lead.score >= 60
      ? `${name}, sua próxima grande conquista começa aqui`
      : `${name}, descubra como empresas como ${company} estão crescendo`,
    body: lead.score >= 60
      ? `Olá ${name},\n\nAnalisando o perfil de ${company}, identifiquei oportunidades concretas de crescimento. Empresas similares à sua estão alcançando resultados 3x superiores com as estratégias certas.\n\nPreparei uma análise personalizada que mostra exatamente onde estão essas oportunidades.`
      : `Olá ${name},\n\nSei que o mercado está desafiador, mas ${company} tem um potencial que merece atenção. Desenvolvemos um método que já ajudou +200 empresas a transformar desafios em resultados.\n\nGostaria de compartilhar como isso se aplica ao seu caso.`,
    cta: lead.score >= 60 ? 'Ver minha análise personalizada →' : 'Quero conhecer o método →',
    tone: lead.score >= 60 ? 'Consultivo' : 'Educativo',
    estimatedCTR: lead.score >= 60 ? '18-28%' : '12-20%',
  });

  // Ads variant
  variants.push({
    id: 'copy_ads', channel: 'Anúncio (Meta/Google)', channelIcon: 'Megaphone',
    headline: lead.status === 'converted'
      ? `Clientes como ${company} estão expandindo resultados`
      : `${company}, seu crescimento não pode esperar`,
    body: lead.status === 'converted'
      ? `Descubra as novas ferramentas que estão multiplicando resultados para negócios como o seu. Exclusivo para clientes.`
      : `Empresas do seu segmento estão crescendo 2.5x mais rápido. Veja como aplicar a mesma estratégia em ${company}.`,
    cta: lead.status === 'converted' ? 'Explorar novidades' : 'Começar agora',
    tone: 'Persuasivo',
    estimatedCTR: '3-8%',
  });

  // LinkedIn variant
  if (lead.origin === 'LinkedIn' || lead.score >= 50) {
    variants.push({
      id: 'copy_linkedin', channel: 'LinkedIn', channelIcon: 'Briefcase',
      headline: `O futuro de ${company} em 3 passos`,
      body: `${name}, profissionais como você estão redefinindo padrões no mercado. Compartilho 3 insights que podem acelerar o crescimento de ${company} ainda neste trimestre.`,
      cta: 'Vamos conversar sobre isso?',
      tone: 'Profissional',
      estimatedCTR: '8-15%',
    });
  }

  return variants;
}

function generateCopyInsights(lead: Lead): CopyInsight[] {
  const insights: CopyInsight[] = [];

  insights.push({
    id: 'ci_personalization', title: 'Personalização é chave',
    description: `Usar o nome "${lead.name.split(' ')[0]}" e "${lead.company || 'empresa'}" aumenta a taxa de abertura em até 26%.`,
    type: 'tip',
  });

  if (lead.status === 'cold') {
    insights.push({
      id: 'ci_cold', title: 'Evite tom comercial agressivo',
      description: 'Lead frio rejeita abordagens de venda direta. Foque em valor e curiosidade.',
      type: 'warning',
    });
  }

  if (lead.score >= 70) {
    insights.push({
      id: 'ci_urgency', title: 'Adicione senso de urgência',
      description: 'Score alto indica momento ideal. Use gatilhos de escassez ou exclusividade.',
      type: 'optimization',
    });
  }

  insights.push({
    id: 'ci_cta', title: 'CTA com baixo atrito',
    description: 'CTAs que pedem pouco comprometimento ("Posso te enviar?") convertem 40% mais que "Compre agora".',
    type: 'tip',
  });

  if (lead.phone) {
    insights.push({
      id: 'ci_multichannel', title: 'Abordagem multicanal recomendada',
      description: 'Combinar email + WhatsApp dentro de 48h aumenta resposta em 60%.',
      type: 'optimization',
    });
  }

  return insights;
}

export function generateCopyInsightsReport(lead: Lead, activationId: string): CopyReport {
  const tone = getTone(lead);
  const keyMessages: string[] = [];

  if (lead.status === 'qualified' || lead.status === 'converted') {
    keyMessages.push('Resultados comprovados com empresas similares');
    keyMessages.push('Análise personalizada do potencial de crescimento');
  }
  if (lead.score >= 60) keyMessages.push('Oportunidade exclusiva de expansão');
  keyMessages.push('Suporte dedicado e acompanhamento contínuo');
  keyMessages.push('ROI mensurável desde o primeiro mês');

  const report: CopyReport = {
    id: `copy_${Date.now()}`,
    leadId: lead.id,
    activationId,
    variants: generateVariants(lead),
    insights: generateCopyInsights(lead),
    toneAnalysis: tone,
    keyMessages,
    generatedAt: new Date().toISOString(),
  };

  saveCopyReport(report);
  return report;
}
