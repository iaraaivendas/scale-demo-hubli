import { useEffect, useState, useCallback } from 'react';
import { 
  realtimeEventBus, 
  type RealtimeEvent, 
  type RealtimeEventType 
} from '@/lib/realtimeEvents';

interface UseRealtimeOptions {
  eventTypes?: RealtimeEventType[];
  onEvent?: (event: RealtimeEvent) => void;
  debounceMs?: number;
}

export function useRealtimeEvents(options: UseRealtimeOptions = {}) {
  const { 
    eventTypes = [], 
    onEvent, 
    debounceMs = 0 
  } = options;

  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const handleEvent = (event: RealtimeEvent) => {
      if (debounceMs > 0) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setLastEvent(event);
          setEventCount(c => c + 1);
          onEvent?.(event);
        }, debounceMs);
      } else {
        setLastEvent(event);
        setEventCount(c => c + 1);
        onEvent?.(event);
      }
    };

    // Subscribe to specific event types or all events
    const unsubscribes = eventTypes.length > 0
      ? eventTypes.map(type => realtimeEventBus.subscribe(type, handleEvent))
      : [realtimeEventBus.subscribe('*', handleEvent)];

    return () => {
      unsubscribes.forEach(unsub => unsub());
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [eventTypes, onEvent, debounceMs]);

  return {
    lastEvent,
    eventCount,
    history: realtimeEventBus.getHistory(),
  };
}

// Hook for widget-specific updates
export function useWidgetUpdate(dataKey: string) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Map dataKey to relevant event types
  const getRelevantEvents = useCallback((): RealtimeEventType[] => {
    const keyMappings: Record<string, RealtimeEventType[]> = {
      // Financial
      monthlyRevenue: ['payment:new', 'payment:updated'],
      yearlyRevenue: ['payment:new', 'payment:updated'],
      revenueHistory: ['payment:new', 'payment:updated'],
      mrr: ['payment:new', 'payment:updated'],
      arr: ['payment:new', 'payment:updated'],
      
      // Marketing
      totalLeads: ['lead:new', 'campaign:updated'],
      conversionRate: ['lead:new', 'campaign:updated'],
      avgCPL: ['campaign:updated'],
      roas: ['campaign:updated'],
      leadsOverTime: ['lead:new'],
      channelDistribution: ['lead:new'],
      leadsByCampaign: ['lead:new', 'campaign:updated'],
      campaignPerformance: ['campaign:updated'],
      
      // Goals
      monthlyGoalProgress: ['payment:new', 'goal:progress'],
      yearlyGoalProgress: ['payment:new', 'goal:progress'],
      
      // Pools
      poolsUsage: ['pools:consumed', 'pools:purchased'],
    };

    return keyMappings[dataKey] || [];
  }, [dataKey]);

  useRealtimeEvents({
    eventTypes: getRelevantEvents(),
    onEvent: () => {
      setIsUpdating(true);
      setLastUpdate(new Date());
      
      // Reset updating state after animation
      setTimeout(() => setIsUpdating(false), 1000);
    },
    debounceMs: 500,
  });

  return {
    isUpdating,
    lastUpdate,
  };
}

// Hook for simulating events (dev/demo only)
export function useRealtimeSimulator() {
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback((intervalMs = 10000, probability = 0.3) => {
    import('@/lib/realtimeSimulator').then(({ startSimulator }) => {
      startSimulator({ intervalMs, eventProbability: probability });
      setIsRunning(true);
    });
  }, []);

  const stop = useCallback(() => {
    import('@/lib/realtimeSimulator').then(({ stopSimulator }) => {
      stopSimulator();
      setIsRunning(false);
    });
  }, []);

  const simulateEvent = useCallback((eventType: 'payment' | 'campaign' | 'pools' | 'lead' | 'alert') => {
    import('@/lib/realtimeSimulator').then(({ simulateEvents }) => {
      simulateEvents[eventType]();
    });
  }, []);

  useEffect(() => {
    return () => {
      import('@/lib/realtimeSimulator').then(({ stopSimulator }) => {
        stopSimulator();
      });
    };
  }, []);

  return {
    isRunning,
    start,
    stop,
    simulateEvent,
  };
}
