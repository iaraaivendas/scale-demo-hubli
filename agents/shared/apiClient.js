require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const http = require('http');

const BASE_URL = process.env.PLATFORM_API_URL || 'http://localhost:3000';

// Desabilita keep-alive para evitar ECONNRESET em conexões reutilizadas
const httpAgent = new http.Agent({ keepAlive: false });

const api = axios.create({ baseURL: BASE_URL, timeout: 10000, httpAgent });

async function logAtividade({ agente, acao, leadId, leadNome, detalhe }) {
  try {
    await api.post('/api/activity', { agente, acao, leadId, leadNome, detalhe });
  } catch (err) {
    console.error(`[${agente}] Falha ao postar log:`, err.message);
  }
}

async function atualizarStatusLead(id, status) {
  try {
    const res = await api.patch(`/api/leads/${id}/status`, { status });
    return res.data;
  } catch (err) {
    console.error(`Falha ao atualizar lead ${id}:`, err.message);
  }
}

async function buscarLeads(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await api.get(`/api/leads${params ? '?' + params : ''}`);
  return res.data.leads;
}

async function criarSequencia(dados) {
  const res = await api.post('/api/sequences', dados);
  return res.data;
}

async function getDemoNumero() {
  try {
    const res = await api.get('/api/whatsapp/demo-number');
    return res.data.demoNumero || null;
  } catch {
    return null;
  }
}

module.exports = { logAtividade, atualizarStatusLead, buscarLeads, criarSequencia, getDemoNumero };
