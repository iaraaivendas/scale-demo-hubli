// I.ARA Scale - Financial Data Layer
// REGRA ABSOLUTA: Todos valores monetários em CENTAVOS (inteiro)

// =====================================
// TIPOS DE DADOS FINANCEIROS
// =====================================

export interface Payment {
  id: string;
  clientId: string;
  amountCentavos: number; // SEMPRE EM CENTAVOS
  status: 'paid' | 'pending' | 'failed';
  paymentDate: string; // ISO date
  type: 'subscription' | 'extra_pools';
}

export interface Subscription {
  clientId: string;
  plan: 'ESSENCIAL' | 'GROWTH' | 'PRO';
  monthlyFeeCentavos: number; // SEMPRE EM CENTAVOS
  poolsIncluded: number;
  usersLimit: number;
  status: 'active' | 'canceled';
  startDate: string; // ISO date
  cancelDate?: string; // ISO date
}

export interface ExtraPools {
  id: string;
  clientId: string;
  quantity: 500 | 1000;
  priceCentavos: number; // SEMPRE EM CENTAVOS
  monthReference: string; // YYYY-MM
  purchaseDate: string; // ISO date
}

export interface CampaignFinancial {
  id: string;
  clientId: string;
  name: string;
  channel: string;
  spendCentavos: number; // SEMPRE EM CENTAVOS
  leads: number;
  conversions: number;
  revenueAttributedCentavos: number; // SEMPRE EM CENTAVOS
  date: string; // ISO date
}

export interface Goals {
  clientId: string;
  monthlyGoalCentavos: number; // SEMPRE EM CENTAVOS
  annualGoalCentavos: number; // SEMPRE EM CENTAVOS
}

export interface PoolsUsage {
  clientId: string;
  monthReference: string; // YYYY-MM
  poolsUsed: number;
}

// =====================================
// FUNÇÕES MATEMÁTICAS BASE (OBRIGATÓRIAS)
// =====================================

/**
 * Divisão segura - evita divisão por zero
 */
export function safeDivide(a: number, b: number): number {
  if (b === 0) return 0;
  return a / b;
}

/**
 * Calcula porcentagem de forma segura
 */
export function percent(part: number, total: number): number {
  return safeDivide(part, total) * 100;
}

/**
 * Converte centavos para reais formatado
 * APENAS para exibição, NUNCA para cálculos
 */
