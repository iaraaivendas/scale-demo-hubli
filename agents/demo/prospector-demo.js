require('dotenv').config({ path: require('path').resolve(__dirname, '../../agents/.env') });
const { buscarLeads, atualizarStatusLead, logAtividade } = require('../shared/apiClient');
const { pontuarLead } = require('../shared/openaiClient');

const AGENTE = 'Prospector';
const MAX_LEADS = parseInt(process.env.DEMO_MAX_LEADS) || 4;

async function executar() {
  console.log(`[${AGENTE}] Iniciando...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: 'Agente Prospector ativado. Lendo arquivo de leads mockados para identificar oportunidades.'
  });

  const todosLeads = await buscarLeads({ status: 'Novo' });
  const leads = todosLeads.slice(0, MAX_LEADS);

  await logAtividade({
    agente: AGENTE,
    acao: 'leitura_csv',
    detalhe: `${todosLeads.length} leads com status "Novo" encontrados. Analisando os ${leads.length} mais relevantes.`
  });

  const qualificados = [];

  for (const lead of leads) {
    await logAtividade({
      agente: AGENTE,
      acao: 'analisando',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Analisando perfil: ${lead.nome} | ${lead.cargo} | ${lead.empresa} (${lead.segmento} · ${lead.tamanho_empresa}).`
    });

    const { score_final, justificativa } = await pontuarLead(lead);

    await logAtividade({
      agente: AGENTE,
      acao: 'pontuacao',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Score calculado: ${score_final}/10 — "${justificativa}"`
    });

    if (score_final >= 7) {
      await atualizarStatusLead(lead.id, 'Em Sequencia');
      qualificados.push({ ...lead, score_final });

      await logAtividade({
        agente: AGENTE,
        acao: 'qualificado',
        leadId: lead.id,
        leadNome: lead.nome,
        detalhe: `Lead QUALIFICADO (score ${score_final}/10). Encaminhando para o Agente Copywriter.`
      });
    } else {
      await atualizarStatusLead(lead.id, 'Frio');

      await logAtividade({
        agente: AGENTE,
        acao: 'descartado',
        leadId: lead.id,
        leadNome: lead.nome,
        detalhe: `Lead marcado como FRIO (score ${score_final}/10). Decisão da IA: não priorizar no momento.`
      });
    }
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `Prospecção concluída: ${qualificados.length} de ${leads.length} leads qualificados e encaminhados ao Copywriter.`
  });

  return qualificados;
}

module.exports = { executar };
