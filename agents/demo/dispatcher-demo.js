require('dotenv').config({ path: require('path').resolve(__dirname, '../../agents/.env') });
const { atualizarStatusLead, logAtividade } = require('../shared/apiClient');

const AGENTE = 'Dispatcher';

async function dispararStep(seq, stepNumero) {
  const step = seq.steps.find(s => s.numero === stepNumero);
  if (!step || step.status === 'Enviado') return;

  await logAtividade({
    agente: AGENTE,
    acao: 'disparando_step',
    leadId: seq.leadId,
    leadNome: seq.leadNome,
    detalhe: `Disparando Step ${stepNumero} (${step.tipo}) para ${seq.leadNome}. Assunto: "${step.assunto}"`
  });

  step.status = 'Enviado';
  step.enviadoEm = new Date().toISOString();

  await logAtividade({
    agente: AGENTE,
    acao: 'step_enviado',
    leadId: seq.leadId,
    leadNome: seq.leadNome,
    detalhe: `Step ${stepNumero} enviado (simulado) às ${step.enviadoEm}. Monitor iniciando acompanhamento.`
  });
}

async function executar(sequencias) {
  console.log(`[${AGENTE}] Disparando ${sequencias.length} sequências...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Agente Dispatcher ativado. Iniciando disparo dos e-mails Step 1 para ${sequencias.length} leads.`
  });

  for (const seq of sequencias) {
    await dispararStep(seq, 1);
    await atualizarStatusLead(seq.leadId, 'Em Sequencia');

    const step2 = seq.steps.find(s => s.numero === 2);
    const step3 = seq.steps.find(s => s.numero === 3);

    if (step2?.intervalo > 0) {
      setTimeout(() => dispararStep(seq, 2), step2.intervalo);
      await logAtividade({
        agente: AGENTE,
        acao: 'step_agendado',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `Step 2 (${step2.tipo}) agendado para daqui ${step2.intervalo / 1000}s.`
      });
    }

    if (step3?.intervalo > 0) {
      setTimeout(() => dispararStep(seq, 3), step3.intervalo);
      await logAtividade({
        agente: AGENTE,
        acao: 'step_agendado',
        leadId: seq.leadId,
        leadNome: seq.leadNome,
        detalhe: `Step 3 (${step3.tipo}) agendado para daqui ${step3.intervalo / 1000}s.`
      });
    }
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `${sequencias.length} e-mails Step 1 enviados. Steps 2 e 3 agendados automaticamente.`
  });

  return sequencias;
}

module.exports = { executar };
