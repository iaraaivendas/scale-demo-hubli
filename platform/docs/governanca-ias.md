# Governança de IAs — I.ARA Scale

> Documento de referência com todas as regras de governança, acesso, consumo e segurança das Inteligências Artificiais do sistema I.ARA Scale.

---

## 1. Tabela de IAs

| ID | Nome | Descrição | Ícone | Plano Mínimo | Custo (pools) | Tipo |
|---|---|---|---|---|---|---|
| `commercial` | IA Comercial | Atendimento comercial automatizado via WhatsApp. Qualifica leads, responde dúvidas e agenda demonstrações. | MessageSquare | ESSENCIAL | 1 | Conversacional |
| `reactivation` | IA Reativação | Reativa leads inativos com campanhas personalizadas. Identifica oportunidades de retorno. | RefreshCw | ESSENCIAL | 1 | Conversacional |
| `performance` | IA Performance & Insights | Análise de performance do lead com insights de comportamento. Sugere ações otimizadas. | LineChart | GROWTH | 1 | Relatório |
| `upsell` | IA Upsell & Cross-sell | Motor Score Preditivo: identifica oportunidades via fórmula normalizada (intent_signals×0.35 + payment_behavior×0.30 + tenure_score×0.20 + growth_signals×0.15). Classifica automaticamente como Upsell ou Cross-sell com script sugerido. | TrendingUp | GROWTH | 1 | Conversacional |
| `marketing` | IA Marketing | Automação de campanhas de marketing personalizadas. Segmentação inteligente. | Megaphone | PRO | 1 | Relatório |
| `copy` | IA Copy Avançada | Geração de copy persuasivo com atribuição avançada. Otimiza mensagens por canal. | FileEdit | PRO | 1 | Relatório |

---

## 2. Regras de Acesso por Plano

| Plano | IAs Disponíveis |
|---|---|
| **ESSENCIAL** | `commercial`, `reactivation` |
| **GROWTH** | `commercial`, `reactivation`, `performance`, `upsell` |
| **PRO** | `commercial`, `reactivation`, `performance`, `upsell`, `marketing`, `copy` |

### Hierarquia

- Cada plano **herda** todas as IAs dos planos inferiores.
- A função `isAIAvailableForPlan(aiTypeId, plan)` valida o acesso.
- A constante `PLAN_AI_ACCESS` mapeia plano → lista de IAs permitidas.

---

## 3. Pré-requisitos de Ativação

Para ativar qualquer IA em um lead, **todas** as condições abaixo devem ser verdadeiras:

| # | Pré-requisito | Validação |
|---|---|---|
| 1 | Cliente com status **ativo** | `clients.status = 'active'` |
| 2 | Plano compatível com a IA | `PLAN_AI_ACCESS[plan].includes(aiTypeId)` |
| 3 | Sem ativação duplicada ativa do mesmo tipo para o lead | `lead_ai_activations` com `status = 'active'` e mesmo `ai_type` + `lead_id` |
| 4 | Saldo de pools suficiente | `pools_used < pools_included + pools_extra` |

### Função de banco: `can_activate_ai(_client_id)`

```sql
-- Retorna TRUE se o cliente pode consumir pool
-- Verifica: pools_used < (pools_included + pools_extra)
```

---

## 4. Fluxo de Consumo de Pools

### Função atômica: `consume_pool(_client_id, _description)`

```
1. SELECT FOR UPDATE na tabela `clients` (lock da linha)
2. Verifica: pools_used < (pools_included + pools_extra)
   - Se NÃO → retorna FALSE (bloqueio)
3. UPDATE clients SET pools_used = pools_used + 1
4. INSERT em pool_transactions:
   - type: 'ai_consume'
   - amount: 1
   - balance_after: novo pools_used
   - description: descrição da ativação
5. Retorna TRUE
```

### Tabela `pool_transactions`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `client_id` | UUID | FK → clients |
| `type` | enum | `plan_credit`, `extra_purchase`, `ai_consume`, `manual_adjust` |
| `amount` | integer | Quantidade de pools (positivo ou negativo) |
| `balance_after` | integer | Saldo após transação |
| `description` | text | Descrição da operação |
| `reference_id` | UUID | Referência opcional (ex: activation_id) |
| `created_by` | UUID | Usuário que executou |
| `created_at` | timestamptz | Data/hora |

---

## 5. Thresholds de Alerta de Consumo

| Nível | Percentual | Comportamento |
|---|---|---|
| **Normal** | 0–69% | Operação normal. Cor: `primary` |
| **Warning** | 70–89% | Alerta amarelo. Mensagem: "Atenção: X% dos pools consumidos. Monitore seu consumo." |
| **Critical** | 90–99% | Alerta vermelho. Mensagem: "Alerta crítico: X% dos pools consumidos. Considere adquirir mais pools." |
| **Blocked** | 100% | Bloqueio total. Mensagem: "Limite de pools atingido. Adquira pools adicionais ou faça upgrade do seu plano." |

### Cálculo

```
usagePercent = (pools_used / (pools_included + pools_extra)) × 100
```

---

## 6. Compra de Pools Adicionais

### Pacotes Disponíveis

