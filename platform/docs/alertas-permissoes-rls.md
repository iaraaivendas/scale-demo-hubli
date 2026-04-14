# Regras de Aplicação — Alertas, Permissões e Segurança RLS

> Documento de referência completo para o I.ARA Scale v2.0

---

## 1. Alertas de Consumo de Pools

### 1.1 Fórmula de Cálculo

```
pools_total = pools_included + pools_extra
pools_remaining = max(pools_total - pools_used, 0)
usage_percent = (pools_used / pools_total) × 100
```

> Se `pools_total = 0`, o percentual é considerado `0%` (divisão segura).

### 1.2 Níveis de Alerta

| Nível | Faixa | Cor | Comportamento |
|---|---|---|---|
| **Normal** | 0% – 69% | `primary` (verde/azul) | Operação normal. Nenhum alerta exibido. |
| **Warning** | 70% – 89% | `warning` (amarelo) | Alerta visual. Mensagem: *"Atenção: X% dos pools consumidos. Monitore seu consumo."* |
| **Critical** | 90% – 99% | `destructive` (vermelho) | Alerta urgente. Mensagem: *"Alerta crítico: X% dos pools consumidos. Considere adquirir mais pools."* |
| **Blocked** | 100% | `destructive` (vermelho) | **Bloqueio total de ativações**. Mensagem: *"Limite de pools atingido. Adquira pools adicionais ou faça upgrade do seu plano."* |

### 1.3 Thresholds no Código

```typescript
// src/lib/pools.ts
export const POOL_THRESHOLDS = {
  WARNING: 70,   // Alerta amarelo
  CRITICAL: 90,  // Alerta vermelho
  BLOCKED: 100,  // Bloqueio de ativações
} as const;
```

### 1.4 Função de Determinação

```typescript
function getAlertLevel(usagePercent: number): PoolAlertLevel {
  if (usagePercent >= 100) return 'blocked';
  if (usagePercent >= 90)  return 'critical';
  if (usagePercent >= 70)  return 'warning';
  return 'normal';
}
```

### 1.5 Estilos Visuais por Nível

| Nível | Texto | Fundo | Barra de Progresso |
|---|---|---|---|
| Normal | `text-primary` | `bg-primary/20` | `bg-primary` |
| Warning | `text-warning` | `bg-warning/20` | `bg-warning` |
| Critical | `text-destructive` | `bg-destructive/20` | `bg-destructive` |
| Blocked | `text-destructive` | `bg-destructive/20` | `bg-destructive` |

### 1.6 Regras de Comportamento

1. **Normal → Warning (70%)**: Exibir banner informativo no dashboard e no card de pools.
2. **Warning → Critical (90%)**: Exibir alerta persistente. Sugerir compra de pools adicionais.
3. **Critical → Blocked (100%)**: 
   - Bloquear **todas** as ativações de IA (`canActivate = false`).
   - Exibir modal de bloqueio com opções:
     - Comprar pacote de +500 pools (R$ 990)
     - Comprar pacote de +1.000 pools (R$ 1.790)
     - Fazer upgrade de plano
   - Se `pools_extra >= 1.000` → **upsell obrigatório** (só upgrade de plano resolve).

### 1.7 Validação no Banco de Dados

```sql
-- Função: can_activate_ai(_client_id)
SELECT pools_used < (pools_included + pools_extra)
FROM public.clients WHERE id = _client_id;
-- Retorna FALSE quando bloqueado (100%)
```

### 1.8 Engine de Alertas em Tempo Real

O sistema possui um motor de alertas (`src/lib/alertEngine.ts`) que dispara automaticamente:

| Métrica | Threshold | Tipo de Alerta |
|---|---|---|
| Consumo de pools | 90% | `warning` — Consumo alto |
| Consumo de pools | 100% | `critical` — Bloqueio |
| Meta mensal atingida | 80% | `success` — Quase lá |
| Meta mensal atingida | 100% | `success` — Meta batida |
| Queda de receita | < mês anterior | `warning` — Receita em queda |
| ROI negativo em campanha ativa | ROI < 0 | `critical` — Campanha prejudicial |

