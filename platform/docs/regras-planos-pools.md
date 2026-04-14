# I.ARA Scale — Regras de Planos, Preços e Pools Adicionais

> Fonte única de verdade para regras comerciais de planos e pools.  
> Última atualização: 2026-03-03

---

## 1. Planos e Preços

### 1.1 Tabela Comparativa

| Característica | Essencial | Growth ⭐ | Pro |
|---|---|---|---|
| **Nome exibido** | I.ARA Essencial | I.ARA Growth | I.ARA Pro |
| **Mensalidade** | R$ 999,00 | R$ 1.499,00 | R$ 2.399,00 |
| **Pools inclusos/mês** | 450 | 1.000 | 2.000 |
| **Limite de usuários** | 2 | 5 | 8 |
| **Taxa de setup** | R$ 0 | R$ 0 | R$ 0 |
| **Plano recomendado** | Não | ✅ Sim | Não |

### 1.2 Features por Plano

#### Essencial
- 450 pools/mês
- IA Comercial WhatsApp
- IA Reativação
- Dashboard básico
- Integrações CRM

#### Growth (inclui tudo do Essencial)
- 1.000 pools/mês
- WhatsApp com Áudio
- IA Performance
- **Motor Score Preditivo de Upsell & Cross-Sell** (acesso completo aos 4 sinais)
- Analytics Avançado

#### Pro (inclui tudo do Growth)
- 2.000 pools/mês
- Copy Marketing IA
- Propostas Automáticas
- Forecast Comercial
- API Dedicada
- **Motor Score Preditivo de Upsell & Cross-Sell** (acesso completo)

### 1.3 Regras de Upgrade / Downgrade

| Função | Lógica |
|---|---|
| `getNextPlan(planId)` | ESSENCIAL → GROWTH → PRO → `null` |
| `getPreviousPlan(planId)` | PRO → GROWTH → ESSENCIAL → `null` |

- **Upgrade**: altera o registro em `subscriptions` e sincroniza `clients.plan`, `clients.pools_included` e `clients.users_limit` via trigger `sync_plan_limits`.
- **Downgrade**: mesma mecânica; limites são reduzidos imediatamente.
- PRO é o plano máximo — não há upgrade além dele.

### 1.4 Mapeamento no Banco de Dados

**Tabela `subscriptions`**

| Coluna | Tipo | Default |
|---|---|---|
| `plan` | `plan_id` enum | `'ESSENCIAL'` |
| `monthly_fee_centavos` | integer | `99900` (R$ 999) |
| `pools_included` | integer | `450` |
| `users_limit` | integer | `2` |
| `status` | `subscription_status` | `'active'` |

**Tabela `clients`** (espelho sincronizado)

| Coluna | Tipo | Default |
|---|---|---|
| `plan` | `plan_id` enum | `'ESSENCIAL'` |
| `pools_included` | integer | `450` |
| `pools_extra` | integer | `0` |
| `pools_used` | integer | `0` |
| `users_limit` | integer | `2` |

**Enum `plan_id`**: `'ESSENCIAL' | 'GROWTH' | 'PRO'`

---

## 2. Pools Adicionais

### 2.1 Pacotes Disponíveis

| Pacote | Quantidade | Preço | Preço (centavos) |
|---|---|---|---|
| `pack_500` | +500 pools | R$ 990,00 | 99.000 |
| `pack_1000` | +1.000 pools | R$ 1.790,00 | 179.000 |

### 2.2 Regra de Limite

```
MAX_ADDITIONAL_POOLS_PER_MONTH = 1.000
```

- O total de pools adicionais contratados no mês **não pode ultrapassar 1.000**.
- Esse limite é **por cliente**, **por mês**.
- Quando o limite é atingido, o sistema exibe **upsell obrigatório** (upgrade de plano).

### 2.3 Lógica de Validação

**Função `canPurchasePoolPackage(currentAdditional, packageSize)`**

```
SE (currentAdditional + packageSize) > 1.000:
  SE remaining = 0:
    → BLOQUEADO + requiresUpsell = true
    → Mensagem: "Upsell obrigatório: faça upgrade do plano"
  SENÃO:
    → BLOQUEADO
    → Mensagem: "Pode adicionar no máximo mais {remaining} pools"
SENÃO:
  → PERMITIDO
  → Mensagem: "Pacote disponível para compra"
```

### 2.4 Fluxo de Compra

