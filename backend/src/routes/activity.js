const express = require('express');
const router = express.Router();

const activityLog = [];

// GET /api/activity — histórico de logs dos agentes
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({ total: activityLog.length, logs: activityLog.slice(-limit).reverse() });
});

// POST /api/activity — agentes postam seus logs aqui
router.post('/', (req, res) => {
  const { agente, acao, leadId, leadNome, detalhe } = req.body;

  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    agente,
    acao,
    leadId: leadId || null,
    leadNome: leadNome || null,
    detalhe
  };

  activityLog.push(entry);
  console.log(`[${agente}] ${detalhe}`);

  // Broadcast em tempo real para o frontend via WebSocket
  req.app.locals.broadcast({ tipo: 'log_agente', payload: entry });

  res.status(201).json(entry);
});

// DELETE /api/activity — limpa log (reiniciar demo)
router.delete('/', (req, res) => {
  activityLog.length = 0;
  res.json({ message: 'Log de atividade limpo.' });
});

function clearLogs() {
  activityLog.length = 0;
}

module.exports = router;
module.exports.clearLogs = clearLogs;
