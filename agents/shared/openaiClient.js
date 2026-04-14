require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function gerarEmail({ nome, empresa, cargo, segmento, tamanho_empresa, cidade, contexto }) {
  const prompt = `Você é um especialista em vendas B2B brasileiras. Escreva um e-mail de prospecção comercial personalizado em português do Brasil.

Lead:
- Nome: ${nome}
- Empresa: ${empresa}
- Cargo: ${cargo}
- Segmento: ${segmento}
- Porte: ${tamanho_empresa}
- Cidade: ${cidade}
${contexto ? `\nContexto adicional: ${contexto}` : ''}

Retorne APENAS um JSON válido no formato:
{
  "assunto": "linha de assunto do e-mail",
  "corpo": "corpo completo do e-mail em texto simples",
  "cta": "chamada para ação principal"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 600
  });

  return JSON.parse(response.choices[0].message.content);
}

async function pontuarLead(lead) {
  const prompt = `Avalie a prioridade de prospecção deste lead de 1 a 10.

Lead: ${JSON.stringify(lead, null, 2)}

Critérios: cargo de decisão (C-level/Diretor = maior score), porte da empresa (Enterprise > Mid-Market > PME), segmento aquecido para SaaS, score_inicial fornecido, status atual.

Retorne APENAS JSON: { "score_final": <numero inteiro de 1 a 10>, "justificativa": "<frase curta em português>" }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 150
  });

  return JSON.parse(response.choices[0].message.content);
}

module.exports = { gerarEmail, pontuarLead };