```
1. Usuário abre PoolsPurchaseModal
2. Sistema calcula pacotes disponíveis via getAvailablePoolPackages()
3. Usuário seleciona pacote (500 ou 1000)
4. Sistema valida via canPurchasePoolPackage()
5. Se aprovado:
   a. Chama função RPC: purchase_additional_pools(_client_id, _month_reference, _price_centavos, _quantity)
   b. Insere registro em tabela extra_pools
   c. Insere registro em pool_transactions (type: 'extra_purchase')
   d. Atualiza clients.pools_extra += quantity
6. Se bloqueado:
   → Exibe mensagem de upsell obrigatório
   → Botão "Fazer Upgrade do Plano"
```

### 2.5 Registro no Banco

**Tabela `extra_pools`**

| Coluna | Tipo | Descrição |
|---|---|---|
| `client_id` | uuid | FK → clients |
| `quantity` | integer | 500 ou 1000 |
| `price_centavos` | integer | 99000 ou 179000 |
| `purchase_date` | timestamptz | Data da compra |
| `month_reference` | text | Mês referência (ex: "2026-03") |

**Tabela `pool_transactions`**

| Coluna | Tipo | Descrição |
|---|---|---|
| `client_id` | uuid | FK → clients |
| `type` | `pool_transaction_type` | `'extra_purchase'` |
| `amount` | integer | Quantidade comprada |
| `balance_after` | integer | Saldo após transação |
| `reference_id` | uuid | FK → extra_pools.id |
| `description` | text | Descrição da operação |

**Enum `pool_transaction_type`**: `'plan_credit' | 'extra_purchase' | 'ai_consume' | 'manual_adjust'`

---

## 3. Cálculo de Faturamento Mensal

### 3.1 Fórmula

```
total_mensal = mensalidade_plano + custo_pools_adicionais
```

**Função `calculateMonthlyTotal(planId, additionalPools)`**

```
SE additionalPools >= 1000 → additionalPrice = R$ 1.790
SE additionalPools >= 500  → additionalPrice = R$ 990
SENÃO                       → additionalPrice = R$ 0

total = planPrice + additionalPrice
```

### 3.2 Exemplos

| Plano | Pools Adicionais | Mensalidade | Extra | **Total** |
|---|---|---|---|---|
| Essencial | 0 | R$ 999 | R$ 0 | **R$ 999** |
| Essencial | +500 | R$ 999 | R$ 990 | **R$ 1.989** |
| Growth | +1.000 | R$ 1.499 | R$ 1.790 | **R$ 3.289** |
| Pro | +500 | R$ 2.399 | R$ 990 | **R$ 3.389** |
| Pro | +1.000 | R$ 2.399 | R$ 1.790 | **R$ 4.189** |

### 3.3 Tabela `payments`

| Coluna | Tipo | Descrição |
|---|---|---|
| `client_id` | uuid | FK → clients |
| `amount_centavos` | integer | Valor em centavos |
| `type` | `payment_type` | `'subscription'` ou `'extra_pools'` |
| `status` | `payment_status` | `'paid' | 'pending' | 'failed'` |
| `payment_date` | timestamptz | Data do pagamento |

---

## 4. Validação de Usuários

**Função `canAddMoreUsers(currentUsers, planId)`**

```
SE currentUsers >= plan.userLimit:
  → BLOQUEADO
  → "Limite de {userLimit} usuários atingido. Faça upgrade."
SENÃO:
  → PERMITIDO
  → "Pode adicionar mais {remaining} usuário(s)."
```

---

## 5. Motor Score Preditivo de Upsell & Cross-Sell

> Disponível apenas nos planos **GROWTH** e **PRO**. Plano ESSENCIAL exibe card de upsell para upgrade.

### 5.1 Fórmula Normalizada (0–100)

```
score = (intent_signals × 0.35) + (payment_behavior × 0.30) + (tenure_score × 0.20) + (growth_signals × 0.15)
```

### 5.2 Variáveis e Normalização

#### intent_signals (peso 35% — fonte: CRM)

| Evento | Pontuação |
|---|---|
| Consulta sobre produto complementar registrada no CRM | +30pts |
| Reunião de relacionamento realizada | +20pts |
| Elogio ao suporte registrado | +10pts |
| **Máximo** | **100pts** |

#### payment_behavior (peso 30% — fonte: ERP)

| Condição | Pontuação |
|---|---|
| Pagamentos em dia + recorrência mensal | 100pts (base) |
| Atraso detectado | -20pts por ocorrência |
| Irregularidade de compra (recorrência < 3 meses) | -10pts |

#### tenure_score (peso 20% — fonte: ERP/CRM)

