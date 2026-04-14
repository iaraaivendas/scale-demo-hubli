// ============================================================
// I.ARA Scale - Alert Engine
// Sistema de alertas em tempo real baseado em thresholds
// ============================================================

import { realtimeEventBus, type AlertEventPayload } from './realtimeEvents';

export interface AlertThreshold {
  id: string;
  type: 'goal' | 'pools' | 'revenue' | 'roi' | 'upsell_opportunity' | 'cross_sell_opportunity';
  metric: string;
  operator: '>=' | '<=' | '>' | '<' | '==';
  value: number;
  level: 'info' | 'warning' | 'critical';
  message: string;
  enabled: boolean;
  cooldownMs: number; // Minimum time between alerts of this type
}

export interface AlertInstance {
  id: string;
  thresholdId: string;
  type: AlertThreshold['type'];
  level: AlertThreshold['level'];
  message: string;
  currentValue: number;
  thresholdValue: number;
  triggeredAt: Date;
  acknowledged: boolean;
  // Opportunity-specific fields
  opportunity_type?: 'upsell' | 'cross_sell';
  suggested_script?: string;
  lead_id?: string;
}

// Default thresholds
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    id: 'goal-80',
    type: 'goal',
    metric: 'monthlyProgress',
    operator: '>=',
    value: 80,
    level: 'info',
    message: 'Meta mensal atingiu 80%! Continue assim!',
    enabled: true,
    cooldownMs: 3600000, // 1 hour
  },
  {
    id: 'goal-100',
    type: 'goal',
    metric: 'monthlyProgress',
    operator: '>=',
    value: 100,
    level: 'info',
    message: '🎉 Meta mensal atingida! Parabéns!',
    enabled: true,
    cooldownMs: 86400000, // 24 hours
  },
  {
    id: 'pools-90',
    type: 'pools',
    metric: 'usagePercent',
    operator: '>=',
    value: 90,
    level: 'warning',
    message: 'Atenção: 90% dos pools foram consumidos',
    enabled: true,
    cooldownMs: 1800000, // 30 min
  },
  {
    id: 'pools-100',
    type: 'pools',
    metric: 'usagePercent',
    operator: '>=',
    value: 100,
    level: 'critical',
    message: '⚠️ Pools esgotados! Adquira mais para continuar operando.',
    enabled: true,
    cooldownMs: 300000, // 5 min
  },
  {
    id: 'revenue-drop',
    type: 'revenue',
    metric: 'monthlyGrowth',
    operator: '<=',
    value: -10,
    level: 'warning',
    message: 'Queda significativa de receita detectada',
    enabled: true,
    cooldownMs: 86400000, // 24 hours
  },
  {
    id: 'roi-negative',
    type: 'roi',
    metric: 'averageROI',
    operator: '<',
    value: 0,
    level: 'critical',
    message: 'ROI negativo em campanhas ativas',
    enabled: true,
    cooldownMs: 3600000, // 1 hour
  },
];

// Storage keys
const THRESHOLDS_KEY = 'iara_alert_thresholds';
const ALERTS_KEY = 'iara_active_alerts';
const COOLDOWNS_KEY = 'iara_alert_cooldowns';

// ============================================================
// Threshold Management
// ============================================================

