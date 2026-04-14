// I.ARA Scale - Pools (Ativações) Logic Module
// Regras matemáticas, limites, bloqueios e comportamento do sistema

import { PLANS, ADDITIONAL_POOLS_PACKAGES, MAX_ADDITIONAL_POOLS_PER_MONTH, type PlanId } from './plans';
import type { Client } from './storage';

// ===========================================
// TIPOS
// ===========================================

export type PoolAlertLevel = 'normal' | 'warning' | 'critical' | 'blocked';

export interface PoolStatus {
  // Valores base
  poolsIncluded: number;
  poolsAdditional: number;
  poolsTotal: number;
  poolsUsed: number;
  poolsRemaining: number;
  
  // Percentual de consumo
  usagePercent: number;
  
  // Status e alertas
  alertLevel: PoolAlertLevel;
  alertMessage: string;
  canActivate: boolean;
  canPurchaseMore: boolean;
  maxAdditionalAllowed: number;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  requiresUpsell: boolean;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  poolsConsumed: number;
  poolsRemaining: number;
}

// ===========================================
// CONSTANTES
// ===========================================

// Preços em centavos
export const POOL_PACKAGE_PRICES_CENTAVOS = {
  500: 99000,  // R$ 990,00
  1000: 179000, // R$ 1.790,00
} as const;

// Thresholds de alerta
export const POOL_THRESHOLDS = {
  WARNING: 70,
  CRITICAL: 90,
  BLOCKED: 100,
} as const;

// ===========================================
// FUNÇÕES MATEMÁTICAS BASE
// ===========================================

/**
 * Divisão segura (evita divisão por zero)
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calcula percentual
 */
export function calculatePercent(part: number, total: number): number {
  return safeDivide(part, total) * 100;
}

/**
 * Garante valor não-negativo
 */
export function ensureNonNegative(value: number): number {
  return Math.max(value, 0);
}

// ===========================================
// CÁLCULOS DE POOLS
// ===========================================

/**
 * Obtém pools inclusos no plano
 */
export function getPoolsIncludedByPlan(planId: PlanId): number {
  return PLANS[planId].poolsIncluded;
}

/**
 * Calcula pools totais disponíveis
 * pools_total = pools_inclusos + pools_adicionais_contratados
 */
export function calculateTotalPools(poolsIncluded: number, poolsAdditional: number): number {
  return poolsIncluded + poolsAdditional;
}

/**
 * Calcula percentual de consumo
 * pct_pools = (pools_consumidos / pools_total) * 100
 */
export function calculateUsagePercent(poolsUsed: number, poolsTotal: number): number {
  if (poolsTotal === 0) return 0;
  return (poolsUsed / poolsTotal) * 100;
}

/**
 * Calcula pools restantes
 * pools_restantes = max(pools_total - pools_consumidos, 0)
 */
export function calculatePoolsRemaining(poolsTotal: number, poolsUsed: number): number {
  return ensureNonNegative(poolsTotal - poolsUsed);
}

/**
 * Determina nível de alerta baseado no percentual
 */
export function getAlertLevel(usagePercent: number): PoolAlertLevel {
  if (usagePercent >= POOL_THRESHOLDS.BLOCKED) return 'blocked';
  if (usagePercent >= POOL_THRESHOLDS.CRITICAL) return 'critical';
  if (usagePercent >= POOL_THRESHOLDS.WARNING) return 'warning';
  return 'normal';
}

/**
 * Retorna mensagem de alerta apropriada
 */
export function getAlertMessage(alertLevel: PoolAlertLevel, usagePercent: number): string {
  switch (alertLevel) {
    case 'blocked':
      return 'Limite de pools atingido. Adquira pools adicionais ou faça upgrade do seu plano.';
    case 'critical':
      return `Alerta crítico: ${usagePercent.toFixed(1)}% dos pools consumidos. Considere adquirir mais pools.`;
    case 'warning':
      return `Atenção: ${usagePercent.toFixed(1)}% dos pools consumidos. Monitore seu consumo.`;
    default:
      return 'Consumo saudável de pools.';
  }
}

// ===========================================
// STATUS COMPLETO DE POOLS
// ===========================================

/**
 * Calcula status completo de pools para um cliente
 */
export function getPoolStatus(client: Client): PoolStatus {
  const poolsIncluded = client.poolsIncluded || PLANS[client.plan as PlanId]?.poolsIncluded || 0;
  const poolsAdditional = client.poolsAdditional || 0;
  const poolsUsed = client.poolsUsed || 0;
  
  const poolsTotal = calculateTotalPools(poolsIncluded, poolsAdditional);
  const poolsRemaining = calculatePoolsRemaining(poolsTotal, poolsUsed);
  const usagePercent = calculateUsagePercent(poolsUsed, poolsTotal);
  const alertLevel = getAlertLevel(usagePercent);
  const alertMessage = getAlertMessage(alertLevel, usagePercent);
  
  // Verificar se pode ativar mais IAs
  const canActivate = poolsUsed < poolsTotal;
  
  // Verificar se pode comprar mais pools
  const maxAdditionalAllowed = MAX_ADDITIONAL_POOLS_PER_MONTH - poolsAdditional;
  const canPurchaseMore = maxAdditionalAllowed > 0;
  
  return {
    poolsIncluded,
    poolsAdditional,
    poolsTotal,
    poolsUsed,
    poolsRemaining,
    usagePercent,
    alertLevel,
    alertMessage,
    canActivate,
    canPurchaseMore,
    maxAdditionalAllowed,
  };
}

