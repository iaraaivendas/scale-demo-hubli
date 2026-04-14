require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const leadsRouter = require('./routes/leads');
const sequencesRouter = require('./routes/sequences');
const activityRouter = require('./routes/activity');
const emailRouter = require('./routes/email');
const demoRouter = require('./routes/demo');

// Funções de reset carregadas na inicialização — mesma instância dos módulos
const { clearLogs } = require('./routes/activity');
const { clearSequences } = require('./routes/sequences');
const { reloadLeads } = require('./routes/leads');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket — clientes conectados recebem logs em tempo real
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Cliente conectado. Total: ${clients.size}`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Cliente desconectado. Total: ${clients.size}`);
  });
});

// Broadcast disponível para todas as rotas
app.locals.broadcast = (message) => {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) client.send(payload);
  }
};

// Reset centralizado — usa as funções importadas na inicialização (mesma instância)
app.locals.resetDemo = async () => {
  clearLogs();
  clearSequences();
  const leads = await reloadLeads();
  app.locals.broadcast({ tipo: 'demo_reset', payload: { leads } });
  console.log('[Demo] Reset completo.');
};

// Rotas API
app.use('/api/leads', leadsRouter);
app.use('/api/sequences', sequencesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/email', emailRouter);
app.use('/api/demo', demoRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend buildado (production)
const frontendPath = path.join(__dirname, '../public');
if (require('fs').existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
  console.log('[Server] Servindo frontend de:', frontendPath);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  I.Ara Scale Backend rodando`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  WebSocket: ws://localhost:${PORT}`);
  console.log(`========================================\n`);
});
