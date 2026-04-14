// ============================================================
// I.ARA Scale - Real-Time Event System
// Preparado para WebSockets/SSE no futuro
// ============================================================

export type RealtimeEventType =
  | 'payment:new'
  | 'payment:updated'
  | 'campaign:updated'
  | 'pools:consumed'
  | 'pools:purchased'
  | 'lead:new'
  | 'goal:progress'
  | 'alert:triggered';

export interface RealtimeEvent<T = unknown> {
  id: string;
  type: RealtimeEventType;
  payload: T;
  timestamp: Date;
  source: 'local' | 'server' | 'simulation';
}

export interface PaymentEventPayload {
  clientId: string;
  amountCentavos: number;
  type: 'subscription' | 'extra_pools';
}

export interface CampaignEventPayload {
  clientId: string;
  campaignId: string;
  leadsChange: number;
  revenueChangeCentavos: number;
}

export interface PoolsEventPayload {
  clientId: string;
  poolsConsumed: number;
  totalUsed: number;
  totalAvailable: number;
}

export interface LeadEventPayload {
  clientId: string;
  campaignId: string;
  channel: string;
}

export interface AlertEventPayload {
  type: 'goal' | 'pools' | 'revenue' | 'roi' | 'upsell_opportunity' | 'cross_sell_opportunity';
  level: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  opportunity_type?: 'upsell' | 'cross_sell';
  suggested_script?: string;
  lead_id?: string;
}

// ============================================================
// Event Bus - Pub/Sub Pattern
// ============================================================

type EventCallback<T = unknown> = (event: RealtimeEvent<T>) => void;

class RealtimeEventBus {
  private listeners: Map<RealtimeEventType | '*', Set<EventCallback>> = new Map();
  private eventHistory: RealtimeEvent[] = [];
  private maxHistory = 100;

  subscribe<T>(eventType: RealtimeEventType | '*', callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback as EventCallback);
    };
  }

  publish<T>(type: RealtimeEventType, payload: T, source: RealtimeEvent['source'] = 'local'): void {
    const event: RealtimeEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: new Date(),
      source,
    };

    // Store in history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Notify specific listeners
    this.listeners.get(type)?.forEach(callback => callback(event));

    // Notify wildcard listeners
    this.listeners.get('*')?.forEach(callback => callback(event));
  }

  getHistory(limit = 10): RealtimeEvent[] {
    return this.eventHistory.slice(0, limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}

// Singleton instance
export const realtimeEventBus = new RealtimeEventBus();

// ============================================================
// Event Helpers
// ============================================================

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isRecentEvent(event: RealtimeEvent, maxAgeMs = 5000): boolean {
  return Date.now() - event.timestamp.getTime() < maxAgeMs;
}
