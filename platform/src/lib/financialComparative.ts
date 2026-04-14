// I.ARA Scale - Financial Comparative Calculations
// Módulo para cálculos comparativos anuais e mensais

import {
  getPayments,
  safeDivide,
  percent,
  getCurrentMonthReference,
  getPreviousMonthReference,
  getDaysInMonth,
  getDaysPassedInMonth,
  type Payment,
} from './financialData';

// =====================================
// TIPOS
// =====================================

export interface MonthlyRevenueData {
  monthReference: string;
  monthLabel: string;
  monthIndex: number;
  year: number;
  revenueCentavos: number;
  revenueReais: number;
  accumulatedCentavos: number;
  accumulatedReais: number;
}

export interface YearlyComparison {
  year: number;
  months: MonthlyRevenueData[];
  totalCentavos: number;
  totalReais: number;
}

export interface MonthlyVariation {
  currentMonthRevenueCentavos: number;
  currentMonthRevenueReais: number;
  currentMonthLabel: string;
  previousMonthRevenueCentavos: number;
  previousMonthRevenueReais: number;
  previousMonthLabel: string;
  absoluteVariationCentavos: number;
  absoluteVariationReais: number;
  percentualVariation: number;
  isPositive: boolean;
}

export interface ComparativeFinancialData {
  yearlyData: YearlyComparison;
  accumulatedRevenueData: MonthlyRevenueData[];
  monthlyVariation: MonthlyVariation;
  yearlyRevenueCentavos: number;
  yearlyRevenueReais: number;
}

// =====================================
// CONSTANTES
// =====================================

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_LABELS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// =====================================
// FUNÇÕES AUXILIARES
// =====================================

function centavosToReais(centavos: number): number {
  return centavos / 100;
}

function getMonthReferenceFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthReference(monthRef: string): { year: number; month: number } {
  const [year, month] = monthRef.split('-').map(Number);
  return { year, month };
}

// =====================================
// CÁLCULO DE RECEITA MENSAL
// =====================================

/**
 * Calcula a receita de um mês específico em centavos
 * Soma todos os pagamentos com status "paid" no período
 */
export function calculateMonthRevenueFromPayments(
  clientId: string, 
  monthRef: string
): number {
  const payments = getPayments(clientId);
  const { year, month } = parseMonthReference(monthRef);
  
  return payments
    .filter(p => {
      if (p.status !== 'paid') return false;
      const paymentDate = new Date(p.paymentDate);
      return paymentDate.getFullYear() === year && (paymentDate.getMonth() + 1) === month;
    })
    .reduce((sum, p) => sum + p.amountCentavos, 0);
}

// =====================================
// DADOS ANUAIS COM ACUMULADO
// =====================================

/**
 * Gera dados de receita por mês do ano, incluindo acumulado
 */
export function getYearlyRevenueWithAccumulated(
  clientId: string,
  year: number = new Date().getFullYear()
): YearlyComparison {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const months: MonthlyRevenueData[] = [];
  let accumulatedCentavos = 0;
  let totalCentavos = 0;
  
  for (let month = 1; month <= 12; month++) {
    // Se é o ano atual, só calcula até o mês atual
    if (year === currentYear && month > currentMonth) {
      break;
    }
    
    const monthRef = `${year}-${String(month).padStart(2, '0')}`;
    const revenueCentavos = calculateMonthRevenueFromPayments(clientId, monthRef);
    
    accumulatedCentavos += revenueCentavos;
    totalCentavos += revenueCentavos;
    
    months.push({
      monthReference: monthRef,
      monthLabel: MONTH_LABELS[month - 1],
      monthIndex: month,
      year,
      revenueCentavos,
      revenueReais: centavosToReais(revenueCentavos),
      accumulatedCentavos,
      accumulatedReais: centavosToReais(accumulatedCentavos),
    });
  }
  
  return {
    year,
    months,
    totalCentavos,
    totalReais: centavosToReais(totalCentavos),
  };
}

// =====================================
// VARIAÇÃO MENSAL
// =====================================

/**
 * Calcula a variação entre o mês atual e o mês anterior
 * Retorna tanto valor absoluto quanto percentual
 */
export function calculateMonthlyVariation(clientId: string): MonthlyVariation {
  const currentMonth = getCurrentMonthReference();
  const previousMonth = getPreviousMonthReference(currentMonth);
  
  const { month: currentMonthNum } = parseMonthReference(currentMonth);
  const { month: previousMonthNum } = parseMonthReference(previousMonth);
  
  const currentMonthRevenue = calculateMonthRevenueFromPayments(clientId, currentMonth);
  const previousMonthRevenue = calculateMonthRevenueFromPayments(clientId, previousMonth);
  
  const absoluteVariation = currentMonthRevenue - previousMonthRevenue;
  
  // Evita divisão por zero
  let percentualVariation = 0;
  if (previousMonthRevenue !== 0) {
    percentualVariation = percent(absoluteVariation, previousMonthRevenue);
  }
  
  // Arredonda para 2 casas decimais
  percentualVariation = Math.round(percentualVariation * 100) / 100;
  
  return {
    currentMonthRevenueCentavos: currentMonthRevenue,
    currentMonthRevenueReais: centavosToReais(currentMonthRevenue),
    currentMonthLabel: MONTH_LABELS_FULL[currentMonthNum - 1],
    previousMonthRevenueCentavos: previousMonthRevenue,
    previousMonthRevenueReais: centavosToReais(previousMonthRevenue),
    previousMonthLabel: MONTH_LABELS_FULL[previousMonthNum - 1],
    absoluteVariationCentavos: absoluteVariation,
    absoluteVariationReais: centavosToReais(absoluteVariation),
    percentualVariation,
    isPositive: absoluteVariation >= 0,
  };
}

// =====================================
// DADOS COMPLETOS DO DASHBOARD FINANCEIRO
// =====================================

/**
 * Retorna todos os dados necessários para o dashboard financeiro comparativo
 */
export function getComparativeFinancialData(
  clientId: string,
  year: number = new Date().getFullYear()
): ComparativeFinancialData {
  const yearlyData = getYearlyRevenueWithAccumulated(clientId, year);
  const monthlyVariation = calculateMonthlyVariation(clientId);
  
  // Dados de receita acumulada para o gráfico
  const accumulatedRevenueData = yearlyData.months;
  
  return {
    yearlyData,
    accumulatedRevenueData,
    monthlyVariation,
    yearlyRevenueCentavos: yearlyData.totalCentavos,
    yearlyRevenueReais: yearlyData.totalReais,
  };
}

// =====================================
// FORMATAÇÃO PARA EXIBIÇÃO
// =====================================

/**
 * Formata valor em centavos para string em reais (formato brasileiro)
 */
export function formatCurrencyBRL(centavos: number): string {
  const reais = centavosToReais(centavos);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

/**
 * Formata valor numérico em reais para string (formato brasileiro)
 */
export function formatReaisBRL(reais: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

/**
 * Formata variação percentual com 2 casas decimais e sinal
 */
export function formatVariationPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Formata variação absoluta com sinal
 */
export function formatVariationAbsolute(centavos: number): string {
  const sign = centavos > 0 ? '+' : '';
  return `${sign}${formatCurrencyBRL(Math.abs(centavos))}`;
}