export function getAlertThresholds(): AlertThreshold[] {
  try {
    const stored = localStorage.getItem(THRESHOLDS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_THRESHOLDS;
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function saveAlertThreshold(threshold: AlertThreshold): void {
  const thresholds = getAlertThresholds();
  const index = thresholds.findIndex(t => t.id === threshold.id);
  
  if (index >= 0) {
    thresholds[index] = threshold;
  } else {
    thresholds.push(threshold);
  }
  
  localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
}

export function toggleThreshold(thresholdId: string, enabled: boolean): void {
  const thresholds = getAlertThresholds();
  const threshold = thresholds.find(t => t.id === thresholdId);
  if (threshold) {
    threshold.enabled = enabled;
    localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
  }
}

// ============================================================
// Alert Management
// ============================================================

export function getActiveAlerts(): AlertInstance[] {
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: AlertInstance[]): void {
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export function acknowledgeAlert(alertId: string): void {
  const alerts = getActiveAlerts();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    saveAlerts(alerts);
  }
}

export function dismissAlert(alertId: string): void {
  const alerts = getActiveAlerts().filter(a => a.id !== alertId);
  saveAlerts(alerts);
}

export function clearAllAlerts(): void {
  saveAlerts([]);
}

// ============================================================
// Cooldown Management
// ============================================================

function getCooldowns(): Record<string, number> {
  try {
    const stored = localStorage.getItem(COOLDOWNS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCooldowns(cooldowns: Record<string, number>): void {
  localStorage.setItem(COOLDOWNS_KEY, JSON.stringify(cooldowns));
}

function isOnCooldown(thresholdId: string, cooldownMs: number): boolean {
  const cooldowns = getCooldowns();
  const lastTriggered = cooldowns[thresholdId];
  
  if (!lastTriggered) return false;
  
  return Date.now() - lastTriggered < cooldownMs;
}

function setCooldown(thresholdId: string): void {
  const cooldowns = getCooldowns();
  cooldowns[thresholdId] = Date.now();
  saveCooldowns(cooldowns);
}

// ============================================================
// Alert Evaluation
// ============================================================

function evaluateCondition(currentValue: number, operator: AlertThreshold['operator'], thresholdValue: number): boolean {
  switch (operator) {
    case '>=': return currentValue >= thresholdValue;
    case '<=': return currentValue <= thresholdValue;
    case '>': return currentValue > thresholdValue;
    case '<': return currentValue < thresholdValue;
    case '==': return currentValue === thresholdValue;
    default: return false;
  }
}

export interface MetricsSnapshot {
  monthlyProgress?: number;
  yearlyProgress?: number;
  usagePercent?: number;
  monthlyGrowth?: number;
  averageROI?: number;
  totalLeads?: number;
}

export function evaluateAlerts(metrics: MetricsSnapshot): AlertInstance[] {
  const thresholds = getAlertThresholds().filter(t => t.enabled);
  const triggeredAlerts: AlertInstance[] = [];
  
  for (const threshold of thresholds) {
    // Check cooldown
    if (isOnCooldown(threshold.id, threshold.cooldownMs)) {
      continue;
    }
    
    // Get current value for metric
    const currentValue = metrics[threshold.metric as keyof MetricsSnapshot];
    if (currentValue === undefined) continue;
    
    // Evaluate condition
    if (evaluateCondition(currentValue, threshold.operator, threshold.value)) {
      const alert: AlertInstance = {
        id: `alert_${Date.now()}_${threshold.id}`,
        thresholdId: threshold.id,
        type: threshold.type,
        level: threshold.level,
        message: threshold.message,
        currentValue,
        thresholdValue: threshold.value,
        triggeredAt: new Date(),
        acknowledged: false,
      };
      
      triggeredAlerts.push(alert);
      setCooldown(threshold.id);
      
      // Publish event
      const eventPayload: AlertEventPayload = {
        type: threshold.type,
        level: threshold.level,
        message: threshold.message,
        value: currentValue,
        threshold: threshold.value,
      };
      realtimeEventBus.publish('alert:triggered', eventPayload, 'local');
    }
  }
  
  // Save new alerts
  if (triggeredAlerts.length > 0) {
    const existingAlerts = getActiveAlerts();
    saveAlerts([...triggeredAlerts, ...existingAlerts].slice(0, 50)); // Keep max 50
  }
  
  return triggeredAlerts;
}

// ============================================================
// Alert Count Helpers
// ============================================================

export function getUnacknowledgedAlertCount(): number {
  return getActiveAlerts().filter(a => !a.acknowledged).length;
}

export function getCriticalAlertCount(): number {
  return getActiveAlerts().filter(a => a.level === 'critical' && !a.acknowledged).length;
}
