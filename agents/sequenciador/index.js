require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { criarSequencia, logAtividade } = require('../shared/apiClient');

const AGENTE = 'Sequenciador';

// Intervalos reais de produção (em dias)
const INTERVALOS_PRODUCAO = { step1: 0, step2: 3, step3: 7 };

async function executar(emailsRedigidos) {
  console.log(`[${AGENTE}] Organizando ${emailsRedigidos.length} sequências de e-mail...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Recebidos ${emailsRedigidos.length} conjuntos de e-mails do Copywriter.`
  });

  const sequencias = [];

  for (const { lead, emails } of emailsRedigidos) {
    await logAtividade({
      agente: AGENTE,
      acao: 'criando_sequencia',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Criando sequência: Step 1 (hoje), Step 2 (D+${INTERVALOS_PRODUCAO.step2}), Step 3 (D+${INTERVALOS_PRODUCAO.step3}).`
    });

    const agora = new Date();

    const seq = await criarSequencia({
      leadId: lead.id,
      leadNome: lead.nome,
      empresa: lead.empresa,
      steps: [
        {
          numero: 1,
          tipo: 'E-mail inicial',
          intervalo: INTERVALOS_PRODUCAO.step1,
          status: 'Agendado',
          dataDisparo: agora.toISOString(),
          assunto: emails.step1.assunto,
          corpo: emails.step1.corpo,
          cta: emails.step1.cta
        },
        {
          numero: 2,
          tipo: 'Follow-up D+3',
          intervalo: INTERVALOS_PRODUCAO.step2,
          status: 'Pendente',
          dataDisparo: new Date(agora.getTime() + INTERVALOS_PRODUCAO.step2 * 86400000).toISOString(),
          assunto: emails.step2.assunto,
          corpo: emails.step2.corpo,
          cta: emails.step2.cta
        },
        {
          numero: 3,
          tipo: 'Follow-up D+7',
          intervalo: INTERVALOS_PRODUCAO.step3,
          status: 'Pendente',
          dataDisparo: new Date(agora.getTime() + INTERVALOS_PRODUCAO.step3 * 86400000).toISOString(),
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
      detalhe: `Sequência criada (ID: ${seq.id}) — encaminhando Step 1 para o Dispatcher.`
    });
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `${sequencias.length} sequências organizadas e prontas para disparo.`
  });

  return sequencias;
}

module.exports = { executar };

if (require.main === module) {
  console.error('Sequenciador deve ser chamado pelo Copywriter com os e-mails redigidos.');
  process.exit(1);
}
