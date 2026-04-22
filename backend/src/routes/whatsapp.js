const express = require('express');
const router = express.Router();
const axios = require('axios');

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'iara-demo';
const MOCK_MODE = !EVOLUTION_URL || !EVOLUTION_KEY;

// Número demo configurado em memória (persiste enquanto o backend estiver rodando)
let demoNumero = null;

// GET /api/whatsapp/status — estado da conexão
router.get('/status', async (req, res) => {
  if (MOCK_MODE) {
    return res.json({ connected: false, mock: true, demoNumero });
  }

  try {
    const resp = await axios.get(
      `${EVOLUTION_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`,
      { headers: { apikey: EVOLUTION_KEY }, timeout: 5000 }
    );
    const state = resp.data?.instance?.state;
    res.json({ connected: state === 'open', state, demoNumero, mock: false });
  } catch (err) {
    res.json({ connected: false, error: err.message, demoNumero, mock: false });
  }
});

// GET /api/whatsapp/demo-number — retorna o número demo configurado
router.get('/demo-number', (req, res) => {
  res.json({ demoNumero });
});

// POST /api/whatsapp/demo-number — define o número para envio na demo
router.post('/demo-number', (req, res) => {
  const { numero } = req.body;
  if (!numero) return res.status(400).json({ error: 'Número obrigatório.' });

  // Normaliza: mantém apenas dígitos e garante código do Brasil
  let normalizado = numero.replace(/\D/g, '');
  if (!normalizado.startsWith('55')) normalizado = '55' + normalizado;

  demoNumero = normalizado;
  console.log(`[WhatsApp] Número demo configurado: ${demoNumero}`);
  res.json({ ok: true, demoNumero });
});

// POST /api/whatsapp/send — envio manual de mensagem
router.post('/send', async (req, res) => {
  const { numero, mensagem } = req.body;
  if (!numero || !mensagem) return res.status(400).json({ error: 'Número e mensagem obrigatórios.' });

  if (MOCK_MODE) {
    console.log(`[WhatsApp MOCK] Para: ${numero}\n${mensagem}`);
    return res.json({ ok: true, mock: true });
  }

  try {
    const resp = await axios.post(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      { number: numero, text: mensagem },
      { headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' }, timeout: 12000 }
    );
    res.json({ ok: true, data: resp.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.getDemoNumero = () => demoNumero;