- Alertas possuem **cooldown** para evitar duplicatas.
- Aparecem imediatamente no `AlertsPanel` sem necessidade de refresh manual.
- Integrados com barramento de eventos para processamento em tempo real.

---

## 2. Hierarquia de Permissões (5 Níveis)

### 2.1 Tabela de Roles

| # | Role | Nível | Escopo | Descrição |
|---|---|---|---|---|
| 1 | `superadmin` | Máximo | Multi-tenant (todos os clientes) | Fundador/CTO. Acesso total e irrestrito ao sistema. |
| 2 | `iara_admin` | Alto | Multi-tenant (todos os clientes) | Equipe administrativa I.ARA. Gestão global. |
| 3 | `gestor` | Médio-Alto | Tenant único (`client_id`) | Gestor do cliente. Acesso completo dentro do seu plano. |
| 4 | `marketing` | Médio | Tenant único (`client_id`) | Foco em campanhas e analytics. Restrições em scores de leads. |
| 5 | `vendedor` | Básico | Tenant único + `assigned_to` | Acesso apenas a leads atribuídos a ele. |

### 2.2 Enum no Banco de Dados

```sql
CREATE TYPE public.app_role AS ENUM (
  'superadmin',
  'iara_admin',
  'gestor',
  'marketing',
  'vendedor'
);
```

### 2.3 Tabela `user_roles`

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'vendedor',
  UNIQUE (user_id, role)
);
```

> **Importante**: Roles ficam em tabela separada de `profiles` para evitar ataques de escalação de privilégios.

### 2.4 Atribuição Automática

Quando um novo usuário se cadastra, o trigger `handle_new_user()` atribui automaticamente:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES (NEW.id, 'vendedor');
-- Todo novo usuário começa como vendedor
```

### 2.5 Permissões Detalhadas por Role

#### SuperAdmin (`superadmin`)

| Recurso | Permissão |
|---|---|
| Clientes | CRUD completo em **todos** os clientes |
| Leads | Visualizar, editar e excluir de **qualquer** cliente |
| Usuários | Criar, editar roles, desativar de **qualquer** cliente |
| IAs | Ativar qualquer IA em qualquer lead |
| Pools | Ajustar manualmente (`manual_adjust`) |
| Planos/Assinaturas | Criar, alterar, cancelar |
| Pagamentos | Visualizar e gerenciar todos |
| Dashboard | Visão consolidada multi-tenant |
| Configurações | Acesso total às configurações globais |
| `viewingClientId` | Pode alternar contexto entre clientes |

#### IARA Admin (`iara_admin`)

| Recurso | Permissão |
|---|---|
| Clientes | Visualizar todos, editar e criar |
| Leads | Visualizar de todos os clientes |
| Usuários | Gerenciar roles de qualquer cliente |
| IAs | Visualizar ativações de todos os clientes |
| KPIs | Visão macro: receita, consumo, churn |
| Dashboard | Monitoramento centralizado |

#### Gestor (`gestor`)

| Recurso | Permissão |
|---|---|
| Leads | CRUD completo dentro do seu `client_id` |
| IAs | Ativar qualquer IA disponível no plano |
| Pools | Visualizar consumo e comprar extras |
| Campanhas | Criar e gerenciar campanhas |
| Usuários | Visualizar membros do time |
| Dashboard | Dashboard completo do cliente |
| Analytics | Acesso total a relatórios e forecast |

#### Marketing (`marketing`)

| Recurso | Permissão |
|---|---|
| Leads | Visualizar leads do cliente (sem scores individuais) |
| Campanhas | Criar e gerenciar campanhas |
| Analytics | Acesso a relatórios de marketing |
| Forecast | Visualizar previsões de marketing |
| IAs | Ativar IAs de marketing (se plano permitir) |
| Scores | ❌ Sem acesso a scores individuais de leads |

