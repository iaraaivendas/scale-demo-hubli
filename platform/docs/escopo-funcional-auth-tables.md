# Regras de Aplicação — Escopo Funcional e Tabelas auth.users

> Documento de referência completo para o I.ARA Scale v2.0

---

## 7. Escopo Funcional

### 7.1 Módulos do Sistema

| # | Módulo | Rota | Descrição | Roles com Acesso |
|---|---|---|---|---|
| 1 | **Login** | `/login` | Autenticação de clientes (Supabase Auth) | Público |
| 2 | **Admin Login** | `/admin` | Autenticação de administradores I.ARA | Público |
| 3 | **Dashboard Executivo** | `/dashboard` | KPIs, receita, metas, alertas em tempo real | gestor, marketing, vendedor |
| 4 | **Leads** | `/leads` | CRUD de prospectos, ativação de IAs, scores | gestor, marketing, vendedor* |
| 5 | **WhatsApp** | `/whatsapp` | Conversas com leads via IA conversacional | gestor, vendedor |
| 6 | **Campanhas** | `/campaigns` | Gestão de campanhas por canal (Meta, Google, etc.) | gestor, marketing |
| 7 | **Analytics** | `/analytics` | Revenue Score, métricas de expansão, oportunidades | gestor, marketing |
| 8 | **Forecast** | `/forecast` | Simulador de cenários (comercial, financeiro, marketing) | gestor, marketing |
| 9 | **Copy Generator** | `/copy` | Geração de textos com IA de Copy | gestor, marketing |
| 10 | **Configurações** | `/settings` | Perfil, plano, pools, membros do time | gestor |
| 11 | **Admin Dashboard** | `/admin/dashboard` | Visão consolidada multi-tenant | superadmin, iara_admin |
| 12 | **Admin Clientes** | `/admin/clients` | Gestão de todos os clientes | superadmin, iara_admin |
| 13 | **Admin Usuários** | `/admin/users` | Gestão de usuários e roles | superadmin, iara_admin |
| 14 | **Admin Leads** | `/admin/leads` | Visualização de leads de todos os clientes | superadmin, iara_admin |
| 15 | **Admin Config** | `/admin/settings` | Configurações globais do sistema | superadmin |

> \* Vendedor: acesso restrito a leads onde `assigned_to = auth.uid()`.

### 7.2 Funcionalidades Core

#### Dashboard Executivo (`/dashboard`)

- **KPIs em tempo real**: Total de leads, leads ativos, score médio, taxa de conversão
- **Receita mensal**: Gráfico de barras com receita acumulada
- **Comparativo anual**: Variação mês a mês em relação ao ano anterior
- **Meta de receita**: Barra de progresso com % atingido
- **Performance por campanha**: Tabela com spend, leads, conversões e ROI
- **Alertas inteligentes**: Motor automático (`alertEngine.ts`) com thresholds configuráveis
- **Modo privacidade**: Toggle para ocultar valores monetários em apresentações

#### Leads (`/leads`)

- CRUD completo de leads com filtros por status e IA
- Ativação individual de IAs por lead (até 6 tipos simultâneos)
- Visualização de score e histórico de ativações
- Importação/exportação em massa
- Card expandível com relatórios de Performance, Marketing e Copy

#### WhatsApp (`/whatsapp`)

- Lista de conversas ativas com lead
- Chat em tempo real (IA conversacional)
- Indicadores de status (aberta, fechada, arquivada)
- Tipo de IA associado à conversa (`ai_type`)

#### Campanhas (`/campaigns`)

- CRUD de campanhas com canal, budget, período
- Status: rascunho → ativa → pausada → finalizada
- Dados financeiros vinculados (`campaigns_financial`)
- Métricas: spend, leads gerados, conversões, receita atribuída

#### Analytics (`/analytics`)

- **Revenue Score**: Pontuação preditiva de receita por lead
- **Motor Score Preditivo**: Fórmula normalizada (0–100) com 4 sinais (intent_signals, payment_behavior, tenure_score, growth_signals)
- **Classificação Automática**: Upsell (mesmo produto/plano) vs Cross-sell (produto complementar)
- **Alertas de Oportunidade**: Nível warming (75–84) e ready (85–100) com script sugerido
- **Métricas de Expansão**: Oportunidades identificadas pelo motor preditivo
- **Heatmap de Uso**: Distribuição de atividades por período
- **Insights Acionáveis**: Recomendações automáticas baseadas em dados
- **Gating por Plano**: ESSENCIAL bloqueado (exibe card de upsell), GROWTH e PRO com acesso completo

