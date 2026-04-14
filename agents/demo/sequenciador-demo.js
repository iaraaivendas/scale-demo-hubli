require('dotenv').config({ path: require('path').resolve(__dirname, '../../agents/.env') });
const { criarSequencia, logAtividade } = require('../shared/apiClient');

const AGENTE = 'Sequenciador';

const INTERVALO_STEP2 = parseInt(process.env.DEMO_INTERVALO_STEP2_MS) || 15000;
const INTERVALO_STEP3 = parseInt(process.env.DEMO_INTERVALO_STEP3_MS) || 30000;

async function executar(emailsRedigidos) {
  console.log(`[${AGENTE}] Organizando ${emailsRedigidos.length} sequências...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Agente Sequenciador ativado. Criando calendário de disparos para ${emailsRedigidos.length} leads.`
  });

  const sequencias = [];
  const agora = new Date();

  for (const { lead, emails } of emailsRedigidos) {
    await logAtividade({
      agente: AGENTE,
      acao: 'criando_sequencia',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Montando sequência: Step 1 (imediato) → Step 2 (+${INTERVALO_STEP2 / 1000}s) → Step 3 (+${INTERVALO_STEP3 / 1000}s).`
    });

    const seq = await criarSequencia({
      leadId: lead.id,
      leadNome: lead.nome,
      empresa: lead.empresa,
      steps: [
        {
          numero: 1,
          tipo: 'E-mail inicial',
          intervalo: 0,
          status: 'Agendado',
          dataDisparo: agora.toISOString(),
          assunto: emails.step1.assunto,
          corpo: emails.step1.corpo,
          cta: emails.step1.cta
        },
        {
          numero: 2,
          tipo: 'Follow-up D+3',
          intervalo: INTERVALO_STEP2,
          status: 'Pendente',
          dataDisparo: new Date(agora.getTime() + INTERVALO_STEP2).toISOString(),
          assunto: emails.step2.assunto,
          corpo: emails.step2.corpo,
          cta: emails.step2.cta
        },
        {
          numero: 3,
          tipo: 'Follow-up D+7',
          intervalo: INTERVALO_STEP3,
          status: 'Pendente',
          dataDisparo: new Date(agora.getTime() + INTERVALO_STEP3).toISOString(),
          assunto: emails.step3.assunto,
          corpo: emails.step3.corpo,
          cta: emails.step3.cta
        }
      ]
    });

    sequencias.push(seq);

    await logAtividade({
      agente: AGENTE,
      acao: 'sequencia_criada',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Sequência criada (ID: ${seq.id}). Dispatcher receberá Step 1 agora.`
    });
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `${sequencias.length} sequências organizadas. Calendário de disparos configurado.`
  });

  return sequencias;
}

module.exports = { executar };
