require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { atualizarStatusLead, logAtividade } = require('../shared/apiClient');

const AGENTE = 'Monitor';

// Em produção: verifica abertura/resposta real via Gmail API
// Intervalo de verificação: a cada 24h via cron
async function verificarMetricas(sequencia) {
  // Placeholder para integração real com Gmail API
  // Simulação: gera abertura/resposta probabilística
  const abriu = Math.random() > 0.4;      // 60% de chance de abertura
  const respondeu = abriu && Math.random() > 0.7; // 30% dos que abriram respondem

  return { abriu, respondeu };
}

async function executar(sequencias) {
  console.log(`[${AGENTE}] Monitorando ${sequencias.length} sequências ativas...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Monitorando ${sequencias.length} sequências após disparo inicial.`
  });

  for (const seq of sequencias) {
    await logAtividade({
      agente: AGENTE,
      acao: 'verificando',
      leadId: seq.leadId,
      leadNome: seq.leadNome,
      detalhe: `Verificando métricas de abertura/resposta para ${seq.leadNome}.`
    });

    const { abriu, respondeu } = await verificarMetricas(seq);

    if (respondeu) {
      await atualizarStatusLead(seq.leadId, 'Respondeu');
      seq.taxaAbertura = 100;

      await logAtividade({
        agente: AGENTE,
        acao: 'resposta_detectada',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `Resposta detectada! Lead marcado como "Respondeu" — sequência pausada.`
      });
    } else if (abriu) {
      seq.taxaAbertura = 100;

      await logAtividade({
        agente: AGENTE,
        acao: 'abertura_detectada',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `Abertura detectada — aguardando janela D+3 para disparo do follow-up (Step 2).`
      });
    } else {
      seq.taxaAbertura = 0;

      await logAtividade({
        agente: AGENTE,
        acao: 'sem_interacao',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `Nenhuma interação detectada — Step 2 será disparado automaticamente em D+3.`
      });
    }
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `Ciclo de monitoramento concluído. Próxima verificação em 24h.`
  });

  return sequencias;
}

module.exports = { executar };

if (require.main === module) {
  console.error('Monitor deve ser iniciado após o disparo inicial pelo Dispatcher.');
  process.exit(1);
}
