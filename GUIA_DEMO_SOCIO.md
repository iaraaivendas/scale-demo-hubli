# Guia Completo da Demo — I.Ara Scale
## Para o apresentador

---

> **Nota importante:** Esta demo foi desenvolvida em tempo reduzido com foco em demonstrar o conceito e o potencial da plataforma. Os dados são fictícios, os e-mails não chegam aos leads reais, e alguns comportamentos são simulados. O objetivo é mostrar ao cliente *como seria* o produto final em operação — não uma versão de produção.

---

## O que é essa demo?

Você vai mostrar ao cliente como a I.Ara usa **agentes de inteligência artificial** para automatizar o processo comercial de uma empresa.

Em vez de um SDR passar horas prospectando, qualificando e escrevendo e-mails manualmente, a I.Ara faz isso em **menos de 1 minuto**, de forma autônoma, personalizada e escalável.

---

## Como acessar

Abra o browser (Chrome, Edge, etc.) e acesse:

```
http://demo.vps.iarautomacoes.com.br
```

> Caso o link acima não funcione, use diretamente pelo IP:
> `http://31.97.93.103` ou `http://31.97.93.103:3000`

Não precisa de senha, não precisa de login. A tela abre direto.

---

## Os dados mockados — o que são e onde estão

Para a demo funcionar sem depender de dados reais de clientes, foi criada uma base de **25 leads fictícios** com informações realistas de empresas brasileiras.

**Onde ficam:** arquivo `mock-data/leads_mock_demo.csv` no servidor.

**O que cada lead tem:**
- Nome, cargo, empresa, e-mail, telefone
- Segmento (SaaS, Varejo, Indústria, Financeiro, etc.)
- Tamanho da empresa (PME, Mid-Market, Enterprise)
- Cidade
- Score inicial (nota de 1 a 10)
- Status (Novo, Em Sequência, Respondeu, Frio)

**Como funcionam na demo:**
- Ao clicar em **Resetar**, os leads voltam exatamente para o estado original do CSV
- Os agentes de IA leem esses dados, tomam decisões baseados neles e atualizam os status em tempo real
- Os e-mails são escritos pela IA usando nome, empresa, cargo e segmento de cada lead — por isso parecem personalizados de verdade

---

## Os 5 Agentes de IA — como funcionam

Os agentes são programas autônomos em Node.js que rodam em sequência quando você clica "Iniciar Pipeline". Cada um tem uma responsabilidade específica e se comunica com o backend via API.

---

### Agente 1 — Prospector
**Cor no feed:** Azul

**O que faz:**
- Busca todos os leads com status "Novo" na base
- Para cada lead, envia os dados para o GPT-4o (IA da OpenAI)
- A IA analisa segmento, cargo, tamanho da empresa e retorna uma **nota de 0 a 10** com justificativa
- Leads com nota ≥ 7 são **qualificados** e passam para o próximo agente
- Leads com nota < 7 são marcados como **"Frio"** e descartados

**Como a IA decide:**
> A IA recebe o perfil do lead e avalia: "Esse lead tem potencial de compra? Faz sentido para a I.Ara abordar?" — considerando segmento de mercado, nível de decisão do cargo e tamanho da empresa.

---

### Agente 2 — Copywriter
**Cor no feed:** Roxo

**O que faz:**
- Recebe a lista de leads qualificados pelo Prospector
- Para cada lead, pede ao GPT-4o que escreva **3 e-mails diferentes**:
  - **E-mail 1 (Imediato):** Apresentação inicial personalizada
  - **E-mail 2 (D+3):** Follow-up com outro ângulo
  - **E-mail 3 (D+7):** Último contato com senso de urgência
- Cada e-mail tem: assunto, corpo completo e CTA (call-to-action)

**Como a IA personaliza:**
> O GPT recebe nome, cargo, empresa, segmento e cidade do lead. O resultado é um e-mail que parece escrito por um humano que pesquisou a empresa — não um template genérico.

---

### Agente 3 — Sequenciador
**Cor no feed:** Laranja

**O que faz:**
- Recebe os leads com os e-mails já escritos
- Cria uma **sequência de 3 steps** para cada lead no sistema
- Define os intervalos: Step 1 imediato, Step 2 após 15 segundos (representa D+3 na demo), Step 3 após 30 segundos (representa D+7)
- Salva a sequência no backend e transmite em tempo real para a tela

**Na vida real:**
> Os intervalos seriam de dias, não segundos. Na demo comprimimos o tempo para que o cliente veja tudo acontecer ao vivo.

