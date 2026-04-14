const express = require('express');
const router = express.Router();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// __dirname = backend/src/routes → 3 níveis acima = raiz do workspace
const CSV_PATH = path.join(__dirname, '../../..', 'mock-data', 'leads_mock_demo.csv');

console.log('[Leads] CSV path:', CSV_PATH);

let leadsCache = [];

function loadLeads() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => {
        leadsCache = results;
        console.log(`[Leads] ${results.length} leads carregados do CSV.`);
        resolve(results);
      })
      .on('error', reject);
  });
}

// Garante que o cache está populado
async function ensureLoaded() {
  if (leadsCache.length === 0) await loadLeads();
}

// GET /api/leads
router.get('/', async (req, res) => {
  try {
    await ensureLoaded();
    const { status, segmento } = req.query;
    let leads = [...leadsCache];
    if (status) leads = leads.filter(l => l.status === status);
    if (segmento) leads = leads.filter(l => l.segmento === segmento);
    res.json({ total: leads.length, leads });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar leads', detail: err.message });
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  await ensureLoaded();
  const lead = leadsCache.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
  res.json(lead);
});

// PATCH /api/leads/:id/status — usado pelos agentes para atualizar status
router.patch('/:id/status', async (req, res) => {
  await ensureLoaded();
  const lead = leadsCache.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

  lead.status = req.body.status;
  lead.ultimo_contato = new Date().toLocaleDateString('pt-BR');

  // Broadcast atualização para o frontend
  req.app.locals.broadcast({ tipo: 'lead_atualizado', payload: lead });

  res.json(lead);
});

// POST /api/leads/reload — recarrega CSV (útil para reiniciar a demo)
router.post('/reload', async (req, res) => {
  try {
    leadsCache = [];
    await loadLeads();
    res.json({ message: `${leadsCache.length} leads recarregados com sucesso.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function reloadLeads() {
  leadsCache = [];
  return loadLeads();
}

module.exports = router;
module.exports.reloadLeads = reloadLeads;