#### Forecast (`/forecast`)

- Simulador de cenários com 3 perspectivas:
  - **Comercial**: Projeção de conversões e receita
  - **Financeiro**: Fluxo de caixa e metas
  - **Marketing**: ROI projetado por canal
- Seletor de cenário: Otimista / Realista / Pessimista
- Alertas de forecast com ações recomendadas

#### Copy Generator (`/copy`)

- Geração de textos via IA de Copy
- Relatório de insights de copywriting por lead
- Histórico de rascunhos salvos (`iara_copy_drafts`)

### 7.3 Funcionalidades Removidas do Escopo

| Funcionalidade | Status | Motivo |
|---|---|---|
| Lead Enrichment | ❌ Removido permanentemente | Fora do roadmap de produto |
| Auto-cadastro (self-registration) | ❌ Não implementado | Acesso restrito a clientes pré-cadastrados |
| Cadastro anônimo | ❌ Proibido | Política de segurança |

### 7.4 Fluxo de Autenticação

```
Usuário acessa /login
  → Supabase Auth (email + senha)
  → Trigger handle_new_user() cria:
      - profiles (id, full_name, avatar_url)
      - user_roles (user_id, role = 'vendedor')
  → Frontend verifica session via useAuth()
  → Redireciona para /dashboard
  → Sidebar renderiza conforme role do usuário
```

```
Logout:
  → supabase.auth.signOut()
  → clearSession() limpa localStorage (legado + atual)
  → Redireciona para /login
```

### 7.5 Proteção de Rotas

```typescript
// Customer Routes: verificam sessão Supabase
function CustomerRoute({ children }) {
  if (!isCustomerAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Admin Routes: verificam sessão administrativa
function AdminRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
```

### 7.6 Engines e Motores Internos

| Engine | Arquivo | Função |
|---|---|---|
| **Alert Engine** | `src/lib/alertEngine.ts` | Alertas automáticos com thresholds, cooldown, e tipos `upsell_opportunity` / `cross_sell_opportunity` |
| **Revenue Scorer** | `src/lib/revenueScorer.ts` | Motor Score Preditivo (fórmula 4 sinais), classificação Upsell/Cross-sell, scripts sugeridos, gating por plano |
| **Forecast Engine** | `src/lib/forecastEngine.ts` | Simulação de cenários comerciais |
| **Marketing Forecast** | `src/lib/marketingForecastEngine.ts` | Projeções de marketing por canal |
| **Performance Insights** | `src/lib/performanceInsightsEngine.ts` | Insights de performance por lead |
| **Marketing Insights** | `src/lib/marketingInsightsEngine.ts` | Insights de campanhas de marketing |
| **Copy Insights** | `src/lib/copyInsightsEngine.ts` | Relatório de copywriting por lead |
| **Realtime Simulator** | `src/lib/realtimeSimulator.ts` | Simulação de dados em tempo real para demo |
| **Realtime Events** | `src/lib/realtimeEvents.ts` | Barramento de eventos pub/sub com payloads de oportunidade |
| **Financial Calculations** | `src/lib/financialCalculations.ts` | Cálculos financeiros (centavos → reais) |

---

## 8. Tabelas que Dependem de auth.users

### 8.1 Visão Geral

O sistema possui **3 tabelas** que dependem diretamente de `auth.users` através de referências ao `user_id`:

| Tabela | Coluna | Tipo de Dependência | Descrição |
|---|---|---|---|
| `profiles` | `id` | **PK = FK** (`auth.users.id`) | Perfil do usuário. Criado automaticamente pelo trigger `handle_new_user`. |
| `user_roles` | `user_id` | **FK** (`auth.users.id` ON DELETE CASCADE) | Role do usuário. Criado automaticamente pelo trigger `handle_new_user`. |
| `ai_activations` | `activated_by` | **Referência lógica** (UUID do usuário) | Quem ativou a IA. Sem FK formal no schema. |