| Tempo na base | Pontuação |
|---|---|
| 0–3 meses | 20pts |
| 3–6 meses | 50pts |
| 6–12 meses | 75pts |
| 12+ meses | 100pts |

#### growth_signals (peso 15% — fonte: CRM)

| Sinal | Pontuação |
|---|---|
| Nova filial detectada no perfil | +40pts |
| Aumento de equipe detectado | +30pts |
| Sem dados de crescimento | 0pts |

### 5.3 Thresholds e Alertas

| Score | Nível | Ação |
|---|---|---|
| < 75 | — | Nenhuma ação |
| 75–84 | `warming` | Alerta no AlertsPanel, monitoramento ativo |
| 85–100 | `ready` | Alerta com handoff imediato para o vendedor |

### 5.4 Classificação Upsell vs Cross-Sell

**Regra automática:**
- Se `intent_signals` aponta para o **mesmo produto/plano** atual do cliente → `opportunity_type: 'upsell'`
- Se `intent_signals` aponta para **produto diferente ou complementar** → `opportunity_type: 'cross_sell'`

### 5.5 Estrutura do Alerta de Oportunidade

```typescript
{
  opportunity_type: 'upsell' | 'cross_sell',
  score: number,            // 0–100
  level: 'warming' | 'ready',
  suggested_script: string, // Script sugerido para abordagem
  lead_id: string,
  triggered_at: timestamp
}
```

### 5.6 Scripts Sugeridos

| Tipo | Foco do Script |
|---|---|
| **Upsell** | Upgrade de volume/plano, comparativo de ROI atual vs potencial, argumento de escala |
| **Cross-sell** | Produto complementar, problema que ele resolve, sinergia com o que o cliente já usa |

### 5.7 Notificação

- Alerta aparece **exclusivamente** no dashboard do I.ARA (`AlertsPanel`)
- Badge visual diferenciado: **↑ ArrowUpCircle** para Upsell / **⊞ LayoutGrid** para Cross-sell
- **NÃO** gera notificação por WhatsApp nem relatório automático

### 5.8 Interfaces de Integração de Dados

```typescript
interface ERPData {
  client_id: string
  payment_history: PaymentRecord[]
  purchase_recurrence: number
  contract_start_date: string
}

interface CRMData {
  client_id: string
  intent_events: IntentEvent[]
  growth_signals: GrowthSignal[]
  current_product: string
  complementary_products: string[]
}
```

As fontes são **ERP próprio via API REST** e **CRM (HubSpot ou Pipedrive)**. Todos os dados são normalizados antes de entrar na fórmula.

### 5.9 Disponibilidade por Plano

| Plano | Acesso |
|---|---|
| **ESSENCIAL** | ❌ Bloqueado — exibe card de upsell para upgrade |
| **GROWTH** | ✅ Acesso completo (4 sinais) |
| **PRO** | ✅ Acesso completo (4 sinais) |

Função de gating: `isPredictiveScoreAvailable(planId)` — retorna `true` para GROWTH e PRO.

---

## 6. Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/revenueScorer.ts` | Motor Score Preditivo, fórmula, pesos, classificação Upsell/Cross-sell, simulação ERP/CRM |
| `src/lib/alertEngine.ts` | Tipos `upsell_opportunity` e `cross_sell_opportunity`, thresholds, cooldowns |
| `src/lib/realtimeEvents.ts` | Eventos de alerta com `opportunity_type` e `suggested_script` |
| `src/lib/plans.ts` | Definição de planos, preços, features, funções auxiliares |
| `src/lib/pools.ts` | Lógica matemática de pools, validações, alertas, status |
| `src/components/widgets/AlertsPanel.tsx` | UI de alertas com badges visuais para Upsell/Cross-sell |
| `src/components/PoolsPurchaseModal.tsx` | UI de compra de pools adicionais |
| `src/components/PlanDashboard.tsx` | Dashboard de plano do cliente |
| `src/components/PoolsStatusCard.tsx` | Card de status de pools |
| `src/components/PoolsIndicator.tsx` | Indicador visual de consumo |

---

## 7. Funções RPC no Banco

| Função | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `purchase_additional_pools` | `_client_id, _month_reference, _price_centavos, _quantity` | boolean | Registra compra atômica |
| `consume_pool` | `_client_id, _description` | boolean | Consome 1 pool atomicamente |
| `can_activate_ai` | `_client_id` | boolean | Verifica se há pools disponíveis |

---

*Documento atualizado em Março/2026 — I.ARA Scale v2.0 (Motor Score Preditivo v2)*
