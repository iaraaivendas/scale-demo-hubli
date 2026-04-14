// ============================================================
// I.ARA Scale - Realtime Event Simulator
// Simula eventos em tempo real para demonstração/protótipo
// ============================================================

import {
  realtimeEventBus,
  type PaymentEventPayload,
  type CampaignEventPayload,
  type PoolsEventPayload,
  type LeadEventPayload,
  type AlertEventPayload,
} from './realtimeEvents';

interface SimulatorConfig {
  enabled: boolean;
  intervalMs: number;
  eventProbability: number; // 0-1, probability of event each interval
}

const DEFAULT_CONFIG: SimulatorConfig = {
  enabled: false,
  intervalMs: 10000, // 10 seconds
  eventProbability: 0.3, // 30% chance each interval
};

let simulatorInterval: NodeJS.Timeout | null = null;
let currentConfig = { ...DEFAULT_CONFIG };

// ============================================================
// Event Generators
// ============================================================

const DEMO_CLIENT_ID = 'demo-client-001';
const CHANNELS = ['Meta Ads', 'Google Ads', 'LinkedIn', 'Email', 'Organic'];
const CAMPAIGN_NAMES = [
  'Campanha Verão 2025',
  'Black Friday',
  'Lançamento Produto X',
  'Remarketing Q1',
  'Institucional',
];

function generateRandomPaymentEvent(): void {
  const payload: PaymentEventPayload = {
    clientId: DEMO_CLIENT_ID,
    amountCentavos: Math.floor(Math.random() * 500000) + 50000, // 500 - 5500 reais
    type: Math.random() > 0.8 ? 'extra_pools' : 'subscription',
  };
  realtimeEventBus.publish('payment:new', payload, 'simulation');
}

function generateRandomCampaignEvent(): void {
  const payload: CampaignEventPayload = {
    clientId: DEMO_CLIENT_ID,
    campaignId: `camp_${Math.floor(Math.random() * 5) + 1}`,
    leadsChange: Math.floor(Math.random() * 5) + 1,
    revenueChangeCentavos: Math.floor(Math.random() * 100000) + 10000,
  };
  realtimeEventBus.publish('campaign:updated', payload, 'simulation');
}

function generateRandomPoolsEvent(): void {
  const consumed = Math.floor(Math.random() * 50) + 5;
  const payload: PoolsEventPayload = {
    clientId: DEMO_CLIENT_ID,
    poolsConsumed: consumed,
    totalUsed: 1000 + consumed, // Simulating progressive usage
    totalAvailable: 3200,
  };
  realtimeEventBus.publish('pools:consumed', payload, 'simulation');
}

function generateRandomLeadEvent(): void {
  const payload: LeadEventPayload = {
    clientId: DEMO_CLIENT_ID,
    campaignId: `camp_${Math.floor(Math.random() * 5) + 1}`,
    channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
  };
  realtimeEventBus.publish('lead:new', payload, 'simulation');
}

function generateRandomAlertEvent(): void {
  const alertTypes: AlertEventPayload['type'][] = ['goal', 'pools', 'revenue', 'roi'];
  const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  
  const alertConfigs: Partial<Record<AlertEventPayload['type'], Partial<AlertEventPayload>>> = {
    goal: {
      level: Math.random() > 0.5 ? 'warning' : 'info',
      message: 'Meta mensal atingiu 85% do objetivo',
      value: 85,
      threshold: 80,
    },
    pools: {
      level: Math.random() > 0.7 ? 'critical' : 'warning',
      message: 'Consumo de pools atingiu 92%',
      value: 92,
      threshold: 90,
    },
    revenue: {
      level: 'warning',
      message: 'Queda de 15% na receita comparado ao mês anterior',
      value: -15,
      threshold: -10,
    },
    roi: {
      level: 'critical',
      message: 'ROI negativo detectado em campanha ativa',
      value: -5,
      threshold: 0,
    },
  };

  const config = alertConfigs[type];
  if (!config) return;
  const payload: AlertEventPayload = {
    type,
    level: config.level as AlertEventPayload['level'],
    message: config.message!,
    value: config.value!,
    threshold: config.threshold!,
  };
  
  realtimeEventBus.publish('alert:triggered', payload, 'simulation');
}

// ============================================================
// Simulator Control
// ============================================================

function runSimulationTick(): void {
  if (Math.random() > currentConfig.eventProbability) return;

  // Randomly choose event type with weighted probabilities
  const rand = Math.random();
  
  if (rand < 0.05) {
    generateRandomPaymentEvent(); // 5% - rare
  } else if (rand < 0.30) {
    generateRandomCampaignEvent(); // 25%
  } else if (rand < 0.55) {
    generateRandomPoolsEvent(); // 25%
  } else if (rand < 0.85) {
    generateRandomLeadEvent(); // 30%
  } else {
    generateRandomAlertEvent(); // 15%
  }
}

export function startSimulator(config?: Partial<SimulatorConfig>): void {
  if (simulatorInterval) {
    stopSimulator();
  }

  currentConfig = { ...DEFAULT_CONFIG, ...config, enabled: true };
  
  console.log('[RealtimeSimulator] Starting with config:', currentConfig);
  
  simulatorInterval = setInterval(runSimulationTick, currentConfig.intervalMs);
}

export function stopSimulator(): void {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    currentConfig.enabled = false;
    console.log('[RealtimeSimulator] Stopped');
  }
}

export function isSimulatorRunning(): boolean {
  return currentConfig.enabled && simulatorInterval !== null;
}

export function getSimulatorConfig(): SimulatorConfig {
  return { ...currentConfig };
}

// ============================================================
// Manual Event Triggers (for testing)
// ============================================================

export const simulateEvents = {
  payment: generateRandomPaymentEvent,
  campaign: generateRandomCampaignEvent,
  pools: generateRandomPoolsEvent,
  lead: generateRandomLeadEvent,
  alert: generateRandomAlertEvent,
};
