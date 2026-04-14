require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { buscarLeads, atualizarStatusLead, logAtividade } = require('../shared/apiClient');
const { pontuarLead } = require('../shared/openaiClient');

const AGENTE = 'Prospector';

async function executar() {
  console.log(`[${AGENTE}] Iniciando qualificação de leads...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: 'Agente Prospector iniciou leitura do arquivo de leads.'
  });

  const leads = await buscarLeads({ status: 'Novo' });

  await logAtividade({
    agente: AGENTE,
    acao: 'leitura_csv',
    detalhe: `${leads.length} leads com status "Novo" identificados para qualificação.`
  });

  const qualificados = [];

  for (const lead of leads) {
    const { score_final, justificativa } = await pontuarLead(lead);

    await logAtividade({
      agente: AGENTE,
      acao: 'pontuacao',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Score final: ${score_final}/10 — ${justificativa}`
    });

    // Leads com score >= 7 entram em sequência; abaixo disso ficam como Frio
    if (score_final >= 7) {
      await atualizarStatusLead(lead.id, 'Em Sequencia');
      qualificados.push({ ...lead, score_final });

      await logAtividade({
        agente: AGENTE,
        acao: 'qualificado',
        leadId: lead.id,
        leadNome: lead.nome,
        detalhe: `Lead qualificado — encaminhado para o Agente Copywriter.`
      });
    } else {
      await atualizarStatusLead(lead.id, 'Frio');

      await logAtividade({
        agente: AGENTE,
        acao: 'descartado',
        leadId: lead.id,
        leadNome: lead.nome,
        detalhe: `Score insuficiente (${score_final}) — lead marcado como Frio.`
      });
    }

    // Aguarda 2 dias reais antes de reavaliar (em produção usa cron)
    // Em demo, este intervalo é substituído pelo agente demo/pipeline-demo.js
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `Qualificação concluída. ${qualificados.length} leads prontos para Copywriter.`
  });

  return qualificados;
}

module.exports = { executar };

// Execução direta via CLI
if (require.main === module) executar().catch(console.error);
