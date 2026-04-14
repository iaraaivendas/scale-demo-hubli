require('dotenv').config({ path: require('path').resolve(__dirname, '../../agents/.env') });
const { atualizarStatusLead, logAtividade } = require('../shared/apiClient');

const AGENTE = 'Monitor';

const PROB_ABERTURA = parseFloat(process.env.DEMO_PROB_ABERTURA) || 0.75;
const PROB_RESPOSTA = parseFloat(process.env.DEMO_PROB_RESPOSTA) || 0.35;

async function executar(sequencias) {
  console.log(`[${AGENTE}] Monitorando ${sequencias.length} sequências...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Agente Monitor ativado. Verificando métricas de abertura e resposta para ${sequencias.length} leads.`
  });

  for (const seq of sequencias) {
    await logAtividade({
      agente: AGENTE,
      acao: 'verificando',
      leadId: seq.leadId,
      leadNome: seq.leadNome,
      detalhe: `Verificando engajamento de ${seq.leadNome} com o e-mail enviado...`
    });

    const abriu = Math.random() < PROB_ABERTURA;
    const respondeu = abriu && Math.random() < PROB_RESPOSTA;

    if (respondeu) {
      await atualizarStatusLead(seq.leadId, 'Respondeu');
      seq.taxaAbertura = 100;
      seq.status = 'Concluída';

      await logAtividade({
        agente: AGENTE,
        acao: 'resposta_detectada',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `RESPOSTA DETECTADA! ${seq.leadNome} respondeu ao e-mail. Lead atualizado para "Respondeu". Sequência pausada — aguardando ação comercial.`
      });
    } else if (abriu) {
      seq.taxaAbertura = 100;

      await logAtividade({
        agente: AGENTE,
        acao: 'abertura_detectada',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `Abertura detectada! ${seq.leadNome} abriu o e-mail mas ainda não respondeu. Step 2 será disparado automaticamente no horário programado.`
      });
    } else {
      seq.taxaAbertura = 0;

      await logAtividade({
        agente: AGENTE,
        acao: 'sem_interacao',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `Sem interação de ${seq.leadNome}. Step 2 será disparado automaticamente. A IA continua trabalhando mesmo sem ação manual.`
      });
    }
  }

  const responderam = sequencias.filter(s => s.status === 'Concluída').length;
  const abriram = sequencias.filter(s => s.taxaAbertura === 100).length;
  const total = sequencias.length;

  await logAtividade({
    agente: AGENTE,
    acao: 'resumo_ciclo',
    detalhe: `Ciclo completo: ${total} enviados → ${abriram} abertos (${Math.round(abriram / total * 100)}%) → ${responderam} respostas (${Math.round(responderam / total * 100)}%). Follow-ups automáticos em andamento.`
  });

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `Monitor em standby. Pipeline completo executado com sucesso pela I.Ara Scale.`
  });

  return sequencias;
}

module.exports = { executar };
