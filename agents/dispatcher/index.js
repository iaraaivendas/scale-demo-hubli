require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { atualizarStatusLead, logAtividade } = require('../shared/apiClient');

const AGENTE = 'Dispatcher';

// Em produção: usa Gmail API via OAuth2
// Na demo: simula envio e registra na inbox
async function enviarEmail({ lead, step, sequenciaId }) {
  // Placeholder para integração real com Gmail API (OAuth2)
  // const gmail = require('../shared/gmailClient');
  // await gmail.send({ to: lead.email, subject: step.assunto, body: step.corpo });

  // Simulação de envio (demo)
  return { enviado: true, timestamp: new Date().toISOString(), simulado: true };
}

async function executar(sequencias) {
  console.log(`[${AGENTE}] Iniciando disparo de ${sequencias.length} sequências...`);

  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Recebidas ${sequencias.length} sequências do Sequenciador para disparo.`
  });

  for (const seq of sequencias) {
    const step1 = seq.steps.find(s => s.numero === 1);
    if (!step1) continue;

    await logAtividade({
      agente: AGENTE,
      acao: 'enviando',
      leadId: seq.leadId,
      leadNome: seq.leadNome,
      detalhe: `Disparando Step 1 para ${seq.leadNome} <${seq.leadId}> — assunto: "${step1.assunto}"`
    });

    const resultado = await enviarEmail({
      lead: { id: seq.leadId, nome: seq.leadNome, email: `${seq.leadId}@demo.com` },
      step: step1,
      sequenciaId: seq.id
    });

    step1.status = 'Enviado';
    step1.enviadoEm = resultado.timestamp;

    await atualizarStatusLead(seq.leadId, 'Em Sequencia');

    await logAtividade({
      agente: AGENTE,
      acao: 'enviado',
      leadId: seq.leadId,
      leadNome: seq.leadNome,
      detalhe: `E-mail Step 1 ${resultado.simulado ? '(simulado)' : ''} enviado com sucesso às ${resultado.timestamp}.`
    });

    // Em produção: agendar Steps 2 e 3 via node-cron com os intervalos reais
    // cron.schedule(`...D+3...`, () => enviarStep(seq, 2));
    // cron.schedule(`...D+7...`, () => enviarStep(seq, 3));
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `${sequencias.length} e-mails Step 1 disparados — Monitor assumirá acompanhamento.`
  });

  return sequencias;
}

module.exports = { executar };

if (require.main === module) {
  console.error('Dispatcher deve ser chamado pelo Sequenciador com as sequências criadas.');
  process.exit(1);
}