| Pacote | Quantidade | Preço | Preço (centavos) |
|---|---|---|---|
| `pack_500` | +500 pools | R$ 990,00 | 99.000 |
| `pack_1000` | +1.000 pools | R$ 1.790,00 | 179.000 |

### Regras

- **Limite mensal**: máximo de **1.000 pools extras** por mês por cliente.
- Se `pools_extra + pacote > 1.000` → compra **bloqueada**.
- Se `pools_extra = 1.000` → **upsell obrigatório** (upgrade de plano).

### Função de banco: `purchase_additional_pools(_client_id, _month_reference, _price_centavos, _quantity)`

```
1. Verifica limite de 1.000 extras/mês
2. INSERT em extra_pools (registro da compra)
3. UPDATE clients SET pools_extra = pools_extra + quantidade
4. INSERT em pool_transactions (type: 'extra_purchase')
5. INSERT em payments (type: 'extra_pools', status: 'paid')
```

---

## 7. Comportamento por Tipo de IA

### IAs Conversacionais (WhatsApp)

| IA | Comportamento |
|---|---|
| `commercial` | Inicia fluxo de atendimento comercial no WhatsApp. Qualifica lead, responde dúvidas, agenda demos. |
| `reactivation` | Envia campanha de reativação personalizada via WhatsApp. |
| `upsell` | Identifica e aborda oportunidades de upsell/cross-sell via WhatsApp. |

**Fluxo:**
1. Ativação consome 1 pool
2. Cria registro em `whatsapp_conversations` com `ai_type` correspondente
3. Sistema envia primeira mensagem automática
4. Lead responde → mensagens registradas em `whatsapp_messages`
5. Status da conversa: `open` → `closed` → `archived`

### IAs de Relatório (não-conversacionais)

| IA | Comportamento |
|---|---|
| `performance` | Gera relatório de performance do lead com métricas de comportamento e sugestões de ação. |
| `marketing` | Gera relatório de segmentação e automação de campanha para o lead. |
| `copy` | Gera copy persuasivo otimizado por canal (WhatsApp, email, anúncios). |

**Fluxo:**
1. Ativação consome 1 pool
2. Sistema processa dados do lead
3. Gera relatório de inteligência automatizado
4. Relatório salvo e disponível no perfil do lead

---

## 8. Segurança (RLS)

### Multi-tenancy

- **Todas** as tabelas com dados de cliente possuem coluna `client_id`.
- RLS garante que um usuário **só acessa dados do seu próprio cliente**.
- Função `user_belongs_to_client(_client_id, _user_id)` valida pertencimento.

### Políticas de `ai_activations`

| Operação | Política | Regra |
|---|---|---|
| **SELECT** | Membros do cliente | `user_belongs_to_client(client_id, auth.uid())` |
| **INSERT** | Membros do cliente | `user_belongs_to_client(client_id, auth.uid())` |
| **UPDATE** | ❌ Não permitido | — |
| **DELETE** | ❌ Não permitido | — |

### Políticas de `lead_ai_activations`

| Operação | Política | Regra |
|---|---|---|
| **SELECT** | Membros do cliente | `user_belongs_to_client(client_id, auth.uid())` |
| **INSERT** | Membros do cliente | `user_belongs_to_client(client_id, auth.uid())` |
| **UPDATE** | Membros do cliente | `user_belongs_to_client(client_id, auth.uid())` |
| **DELETE** | ❌ Não permitido | — |

### Funções de Segurança

| Função | Tipo | Descrição |
|---|---|---|
| `has_role(_user_id, _role)` | SECURITY DEFINER | Verifica se usuário possui role específica |
| `is_admin(_user_id)` | SECURITY DEFINER | Verifica se é `superadmin` ou `iara_admin` |
| `user_belongs_to_client(_client_id, _user_id)` | SECURITY DEFINER | Verifica pertencimento ao cliente |
| `get_user_client_id(_user_id)` | SECURITY DEFINER | Retorna o `client_id` do usuário |

### Hierarquia de Roles

| Role | Nível | Permissões |
|---|---|---|
| `superadmin` | 1 | Acesso total ao sistema, todos os clientes |
| `iara_admin` | 2 | Administração da plataforma I.ARA |
| `gestor` | 3 | Gestão completa do cliente (leads, IAs, pools, usuários) |
| `marketing` | 4 | Acesso a campanhas, analytics e IAs de marketing |
| `vendedor` | 5 | Acesso restrito a leads atribuídos (`assigned_to`) |

---

## 9. Referência de Planos

| Plano | Preço/mês | Pools Inclusos | Limite Usuários | Setup |
|---|---|---|---|---|
| **ESSENCIAL** | R$ 999 | 450 | 2 | R$ 0 |
| **GROWTH** | R$ 1.499 | 1.000 | 5 | R$ 0 |
| **PRO** | R$ 2.399 | 2.000 | 8 | R$ 0 |

---

## 10. Arquivos de Referência no Código

| Arquivo | Conteúdo |
|---|---|
| `src/lib/aiTypes.ts` | Tipos de IA, configurações, governança por plano |
| `src/lib/pools.ts` | Lógica de pools, cálculos, validações, alertas |
| `src/lib/plans.ts` | Definição de planos, preços, limites |
| `src/integrations/supabase/types.ts` | Schema do banco (auto-gerado) |

---

*Documento gerado em Março/2026 — I.ARA Scale v2.0*