#### Vendedor (`vendedor`)

| Recurso | Permissão |
|---|---|
| Leads | **Apenas** leads onde `assigned_to = auth.uid()` |
| IAs | Ativar IAs conversacionais nos seus leads |
| WhatsApp | Conversas dos seus leads |
| Dashboard | Visão limitada aos seus leads |
| Campanhas | ❌ Sem acesso |
| Configurações | ❌ Sem acesso |
| Outros leads | ❌ Sem acesso |

### 2.6 Funções de Validação

```sql
-- Verifica se usuário possui role específica
CREATE FUNCTION has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN
SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Verifica se é admin (superadmin ou iara_admin)
CREATE FUNCTION is_admin(_user_id UUID) RETURNS BOOLEAN
SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'iara_admin')
  );
$$;

-- Retorna client_id do usuário
CREATE FUNCTION get_user_client_id(_user_id UUID) RETURNS UUID
SECURITY DEFINER AS $$
  SELECT client_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Verifica se usuário pertence ao cliente
CREATE FUNCTION user_belongs_to_client(_user_id UUID, _client_id UUID) RETURNS BOOLEAN
SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND client_id = _client_id
  );
$$;
```

> Todas as funções usam `SECURITY DEFINER` para evitar recursão infinita nas políticas RLS.

---

## 3. Segurança (Row Level Security — RLS)

### 3.1 Princípio Fundamental

**Multi-tenancy por `client_id`**: Cada tabela com dados de cliente possui uma coluna `client_id`. O RLS garante que um usuário **nunca** acesse dados de outro cliente, a menos que seja admin.

### 3.2 Padrão de Políticas

Todas as tabelas seguem um padrão consistente com duas camadas:

```
Camada 1: Admins (superadmin/iara_admin) → Acesso amplo
Camada 2: Usuários regulares → Acesso restrito ao seu client_id
```

### 3.3 Políticas por Tabela

#### `clients` (Tabela de Clientes)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Usuário | `id = get_user_client_id(auth.uid())` |
| INSERT | Admin | `is_admin(auth.uid())` |
| UPDATE | Admin | `is_admin(auth.uid())` |
| DELETE | Admin | `is_admin(auth.uid())` |

> Clientes comuns **só podem ver** seu próprio registro. Não podem criar, editar ou excluir.

#### `profiles` (Perfis de Usuário)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Próprio | `id = auth.uid()` |
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| INSERT | Próprio | `id = auth.uid()` (via trigger `handle_new_user`) |
| UPDATE | Próprio | `id = auth.uid()` |
| UPDATE | Admin | `is_admin(auth.uid())` |
| DELETE | ❌ | Ninguém pode deletar perfis |

#### `user_roles` (Roles de Usuário)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Próprio | `user_id = auth.uid()` |
| SELECT | Admin | `is_admin(auth.uid())` |
| ALL (CRUD) | Admin | `is_admin(auth.uid())` |

> Usuários comuns **só podem ver** sua própria role. Apenas admins gerenciam roles.

#### `leads` (Leads/Prospectos)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| INSERT | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| UPDATE | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| DELETE | Admin | `is_admin(auth.uid())` |

> **Nota para Vendedores**: A restrição `assigned_to = auth.uid()` deve ser aplicada na camada de aplicação (frontend), pois o RLS atual permite SELECT a todos os membros do cliente.

#### `ai_activations` (Ativações de IA)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| INSERT | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| UPDATE | ❌ | **Proibido** — ativações são imutáveis |
| DELETE | ❌ | **Proibido** — ativações são permanentes |

#### `lead_ai_activations` (Ativações de IA por Lead)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| INSERT | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| UPDATE | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| DELETE | ❌ | **Proibido** |

> UPDATE permitido apenas para alterar `status` (active → paused → finished).

