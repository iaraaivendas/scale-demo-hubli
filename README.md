# I.Ara Scale — Workspace de Demonstração

Plataforma de Agentes Comerciais com IA. Este workspace contém toda a estrutura para a demonstração ao cliente.

## Estrutura

```
iara-scale-demo/
├── platform/          Interface visual (inbox de e-mail + painel de agentes)
├── agents/            Agentes comerciais de produção (Prospector, Copywriter, etc.)
│   ├── demo/          Agentes com intervalos comprimidos — exclusivo para a demo
│   └── shared/        Utilitários compartilhados (OpenAI, API client)
├── mock-data/         Dados fictícios para a demonstração
├── docs/              Documentação do projeto
└── .vscode/           Configurações do workspace
```

## Setup Rápido

### 1. Plataforma (interface visual)
```bash
cd platform
cp .env.example .env   # preencha as variáveis
npm install
npm run dev            # inicia na porta 3000
```

### 2. Agentes
```bash
cd agents
cp .env.example .env   # adicione OPENAI_API_KEY e PLATFORM_API_URL
npm install
```

### 3. Rodar a demo ao vivo
```bash
# Com a plataforma rodando, execute:
node agents/demo/pipeline-demo.js
```

## Agentes de Demo vs. Produção

| Aspecto | Produção (`agents/`) | Demo (`agents/demo/`) |
|---|---|---|
| Intervalo D+3 | 3 dias reais | 15 segundos |
| Intervalo D+7 | 7 dias reais | 30 segundos |
| Leads por ciclo | Todos os "Novo" | Até 5 (configurável) |
| Métricas | Gmail API real | Simulação probabilística |
| Cron jobs | Sim | Não (setTimeout) |

## Variáveis de Demo (adicionar em `agents/.env`)

Veja [agents/demo/.env.demo.example](agents/demo/.env.demo.example) para configurar ritmo e probabilidades da demo.

## Documentação

Regras completas em [docs/IAraScale_Regras_Demo_Agentes.docx.pdf](docs/).