---

### Agente 4 — Dispatcher
**Cor no feed:** Rosa

**O que faz:**
- Recebe as sequências criadas pelo Sequenciador
- Dispara o **Step 1 imediatamente**
- Agenda os Steps 2 e 3 com os temporizadores definidos
- Simula o envio dos e-mails (na demo não envia para os leads fictícios — mas o botão "Enviar" na plataforma envia de verdade para o e-mail configurado)

---

### Agente 5 — Monitor
**Cor no feed:** Verde

**O que faz:**
- Simula o comportamento dos leads após receber os e-mails
- Calcula probabilidade de abertura (75%) e resposta (35%)
- Atualiza o status dos leads que "responderam"
- Gera um relatório final: quantos leads foram processados, taxa de abertura simulada, taxa de resposta simulada

**Na vida real:**
> O Monitor rastrearia pixels de abertura nos e-mails reais e monitoraria respostas na caixa de entrada, atualizando o CRM automaticamente.

---

## Como os agentes se comunicam

```
Pipeline (orquestrador)
    │
    ├── Prospector → API do OpenAI (pontua leads)
    │       ↓
    ├── Copywriter → API do OpenAI (escreve e-mails)
    │       ↓
    ├── Sequenciador → Backend /api/sequences (salva sequências)
    │       ↓
    ├── Dispatcher → Backend /api/activity (loga envios)
    │       ↓
    └── Monitor → Backend /api/leads (atualiza status)
                → Backend /api/activity (loga resultados)

Backend → WebSocket → Plataforma (atualiza tela em tempo real)
```

Cada ação dos agentes gera um **log** que é enviado ao backend e transmitido via WebSocket para o feed "Atividade dos Agentes" na tela — é por isso que você vê os textos aparecendo em tempo real enquanto o pipeline roda.

---

## Passo a passo da apresentação

### Antes de começar — Resetar a demo
> Faça isso sempre antes de apresentar para um novo cliente.

- Clique no botão **"Resetar"** (vermelho, canto superior direito)
- Os leads voltam ao estado original com os status do CSV
- Logs e sequências são apagados

---

### 1. Apresente a tela

> *"Essa é a visão do gestor comercial da I.Ara Scale. Você está vendo 25 leads — empresas que poderiam ser seus clientes em potencial. Nenhum humano tocou nesses leads ainda."*

Mostre os KPIs:
- **Novos** — leads aguardando ser trabalhados
- **Em Sequência** — recebendo e-mails automáticos
- **Responderam** — interagiram com algum e-mail
- **Frios** — descartados pela IA por baixo potencial

---

### 2. Inicie o pipeline

Clique em **"Iniciar Pipeline"** e fale enquanto os logs aparecem:

**Quando aparecer o Prospector (azul):**
> *"O primeiro agente está analisando cada lead agora. Ele usa inteligência artificial para dar uma nota de 0 a 10 para cada empresa — considerando segmento, cargo do contato e tamanho. Leads abaixo de 7 são descartados automaticamente."*

**Quando aparecer o Copywriter (roxo):**
> *"Agora o segundo agente está escrevendo os e-mails. Não é um template — a IA escreve um e-mail diferente para cada empresa, usando o nome do contato, o cargo, o segmento de mercado. Três e-mails por lead: o primeiro, um follow-up e um último contato."*

**Quando aparecer o Sequenciador (laranja):**
> *"O terceiro agente está organizando a cadência — quando cada e-mail vai ser enviado. Na prática seriam dias entre cada mensagem. Aqui na demo vai acontecer em segundos para você ver ao vivo."*

**Quando aparecer o Dispatcher (rosa):**
> *"O quarto agente está disparando os e-mails. O primeiro vai agora. Os outros dois ficam agendados."*

**Quando aparecer o Monitor (verde):**
> *"E o último agente vai monitorar quem abriu, quem respondeu — e atualizar o status de cada lead no sistema automaticamente."*

---

### 3. Mostre os e-mails gerados

Após o pipeline terminar:

1. Clique em um lead com badge **"Em Sequência"**
2. Role para baixo — veja os **3 e-mails gerados pela IA**
3. Clique em **"Usar"** no primeiro e-mail

> *"Olha esse e-mail. Foi escrito pela IA em segundos. Está usando o nome do [fulano], menciona a [empresa], fala do segmento de [varejo/SaaS/etc.]. Um SDR levaria 10 a 15 minutos para escrever isso — para um lead. A I.Ara fez para todos ao mesmo tempo."*