#### `pool_transactions` (Transações de Pools)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| INSERT | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| UPDATE | ❌ | **Proibido** — transações são imutáveis |
| DELETE | ❌ | **Proibido** — transações são permanentes |

#### `extra_pools` (Compras de Pools Extras)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| INSERT | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| UPDATE | ❌ | **Proibido** |
| DELETE | ❌ | **Proibido** |

#### `subscriptions` (Assinaturas)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| ALL (CRUD) | Admin | `is_admin(auth.uid())` |

> Clientes podem **visualizar** sua assinatura, mas não podem alterar.

#### `payments` (Pagamentos)

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| ALL (CRUD) | Admin | `is_admin(auth.uid())` |

#### `campaigns` e `campaigns_financial`

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| ALL (CRUD) | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |

#### `whatsapp_conversations`

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| ALL (CRUD) | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |

#### `whatsapp_messages`

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Via conversa | `EXISTS (SELECT 1 FROM whatsapp_conversations c WHERE c.id = conversation_id AND (c.client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())))` |
| INSERT | Via conversa | Mesma condição acima |
| UPDATE | ❌ | **Proibido** — mensagens são imutáveis |
| DELETE | ❌ | **Proibido** — mensagens são permanentes |

#### `scores`

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| INSERT | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |
| UPDATE | ❌ | **Proibido** |
| DELETE | ❌ | **Proibido** |

#### `goals`

| Operação | Quem pode | Condição |
|---|---|---|
| SELECT | Admin | `is_admin(auth.uid())` |
| SELECT | Mesmo cliente | `client_id = get_user_client_id(auth.uid())` |
| ALL (CRUD) | Mesmo cliente ou Admin | `client_id = get_user_client_id(auth.uid()) OR is_admin(auth.uid())` |

### 3.4 Triggers de Segurança

| Trigger | Tabela | Ação |
|---|---|---|
| `handle_new_user` | `auth.users` (ON INSERT) | Cria perfil em `profiles` e role `vendedor` em `user_roles` |
| `sync_plan_limits` | `clients` (ON UPDATE) | Sincroniza `pools_included` e `users_limit` quando plano muda |
| `set_updated_at` | Várias tabelas (ON UPDATE) | Atualiza campo `updated_at` automaticamente |

### 3.5 SuperAdmin — Lógica Multi-Tenant

```
SuperAdmin:
  - client_id = NULL (não pertence a nenhum cliente)
  - Usa viewingClientId na sessão para alternar contexto
  - Função getEffectiveClientId() retorna:
    → viewingClientId (se definido)
    → client_id do perfil (para usuários normais)
```

### 3.6 Princípios de Segurança

1. **Nunca armazenar roles no frontend** — Sempre validar via `has_role()` no banco.
2. **Nunca usar localStorage para verificar admin** — Pode ser manipulado pelo usuário.
3. **SECURITY DEFINER** em todas as funções de validação — Evita recursão infinita no RLS.
4. **Tabela `user_roles` separada de `profiles`** — Evita escalação de privilégios.
5. **DELETE proibido** em tabelas de auditoria (`ai_activations`, `pool_transactions`, `scores`, `whatsapp_messages`).
6. **Valores monetários em centavos** — Evita erros de arredondamento com ponto flutuante.

---

## 4. Arquivos de Referência

| Arquivo | Conteúdo |
|---|---|
| `src/lib/pools.ts` | Lógica de pools, cálculos, alertas, estilos |
| `src/lib/plans.ts` | Planos, preços, limites |
| `src/lib/aiTypes.ts` | Tipos de IA, governança por plano |
| `src/lib/alertEngine.ts` | Motor de alertas em tempo real |
| `src/integrations/supabase/types.ts` | Schema do banco (auto-gerado) |
| `docs/governanca-ias.md` | Regras de governança de IAs |

---

*Documento gerado em Março/2026 — I.ARA Scale v2.0*
