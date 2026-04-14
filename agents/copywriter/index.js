require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { logAtividade } = require('../shared/apiClient');
const { gerarEmail } = require('../shared/openaiClient');

const AGENTE = 'Copywriter';

async function executar(leads) {
  console.log(`[${AGENTE}] Iniciando redação de e-mails para ${leads.length} leads...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Recebidos ${leads.length} leads qualificados do Prospector.`
  });

  const emailsRedigidos = [];

  for (const lead of leads) {
    await logAtividade({
      agente: AGENTE,
      acao: 'redigindo',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Redigindo e-mail personalizado para ${lead.nome} — ${lead.empresa} (${lead.cargo}).`
    });

    // Step 1 — E-mail inicial
    const emailInicial = await gerarEmail({
      nome: lead.nome,
      empresa: lead.empresa,
      cargo: lead.cargo,
      segmento: lead.segmento,
      tamanho_empresa: lead.tamanho_empresa,
      cidade: lead.cidade
    });

    // Step 2 — Follow-up D+3
    const followUp3 = await gerarEmail({
      nome: lead.nome,
      empresa: lead.empresa,
      cargo: lead.cargo,
      segmento: lead.segmento,
      tamanho_empresa: lead.tamanho_empresa,
      cidade: lead.cidade,
      contexto: 'Este é o primeiro follow-up, 3 dias após o e-mail inicial. Seja breve e direto.'
    });

    // Step 3 — Follow-up D+7
    const followUp7 = await gerarEmail({
      nome: lead.nome,
      empresa: lead.empresa,
      cargo: lead.cargo,
      segmento: lead.segmento,
      tamanho_empresa: lead.tamanho_empresa,
      cidade: lead.cidade,
      contexto: 'Este é o segundo follow-up, 7 dias após o e-mail inicial. Última tentativa — tom consultivo.'
    });

    emailsRedigidos.push({
      lead,
      emails: {
        step1: emailInicial,
        step2: followUp3,
        step3: followUp7
      }
    });

    await logAtividade({
      agente: AGENTE,
      acao: 'redigido',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `3 e-mails redigidos (inicial + 2 follow-ups) — encaminhando para o Sequenciador.`
    });
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `Redação concluída. ${emailsRedigidos.length} sequências prontas para o Sequenciador.`
  });

  return emailsRedigidos;
}

module.exports = { executar };

if (require.main === module) {
  console.error('Copywriter deve ser chamado pelo Prospector com a lista de leads qualificados.');
  process.exit(1);
}
