

## Plano: Criar documento de Regras de Planos e Pools Adicionais

Criar o arquivo `docs/regras-planos-pools.md` com todas as regras comerciais extraídas do código e banco de dados.

### Arquivo a criar

**`docs/regras-planos-pools.md`** contendo:

1. **Planos e Preços** — Tabela comparativa dos 3 planos (Essencial R$999/450 pools/2 users, Growth R$1.499/1.000 pools/5 users, Pro R$2.399/2.000 pools/8 users), features por plano, sem taxa de setup, regras de upgrade/downgrade.

2. **Pools Adicionais** — Pacotes (+500 por R$990, +1.000 por R$1.790), limite de 1.000 extras/mês, lógica de validação (`canPurchasePoolPackage`), fluxo de compra com registro em `extra_pools` e `pool_transactions`, regra de upsell obrigatório quando limite é atingido.

3. **Cálculo de faturamento mensal** — Fórmula `total = plano + pools_adicionais`, mapeamento para tabelas `subscriptions` e `payments`.

4. **Referências de código** — Arquivos-fonte: `src/lib/plans.ts`, `src/lib/pools.ts`, `src/components/PoolsPurchaseModal.tsx`.

### Detalhes técnicos
- Um único arquivo `.md` em `docs/regras-planos-pools.md`
- Conteúdo extraído dos arquivos de código já fornecidos e schema do banco
- Nenhuma alteração em código existente

