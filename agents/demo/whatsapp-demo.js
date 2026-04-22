require('dotenv').config({ path: require('path').resolve(__dirname, '../../agents/.env') });
const { logAtividade, getDemoNumero } = require('../shared/apiClient');
const { gerarMensagemWhatsApp } = require('../shared/openaiClient');
const axios = require('axios');

const AGENTE = 'WhatsApp';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'iara-demo';
const MOCK_MODE = !EVOLUTION_URL || !EVOLUTION_KEY;

async function enviarWhatsApp(numero, mensagem) {
  if (MOCK_MODE) {
    console.log(`[WhatsApp MOCK] Para: ${numero}\n${mensagem}`);
    await new Promise(r => setTimeout(r, 800));
    return { mock: true };
  }

  const response = await axios.post(
    `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    { number: numero, text: mensagem },
    {
      headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
      timeout: 12000
    }
  );
  return response.data;
}

async function executar(leadsQualificados) {
  const demoNumero = await getDemoNumero();

  if (!demoNumero) {
    await logAtividade({
      agente: AGENTE,
      acao: 'pulado',
      detalhe: 'Nenhum número demo configurado. Acesse a aba WhatsApp e insira um número para ativar este agente.'
    });
    return [];
  }

  const modo = MOCK_MODE ? ' (modo simulação)' : '';
  await logAtividade({
    agente: AGENTE,
    acao: 'inicio',
    detalhe: `Agente WhatsApp iniciado${modo}. Enviando mensagens personalizadas para ${Math.min(leadsQualificados.length, 3)} leads.`
  });

  // Demo envia para no máximo 3 leads para não sobrecarregar
  const leadsDemo = leadsQualificados.slice(0, 3);
  const resultados = [];

  for (const lead of leadsDemo) {
    await logAtividade({
      agente: AGENTE,
      acao: 'gerando',
      leadId: lead.id,
      leadNome: lead.nome,
      detalhe: `Gerando mensagem personalizada para ${lead.nome} — ${lead.empresa} (${lead.cargo}).`
    });

    let msg;
    try {
      msg = await gerarMensagemWhatsApp({
        nome: lead.nome,
        empresa: lead.empresa,
        cargo: lead.cargo,
        segmento: lead.segmento,
        tamanho_empresa: lead.tamanho_empresa,
        cidade: lead.cidade
      });
    } catch (err) {
      await logAtividade({
        agente: AGENTE,
        acao: 'erro',
        leadId: lead.id,
        leadNome: lead.nome,
        detalhe: `Falha ao gerar mensagem: ${err.message}`
      });
      continue;
    }

    try {
      await enviarWhatsApp(demoNumero, msg.mensagem);

      await logAtividade({
        agente: AGENTE,
        acao: 'enviado',
        leadId: lead.id,
        leadNome: lead.nome,
        detalhe: `✅ Mensagem enviada${MOCK_MODE ? ' (simulada)' : ''} para ${lead.nome}: "${msg.preview}"`
      });

      resultados.push({ lead, mensagem: msg, enviado: true, mock: MOCK_MODE });
    } catch (err) {
      await logAtividade({
        agente: AGENTE,
        acao: 'erro',
        leadId: lead.id,
        leadNome: lead.nome,
        detalhe: `Falha ao enviar para ${lead.nome}: ${err.message}`
      });
    }

    // Pausa entre envios para não ser bloqueado pelo WhatsApp
    await new Promise(r => setTimeout(r, 2500));
  }

  await logAtividade({
    agente: AGENTE,
    acao: 'conclusao',
    detalhe: `${resultados.length} mensagens WhatsApp enviadas${MOCK_MODE ? ' em modo simulação. Configure EVOLUTION_API_URL para envio real.' : ' com sucesso!'}`
  });

  return resultados;
}

module.exports = { executar };
