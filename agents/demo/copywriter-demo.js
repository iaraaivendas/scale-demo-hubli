require('dotenv').config({ path: require('path').resolve(__dirname, '../../agents/.env') });
const { logAtividade } = require('../shared/apiClient');
const { gerarEmail } = require('../shared/openaiClient');

const AGENTE = 'Copywriter';

async function executar(leads) {
  console.log(`[${AGENTE}] Redigindo e-mails para ${leads.length} leads...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Agente Copywriter ativado. Recebidos ${leads.length} leads qualificados para personalização.`
  });

  const emailsRedigidos = [];

  for (const lead of leads) {
    await logAtividade({
      agente: AGENTE,
      acao: 'redigindo',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Gerando e-mail personalizado para ${lead.nome} (${lead.cargo} na ${lead.empresa}). Consultando IA...`
    });

    const emailInicial = await gerarEmail({
      nome: lead.nome,
      empresa: lead.empresa,
      cargo: lead.cargo,
      segmento: lead.segmento,
      tamanho_empresa: lead.tamanho_empresa,
      cidade: lead.cidade
    });

    await logAtividade({
      agente: AGENTE,
      acao: 'step1_redigido',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Step 1 pronto. Assunto: "${emailInicial.assunto}"`
    });

    const followUp3 = await gerarEmail({
      nome: lead.nome,
      empresa: lead.empresa,
      cargo: lead.cargo,
      segmento: lead.segmento,
      tamanho_empresa: lead.tamanho_empresa,
      cidade: lead.cidade,
      contexto: 'Follow-up breve e direto, 3 dias após o e-mail inicial. Reforça o valor sem pressão.'
    });

    await logAtividade({
      agente: AGENTE,
      acao: 'step2_redigido',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Step 2 pronto. Assunto: "${followUp3.assunto}"`
    });

    const followUp7 = await gerarEmail({
      nome: lead.nome,
      empresa: lead.empresa,
      cargo: lead.cargo,
      segmento: lead.segmento,
      tamanho_empresa: lead.tamanho_empresa,
      cidade: lead.cidade,
      contexto: 'Último follow-up (D+7). Tom consultivo, oferece insight do setor. CTA suave.'
    });

    await logAtividade({
      agente: AGENTE,
      acao: 'step3_redigido',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Step 3 pronto. 3 e-mails redigidos para ${lead.nome} — encaminhando ao Sequenciador.`
    });

    emailsRedigidos.push({
      lead,
      emails: { step1: emailInicial, step2: followUp3, step3: followUp7 }
    });
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `Copywriting concluído. ${emailsRedigidos.length * 3} e-mails redigidos para ${emailsRedigidos.length} leads.`
  });

  return emailsRedigidos;
}

module.exports = { executar };
