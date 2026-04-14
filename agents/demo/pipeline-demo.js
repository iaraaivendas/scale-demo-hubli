require('dotenv').config({ path: require('path').resolve(__dirname, '../../agents/.env') });

const prospector = require('./prospector-demo');
const copywriter = require('./copywriter-demo');
const sequenciador = require('./sequenciador-demo');
const dispatcher = require('./dispatcher-demo');
const monitor = require('./monitor-demo');
const { logAtividade } = require('../shared/apiClient');

const PAUSA_MS = parseInt(process.env.DEMO_PAUSA_MS) || 3000;

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executarPipelineDemo() {
  console.log('\n========================================');
  console.log('   I.ARA SCALE — PIPELINE DE DEMO');
  console.log('========================================\n');

  await logAtividade({
    agente: 'Sistema',
    acao: 'pipeline_iniciado',
    detalhe: 'Pipeline de demonstração iniciado. Todos os agentes entrando em ação.'
  });

  // ETAPA 1 — Prospector
  console.log('[DEMO] Etapa 1/5 — Agente Prospector...');
  const leadsQualificados = await prospector.executar();
  await esperar(PAUSA_MS);

  if (!leadsQualificados || leadsQualificados.length === 0) {
    await logAtividade({
      agente: 'Sistema',
      acao: 'aviso',
      detalhe: 'Nenhum lead qualificado pelo Prospector. Verifique o arquivo CSV e tente novamente.'
    });
    console.log('[DEMO] Nenhum lead qualificado. Pipeline encerrado.');
    return;
  }

  // ETAPA 2 — Copywriter
  console.log(`[DEMO] Etapa 2/5 — Agente Copywriter (${leadsQualificados.length} leads)...`);
  const emailsRedigidos = await copywriter.executar(leadsQualificados);
  await esperar(PAUSA_MS);

  // ETAPA 3 — Sequenciador
  console.log('[DEMO] Etapa 3/5 — Agente Sequenciador...');
  const sequencias = await sequenciador.executar(emailsRedigidos);
  await esperar(PAUSA_MS);

  // ETAPA 4 — Dispatcher
  console.log('[DEMO] Etapa 4/5 — Agente Dispatcher...');
  await dispatcher.executar(sequencias);
  await esperar(PAUSA_MS);

  // ETAPA 5 — Monitor
  console.log('[DEMO] Etapa 5/5 — Agente Monitor...');
  await monitor.executar(sequencias);

  await logAtividade({
    agente: 'Sistema',
    acao: 'pipeline_concluido',
    detalhe: `Pipeline concluído com sucesso! ${sequencias.length} leads processados do início ao fim.`
  });

  console.log('\n========================================');
  console.log('   PIPELINE DE DEMO CONCLUÍDO!');
  console.log(`   ${sequencias.length} leads processados.`);
  console.log('========================================\n');
}

module.exports = { executarPipelineDemo };

if (require.main === module) executarPipelineDemo().catch(console.error);
