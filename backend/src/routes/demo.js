const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// POST /api/demo/reset — limpa todos os dados da demo
router.post('/reset', async (req, res) => {
  try {
    req.app.locals.resetDemo();
    res.json({ message: 'Demo resetada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/demo/start — inicia o pipeline de demo
router.post('/start', (req, res) => {
  // __dirname = backend/src/routes
  // pipeline  = workspace/agents/demo/pipeline-demo.js
  const pipelinePath = path.resolve(__dirname, '../../../agents/demo/pipeline-demo.js');
  const nodeBin = process.execPath; // caminho absoluto do node em uso

  console.log('[Demo] Iniciando pipeline:', pipelinePath);
  console.log('[Demo] Node bin:', nodeBin);

  const child = spawn(nodeBin, [pipelinePath], {
    detached: true,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: path.resolve(__dirname, '../../../agents'),
  });

  child.stdout.on('data', (data) => {
    console.log('[Pipeline]', data.toString().trim());
  });

  child.stderr.on('data', (data) => {
    console.error('[Pipeline ERR]', data.toString().trim());
  });

  child.on('error', (err) => {
    console.error('[Pipeline] Falha ao iniciar:', err.message);
  });

  child.on('exit', (code) => {
    console.log(`[Pipeline] Encerrou com código ${code}`);
  });

  child.unref();

  res.json({ message: 'Pipeline iniciado.', pid: child.pid });
});

module.exports = router;
