const express = require('express');
const router = express.Router();

let sequences = [];

// GET /api/sequences
router.get('/', (req, res) => {
  res.json({ total: sequences.length, sequences });
});

// GET /api/sequences/:id
router.get('/:id', (req, res) => {
  const seq = sequences.find(s => s.id === req.params.id);
  if (!seq) return res.status(404).json({ error: 'Sequência não encontrada' });
  res.json(seq);
});

// POST /api/sequences — criado pelo Agente Sequenciador
router.post('/', (req, res) => {
  const { leadId, leadNome, empresa, steps } = req.body;

  const sequence = {
    id: `seq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    leadId,
    leadNome,
    empresa,
    status: 'Ativa',
    taxaAbertura: 0,
    criadaEm: new Date().toISOString(),
    steps: steps || []
  };

  sequences.push(sequence);

  // Broadcast nova sequência para o frontend
  req.app.locals.broadcast({ tipo: 'nova_sequencia', payload: sequence });

  res.status(201).json(sequence);
});

// PATCH /api/sequences/:id — atualiza status da sequência
router.patch('/:id', (req, res) => {
  const seq = sequences.find(s => s.id === req.params.id);
  if (!seq) return res.status(404).json({ error: 'Sequência não encontrada' });
  Object.assign(seq, req.body);
  req.app.locals.broadcast({ tipo: 'sequencia_atualizada', payload: seq });
  res.json(seq);
});

// DELETE /api/sequences — limpa sequências (reiniciar demo)
router.delete('/', (req, res) => {
  sequences = [];
  res.json({ message: 'Sequências limpas.' });
});

function clearSequences() {
  sequences = [];
}

module.exports = router;
module.exports.clearSequences = clearSequences;