export function money(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

/**
 * Formata valor em reais com símbolo
 */
export function formatCurrency(centavos: number): string {
  return `R$ ${(centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formata porcentagem para exibição
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata ROI para exibição no dashboard
 * Exibe sempre 2 casas decimais, com sinal + ou -, SEM símbolo de porcentagem
 * @example formatROI(418.6043) → "+418.60"
 * @example formatROI(-12.453) → "-12.45"
 * @example formatROI(0) → "0.00"
 */
export function formatROI(value: number): string {
  if (value === 0) return "0.00";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

/**
 * Retorna a classe de cor CSS para um valor de ROI
 * Positivo → verde (text-primary), Negativo → vermelho (text-destructive), Zero → cinza (text-muted-foreground)
 */
export function getROIColorClass(value: number): string {
  if (value > 0) return "text-primary";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
}

// =====================================
// STORAGE KEYS
// =====================================

const FINANCIAL_KEYS = {
  payments: 'iara_payments',
  subscriptions: 'iara_subscriptions',
  extraPools: 'iara_extra_pools',
  campaignsFinancial: 'iara_campaigns_financial',
  goals: 'iara_goals',
  poolsUsage: 'iara_pools_usage',
} as const;

// =====================================
// STORAGE HELPERS
// =====================================

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// =====================================
// CRUD - PAYMENTS
// =====================================

export function getPayments(clientId?: string): Payment[] {
  const payments = getItem<Payment[]>(FINANCIAL_KEYS.payments, []);
  return clientId ? payments.filter(p => p.clientId === clientId) : payments;
}

export function savePayment(payment: Payment): void {
  const payments = getPayments();
  const index = payments.findIndex(p => p.id === payment.id);
  if (index >= 0) {
    payments[index] = payment;
  } else {
    payments.push(payment);
  }
  setItem(FINANCIAL_KEYS.payments, payments);
}

// =====================================
// CRUD - SUBSCRIPTIONS
// =====================================

export function getSubscriptions(clientId?: string): Subscription[] {
  const subscriptions = getItem<Subscription[]>(FINANCIAL_KEYS.subscriptions, []);
  return clientId ? subscriptions.filter(s => s.clientId === clientId) : subscriptions;
}

export function getActiveSubscription(clientId: string): Subscription | undefined {
  return getSubscriptions(clientId).find(s => s.status === 'active');
}

export function saveSubscription(subscription: Subscription): void {
  const subscriptions = getSubscriptions();
  const index = subscriptions.findIndex(s => s.clientId === subscription.clientId);
  if (index >= 0) {
    subscriptions[index] = subscription;
  } else {
    subscriptions.push(subscription);
  }
  setItem(FINANCIAL_KEYS.subscriptions, subscriptions);
}

// =====================================
// CRUD - EXTRA POOLS
// =====================================

export function getExtraPools(clientId?: string, monthReference?: string): ExtraPools[] {
  let pools = getItem<ExtraPools[]>(FINANCIAL_KEYS.extraPools, []);
  if (clientId) pools = pools.filter(p => p.clientId === clientId);
  if (monthReference) pools = pools.filter(p => p.monthReference === monthReference);
  return pools;
}

export function saveExtraPools(extraPools: ExtraPools): void {
  const pools = getItem<ExtraPools[]>(FINANCIAL_KEYS.extraPools, []);
  const index = pools.findIndex(p => p.id === extraPools.id);
  if (index >= 0) {
    pools[index] = extraPools;
  } else {
    pools.push(extraPools);
  }
  setItem(FINANCIAL_KEYS.extraPools, pools);
}

// =====================================
// CRUD - CAMPAIGNS FINANCIAL
// =====================================

export function getCampaignsFinancial(clientId?: string): CampaignFinancial[] {
  const campaigns = getItem<CampaignFinancial[]>(FINANCIAL_KEYS.campaignsFinancial, []);
  return clientId ? campaigns.filter(c => c.clientId === clientId) : campaigns;
}

export function saveCampaignFinancial(campaign: CampaignFinancial): void {
  const campaigns = getCampaignsFinancial();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    campaigns[index] = campaign;
  } else {
    campaigns.push(campaign);
  }
  setItem(FINANCIAL_KEYS.campaignsFinancial, campaigns);
}

// =====================================
// CRUD - GOALS
// =====================================

export function getGoals(clientId: string): Goals | undefined {
  const goals = getItem<Goals[]>(FINANCIAL_KEYS.goals, []);
  return goals.find(g => g.clientId === clientId);
}

export function saveGoals(goals: Goals): void {
  const allGoals = getItem<Goals[]>(FINANCIAL_KEYS.goals, []);
  const index = allGoals.findIndex(g => g.clientId === goals.clientId);
  if (index >= 0) {
    allGoals[index] = goals;
  } else {
    allGoals.push(goals);
  }
  setItem(FINANCIAL_KEYS.goals, allGoals);
}

// =====================================
// CRUD - POOLS USAGE
// =====================================

export function getPoolsUsage(clientId: string, monthReference?: string): PoolsUsage[] {
  let usage = getItem<PoolsUsage[]>(FINANCIAL_KEYS.poolsUsage, []);
  usage = usage.filter(u => u.clientId === clientId);
  if (monthReference) usage = usage.filter(u => u.monthReference === monthReference);
  return usage;
}

export function savePoolsUsage(usage: PoolsUsage): void {
  const allUsage = getItem<PoolsUsage[]>(FINANCIAL_KEYS.poolsUsage, []);
  const index = allUsage.findIndex(u => 
    u.clientId === usage.clientId && u.monthReference === usage.monthReference
  );
  if (index >= 0) {
    allUsage[index] = usage;
  } else {
    allUsage.push(usage);
  }
  setItem(FINANCIAL_KEYS.poolsUsage, allUsage);
}

// =====================================
// DATE HELPERS
// =====================================

export function getCurrentMonthReference(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getPreviousMonthReference(monthRef?: string): string {
  const date = monthRef 
    ? new Date(`${monthRef}-01`) 
    : new Date();
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthStartEnd(monthRef: string): { start: Date; end: Date } {
  const [year, month] = monthRef.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
}

export function getDaysInMonth(monthRef: string): number {
  const { end } = getMonthStartEnd(monthRef);
  return end.getDate();
}

export function getDaysPassedInMonth(monthRef: string): number {
  const now = new Date();
  const currentMonthRef = getCurrentMonthReference();
  
  if (monthRef !== currentMonthRef) {
    return getDaysInMonth(monthRef); // Mês completo
  }
  
  return now.getDate();
}

export function isDateInMonth(date: string, monthRef: string): boolean {
  const { start, end } = getMonthStartEnd(monthRef);
  const d = new Date(date);
  return d >= start && d <= end;
}

export function getYearMonths(year: number = new Date().getFullYear()): string[] {
  return Array.from({ length: 12 }, (_, i) => 
    `${year}-${String(i + 1).padStart(2, '0')}`
  );
}

// =====================================
// ID GENERATOR
// =====================================

export function generateFinancialId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