// ===========================================
// VALIDAÇÃO DE COMPRA
// ===========================================

/**
 * Valida se pode comprar pacote de pools adicionais
 */
export function canPurchasePoolPackage(
  currentAdditionalPools: number,
  packageSize: 500 | 1000
): PurchaseResult {
  const newTotal = currentAdditionalPools + packageSize;
  
  // Regra: pools_adicionais_contratados NÃO pode ultrapassar 1000
  if (newTotal > MAX_ADDITIONAL_POOLS_PER_MONTH) {
    const remaining = MAX_ADDITIONAL_POOLS_PER_MONTH - currentAdditionalPools;
    
    if (remaining <= 0) {
      return {
        success: false,
        message: 'Upsell obrigatório: faça upgrade do seu plano para mais ativações.',
        requiresUpsell: true,
      };
    }
    
    return {
      success: false,
      message: `Limite de pools adicionais. Você pode adicionar no máximo mais ${remaining} pools este mês.`,
      requiresUpsell: remaining === 0,
    };
  }
  
  return {
    success: true,
    message: `Pacote de +${packageSize} pools disponível para compra.`,
    requiresUpsell: false,
  };
}

/**
 * Retorna pacotes de pools disponíveis para compra
 */
export function getAvailablePoolPackages(currentAdditionalPools: number) {
  return ADDITIONAL_POOLS_PACKAGES.map(pkg => {
    const validation = canPurchasePoolPackage(currentAdditionalPools, pkg.pools as 500 | 1000);
    return {
      ...pkg,
      priceInCentavos: POOL_PACKAGE_PRICES_CENTAVOS[pkg.pools as 500 | 1000],
      available: validation.success,
      message: validation.message,
      requiresUpsell: validation.requiresUpsell,
    };
  });
}

// ===========================================
// VALIDAÇÃO DE ATIVAÇÃO
// ===========================================

/**
 * Valida se pode ativar IA (consumir pool)
 */
export function canActivatePool(
  poolsUsed: number,
  poolsIncluded: number,
  poolsAdditional: number,
  poolCost: number = 1
): ActivationResult {
  const poolsTotal = calculateTotalPools(poolsIncluded, poolsAdditional);
  const poolsRemaining = calculatePoolsRemaining(poolsTotal, poolsUsed);
  
  // Verificar se há pools suficientes
  if (poolsRemaining < poolCost) {
    return {
      success: false,
      message: 'Limite de pools atingido. Adquira pools adicionais ou faça upgrade do seu plano.',
      poolsConsumed: 0,
      poolsRemaining,
    };
  }
  
  return {
    success: true,
    message: `${poolsRemaining - poolCost} pools restantes após ativação.`,
    poolsConsumed: poolCost,
    poolsRemaining: poolsRemaining - poolCost,
  };
}

// ===========================================
// CORES E ESTILOS
// ===========================================

/**
 * Retorna classe de cor baseada no nível de alerta
 */
export function getAlertColorClass(alertLevel: PoolAlertLevel): string {
  switch (alertLevel) {
    case 'blocked':
      return 'text-destructive';
    case 'critical':
      return 'text-destructive';
    case 'warning':
      return 'text-warning';
    default:
      return 'text-primary';
  }
}

/**
 * Retorna classe de cor de fundo baseada no nível de alerta
 */
export function getAlertBgClass(alertLevel: PoolAlertLevel): string {
  switch (alertLevel) {
    case 'blocked':
      return 'bg-destructive/20';
    case 'critical':
      return 'bg-destructive/20';
    case 'warning':
      return 'bg-warning/20';
    default:
      return 'bg-primary/20';
  }
}

/**
 * Retorna classe de cor para barra de progresso
 */
export function getProgressBarClass(alertLevel: PoolAlertLevel): string {
  switch (alertLevel) {
    case 'blocked':
      return 'bg-destructive';
    case 'critical':
      return 'bg-destructive';
    case 'warning':
      return 'bg-warning';
    default:
      return 'bg-primary';
  }
}

// ===========================================
// FORMATAÇÃO
// ===========================================

/**
 * Formata número de pools para exibição
 */
export function formatPoolsDisplay(pools: number): string {
  return pools.toLocaleString('pt-BR');
}

/**
 * Formata percentual de uso para exibição
 */
export function formatUsagePercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}
