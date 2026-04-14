const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Cria o transporter uma única vez — usa mock se as credenciais não estiverem configuradas
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const MOCK_MODE = !GMAIL_USER || !GMAIL_PASS;

let transporter = null;

if (!MOCK_MODE) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
  console.log('[Email] Transporter Gmail configurado para:', GMAIL_USER);
} else {
  console.warn('[Email] GMAIL_USER ou GMAIL_APP_PASSWORD ausentes — modo simulação ativado.');
}

// POST /api/email/send
router.post('/send', async (req, res) => {
  const { to, assunto, corpo, leadNome, leadId } = req.body;

  if (!to || !assunto || !corpo) {
    return res.status(400).json({ error: 'Campos obrigatórios: to, assunto, corpo' });
  }

  // Modo simulação — demo sem credenciais reais
  if (MOCK_MODE) {
    console.log(`[Email MOCK] Para: ${to} | Assunto: ${assunto}`);

    req.app.locals.broadcast({
      tipo: 'log_agente',
      payload: {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        agente: 'Dispatcher',
        acao: 'email_simulado',
        leadId,
        leadNome,
        detalhe: `[DEMO] E-mail simulado para ${to} · Assunto: "${assunto}"`,
      },
    });

    return res.json({ success: true, mock: true, messageId: `mock-${Date.now()}` });
  }

  try {
    const info = await transporter.sendMail({
      from: `"I.Ara Scale" <${GMAIL_USER}>`,
      to,
      subject: assunto,
      text: corpo,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #16a34a; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 600;">I.Ara Scale</h2>
          </div>
          <div style="padding: 28px 24px; background: #fff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <pre style="white-space: pre-wrap; font-family: Inter, Arial, sans-serif; font-size: 14px; line-height: 1.7; margin: 0;">${corpo}</pre>
          </div>
          <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
            Enviado via I.Ara Scale · Pipeline de IA Comercial
          </p>
        </div>
      `,
    });

    req.app.locals.broadcast({
      tipo: 'log_agente',
      payload: {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        agente: 'Dispatcher',
        acao: 'email_enviado',
        leadId,
        leadNome,
        detalhe: `E-mail enviado para ${to} · Assunto: "${assunto}"`,
      },
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err.message);

    // Mensagem amigável dependendo do tipo de erro
    let mensagem = 'Falha ao enviar e-mail.';
    if (err.message.includes('Invalid login') || err.message.includes('Username and Password')) {
      mensagem = 'Credenciais Gmail inválidas. Verifique GMAIL_USER e GMAIL_APP_PASSWORD no .env do backend.';
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ETIMEDOUT')) {
      mensagem = 'Sem conexão com o servidor SMTP. Verifique a conectividade de rede.';
    } else if (err.message.includes('self signed') || err.message.includes('certificate')) {
      mensagem = 'Erro de certificado SSL. Tente mudar para porta 587 no transporter.';
    }

    res.status(500).json({ error: mensagem, detail: err.message });
  }
});

// POST /api/email/test — verifica credenciais
router.post('/test', async (req, res) => {
  if (MOCK_MODE) {
    return res.json({ success: true, mock: true, message: 'Modo simulação ativo (sem credenciais Gmail)' });
  }
  try {
    await transporter.verify();
    res.json({ success: true, message: 'Conexão Gmail OK' });
  } catch (err) {
    res.status(500).json({ error: 'Falha na autenticação Gmail', detail: err.message });
  }
});

module.exports = router;