---

### 4. Envie um e-mail real (alto impacto)

1. Com o composer aberto, clique **"Enviar"**
2. Aguarde a confirmação verde
3. Mostre o e-mail chegando no celular ou no computador

> *"Esse e-mail acabou de ser enviado de verdade. Saiu da nossa conta, com o conteúdo escrito pela IA, personalizado para esse lead — tudo sem intervenção humana."*

---

### 5. Argumento de fechamento

> *"O que você acabou de ver — prospectar 25 leads, qualificar, escrever e-mails personalizados e criar sequências de follow-up — levaria seu time comercial entre meio dia e dois dias de trabalho. A I.Ara fez isso em menos de 1 minuto, enquanto você assistia. E pode fazer isso 24 horas por dia, 7 dias por semana, para centenas de leads ao mesmo tempo."*

---

## Resumo dos botões

| Botão | O que faz |
|-------|-----------|
| **Iniciar Pipeline** | Inicia os 5 agentes de IA em sequência |
| **Resetar** | Limpa tudo e volta ao estado inicial |
| **Atualizar** | Recarrega os dados da tela manualmente |

---

## Em caso de problema

**A tela não carrega:**
- Verifique a conexão com internet
- Tente pelo IP: `http://31.97.93.103` ou `http://31.97.93.103:3000`
- Tente pelo celular na rede 4G

**Os leads aparecem zerados (todos 0):**
- Clique em **"Atualizar"**
- Se não resolver, clique em **"Resetar"**

**O pipeline não inicia ou trava:**
- Aguarde 15 segundos e clique novamente em **"Iniciar Pipeline"**
- Se travar no meio, clique **"Resetar"** e inicie novamente

**O e-mail não enviou:**
- Verifique se o campo "Para" está preenchido
- Tente novamente — pode ser instabilidade momentânea

---

## Por que a plataforma mostra apenas o "Inbox de Agentes"

A plataforma I.Ara Scale completa tem muito mais funcionalidades — Dashboard financeiro, gestão de Leads, WhatsApp, Analytics, Forecast, Copy IA, entre outras. Você pode ter visto essas telas em versões anteriores ou em prints do sistema.

**Por que removemos da demo:**

A decisão foi estratégica e tem dois motivos principais:

**1. Foco na proposta de valor central**
O objetivo desta demo é mostrar ao cliente *uma coisa com clareza total*: que agentes de IA conseguem automatizar o processo comercial de ponta a ponta. Se o cliente vir 8 menus diferentes, a atenção se dispersa e o impacto da demonstração dos agentes dilui.

> É melhor o cliente sair da reunião pensando *"vi uma IA prospectando e escrevendo e-mails em tempo real"* do que *"vi um monte de telas e gráficos"*.

**2. As outras funcionalidades não estavam prontas para demo**
As demais telas foram construídas em cima de dados do Supabase (banco de dados em nuvem) e de um sistema de login/autenticação que não faz parte deste protótipo. Exibir telas com dados vazios ou com erros durante uma apresentação para cliente causaria má impressão — o contrário do que queremos.

**O que existe na plataforma completa (para mostrar ao cliente se perguntarem):**
- **Dashboard** — visão geral de receita, metas e KPIs comerciais
- **Leads** — gestão completa de leads com IA ativa
- **WhatsApp** — automação de conversas com IA
- **Analytics** — relatórios de performance comercial
- **Forecast** — previsão de receita com IA
- **Copy IA** — gerador de copies para campanhas

Essas funcionalidades existem e fazem parte do produto — apenas não estão integradas neste protótipo de demonstração por limitação de tempo de desenvolvimento.

---

## O que essa demo NÃO faz (para sua transparência)

Para ser honesto com o cliente se perguntarem:

- Os **leads são fictícios** — não são empresas reais
- Os e-mails dos Steps 2 e 3 são **simulados** na demo (o botão "Enviar" envia de verdade, mas o agente não dispara automaticamente para e-mails fictícios)
- O **Monitor simula** abertura e resposta com probabilidade — não rastreia abertura real
- Os **intervalos são comprimidos** — D+3 e D+7 viram segundos na demo

Tudo isso seria real em produção. A demo mostra o *conceito e o fluxo* — não uma versão final do produto.

---

*I.Ara Scale — Pipeline comercial automatizado com IA*
*Desenvolvido para demonstração comercial — Abril 2026*