### 8.2 Diagrama de Dependência

```
auth.users (Supabase-managed)
  │
  ├── profiles (id = auth.users.id)
  │     └── client_id → clients.id
  │
  ├── user_roles (user_id → auth.users.id ON DELETE CASCADE)
  │     └── role (app_role enum)
  │
  ├── ai_activations (activated_by = auth.users.id)
  │     ├── client_id → clients.id
  │     └── lead_id → leads.id
  │
  └── lead_ai_activations (activated_by = auth.users.id)
        ├── client_id → clients.id
        └── lead_id → leads.id
```

### 8.3 Trigger `handle_new_user()`

Quando um novo usuário é criado em `auth.users`, o trigger executa automaticamente:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Cria perfil na tabela profiles
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- 2. Atribui role padrão 'vendedor'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'vendedor');

  RETURN NEW;
END;
$$;
```

**Observações importantes:**

1. O `client_id` do profile **NÃO é definido** no trigger — deve ser atribuído manualmente por um admin após o cadastro.
2. O role padrão é sempre `vendedor` — promoções devem ser feitas por um admin via `user_roles`.
3. A função usa `SECURITY DEFINER` para ter permissão de inserir em `profiles` e `user_roles`.

### 8.4 Estratégia de Seed (Dados de Demonstração)

As tabelas que dependem de `auth.users` **NÃO podem ser populadas via seed SQL** diretamente, pois requerem a existência do usuário em `auth.users` (FK constraints).

```
Ordem de criação obrigatória:
  1. clients (independente)
  2. auth.users → via Supabase Auth API (signup)
  3. profiles (auto-criado pelo trigger handle_new_user)
  4. user_roles (auto-criado pelo trigger handle_new_user)
  5. Atribuição de client_id no profile (manual/admin)
  6. Promoção de role se necessário (manual/admin)
  7. leads, campaigns, etc. (dependem de client_id)
  8. ai_activations, lead_ai_activations (dependem de user + lead + client)
```

### 8.5 Tabelas Independentes de auth.users

Todas as demais tabelas dependem apenas de `clients.id` (multi-tenancy), não de `auth.users`:

| Tabela | Dependência Principal |
|---|---|
| `clients` | Independente (tabela raiz) |
| `leads` | `client_id → clients.id` |
| `campaigns` | `client_id → clients.id` |
| `campaigns_financial` | `client_id → clients.id`, `campaign_id → campaigns.id` |
| `subscriptions` | `client_id → clients.id` |
| `payments` | `client_id → clients.id` |
| `pool_transactions` | `client_id → clients.id` |
| `extra_pools` | `client_id → clients.id` |
| `scores` | `client_id → clients.id`, `lead_id → leads.id` |
| `goals` | `client_id → clients.id` |
| `whatsapp_conversations` | `client_id → clients.id`, `lead_id → leads.id` |
| `whatsapp_messages` | `conversation_id → whatsapp_conversations.id` |

### 8.6 Implicações para o Desenvolvimento

1. **Não fazer FK direta para `auth.users`** em tabelas de negócio — usar apenas `profiles.id` como referência indireta.
2. **Nunca manipular `auth.users` diretamente** — usar Supabase Auth API (`signUp`, `signInWithPassword`, etc.).
3. **Seed de dados**: Tabelas como `leads`, `campaigns`, `goals` podem ser populadas livremente via SQL. Tabelas como `profiles` e `user_roles` só após criação do usuário em `auth.users`.
4. **Exclusão em cascata**: Deletar um usuário em `auth.users` remove automaticamente `user_roles` (ON DELETE CASCADE). O `profiles` deve ter tratamento explícito.

---

## Arquivos de Referência

| Arquivo | Conteúdo |
|---|---|
| `src/hooks/useAuth.ts` | Hook de autenticação (Supabase session) |
| `src/lib/storage.ts` | Camada de persistência localStorage (legado) |
| `src/App.tsx` | Rotas protegidas e estrutura de navegação |
| `src/integrations/supabase/client.ts` | Cliente Supabase (auto-gerado) |
| `src/integrations/supabase/types.ts` | Schema do banco (auto-gerado) |

---

*Documento gerado em Março/2026 — I.ARA Scale v2.0*
