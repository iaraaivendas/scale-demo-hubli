import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getClient, type Client } from '@/lib/storage';
import {
  getFinancialMetrics,
  getMarketingMetrics,
  getGoalsMetrics,
  getPoolMetrics,
  getSmartAlerts,
  type FinancialMetrics,
  type MarketingMetrics,
  type GoalsMetrics,
  type PoolMetrics,
  type SmartAlert,
} from '@/lib/dashboardData';
import {
  realtimeEventBus,
  type RealtimeEvent,
  type RealtimeEventType,
} from '@/lib/realtimeEvents';
import {
  evaluateAlerts,
  getActiveAlerts,
  type AlertInstance,
  type MetricsSnapshot,
} from '@/lib/alertEngine';

// ============================================================
// Types
// ============================================================

export interface DataState {
  client: Client | null;
  financial: FinancialMetrics | null;
  marketing: MarketingMetrics | null;
  goals: GoalsMetrics | null;
  pools: PoolMetrics | null;
  alerts: SmartAlert[];
  realtimeAlerts: AlertInstance[];
}

export interface DataUpdateInfo {
  lastUpdate: Date;
  isUpdating: boolean;
  updateSource: 'initial' | 'poll' | 'event' | 'manual';
  affectedKeys: string[];
}

interface DataContextValue {
  // Data state
  data: DataState;
  updateInfo: DataUpdateInfo;
  
  // Data operations
  refreshAll: () => Promise<void>;
  refreshMetric: (key: keyof DataState) => Promise<void>;
  
  // Polling control
  isPollingEnabled: boolean;
  setPollingEnabled: (enabled: boolean) => void;
  pollingInterval: number;
  setPollingInterval: (intervalMs: number) => void;
  
  // Event subscription
  subscribeToEvents: (callback: (event: RealtimeEvent) => void) => () => void;
  
  // Alert management
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

// ============================================================
// Provider
// ============================================================

interface DataProviderProps {
  children: React.ReactNode;
  clientId?: string;
  defaultPollingInterval?: number;
}

const DEMO_CLIENT_ID = 'demo-client-001';

export function DataProvider({
  children,
  clientId = DEMO_CLIENT_ID,
  defaultPollingInterval = 10000, // 10 seconds
}: DataProviderProps) {
  // Data state
  const [data, setData] = useState<DataState>({
    client: null,
    financial: null,
    marketing: null,
    goals: null,
    pools: null,
    alerts: [],
    realtimeAlerts: [],
  });

  // Update tracking
  const [updateInfo, setUpdateInfo] = useState<DataUpdateInfo>({
    lastUpdate: new Date(),
    isUpdating: false,
    updateSource: 'initial',
    affectedKeys: [],
  });

  // Polling state
  const [isPollingEnabled, setPollingEnabled] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(defaultPollingInterval);
  
  // Refs for cleanup
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');

  // ============================================================
  // Data Fetching
  // ============================================================

  const fetchAllData = useCallback(async (): Promise<DataState> => {
    const client = getClient(clientId);
    
    if (!client) {
      return {
        client: null,
        financial: null,
        marketing: null,
        goals: null,
        pools: null,
        alerts: [],
        realtimeAlerts: [],
      };
    }

    const [financial, marketing, goals] = await Promise.all([
      Promise.resolve(getFinancialMetrics(clientId)),
      Promise.resolve(getMarketingMetrics(clientId)),
      Promise.resolve(getGoalsMetrics(clientId)),
    ]);

    const pools = getPoolMetrics(client);
    const alerts = getSmartAlerts(clientId, client);
    const realtimeAlerts = getActiveAlerts();

    return {
      client,
      financial,
      marketing,
      goals,
      pools,
      alerts,
      realtimeAlerts,
    };
  }, [clientId]);

  // ============================================================
  // Refresh Functions
  // ============================================================

  const refreshAll = useCallback(async (source: DataUpdateInfo['updateSource'] = 'manual') => {
    setUpdateInfo(prev => ({ ...prev, isUpdating: true, updateSource: source }));

    try {
      const newData = await fetchAllData();
      const newDataString = JSON.stringify(newData);
      
      // Only update if data actually changed (smart polling)
      if (newDataString !== previousDataRef.current) {
        previousDataRef.current = newDataString;
        
        setData(newData);
        setUpdateInfo({
          lastUpdate: new Date(),
          isUpdating: false,
          updateSource: source,
          affectedKeys: ['client', 'financial', 'marketing', 'goals', 'pools', 'alerts'],
        });

        // Evaluate alerts based on new metrics
        if (newData.goals && newData.pools && newData.marketing) {
          const metricsSnapshot: MetricsSnapshot = {
            monthlyProgress: newData.goals.monthlyProgress,
            yearlyProgress: newData.goals.yearlyProgress,
            usagePercent: newData.pools.usagePercent,
            monthlyGrowth: newData.financial?.monthlyGrowth,
            averageROI: newData.marketing.averageROI,
            totalLeads: newData.marketing.totalLeads,
          };
          evaluateAlerts(metricsSnapshot);
        }
      } else {
        setUpdateInfo(prev => ({ ...prev, isUpdating: false }));
      }
    } catch (error) {
      console.error('[DataContext] Error refreshing data:', error);
      setUpdateInfo(prev => ({ ...prev, isUpdating: false }));
    }
  }, [fetchAllData]);

  const refreshMetric = useCallback(async (key: keyof DataState) => {
    setUpdateInfo(prev => ({ ...prev, isUpdating: true, affectedKeys: [key] }));

    try {
      const client = getClient(clientId);
      if (!client) return;

      let updatedValue: unknown = null;

      switch (key) {
        case 'financial':
          updatedValue = getFinancialMetrics(clientId);
          break;
        case 'marketing':
          updatedValue = getMarketingMetrics(clientId);
          break;
        case 'goals':
          updatedValue = getGoalsMetrics(clientId);
          break;
        case 'pools':
          updatedValue = getPoolMetrics(client);
          break;
        case 'alerts':
          updatedValue = getSmartAlerts(clientId, client);
          break;
        case 'realtimeAlerts':
          updatedValue = getActiveAlerts();
          break;
        default:
          return;
      }

      setData(prev => ({ ...prev, [key]: updatedValue }));
      setUpdateInfo({
        lastUpdate: new Date(),
        isUpdating: false,
        updateSource: 'manual',
        affectedKeys: [key],
      });
    } catch (error) {
      console.error(`[DataContext] Error refreshing ${key}:`, error);
      setUpdateInfo(prev => ({ ...prev, isUpdating: false }));
    }
  }, [clientId]);

  // ============================================================
  // Alert Management
  // ============================================================

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    import('@/lib/alertEngine').then(({ acknowledgeAlert }) => {
      acknowledgeAlert(alertId);
      setData(prev => ({
        ...prev,
        realtimeAlerts: prev.realtimeAlerts.map(a =>
          a.id === alertId ? { ...a, acknowledged: true } : a
        ),
      }));
    });
  }, []);

  const handleDismissAlert = useCallback((alertId: string) => {
    import('@/lib/alertEngine').then(({ dismissAlert }) => {
      dismissAlert(alertId);
      setData(prev => ({
        ...prev,
        realtimeAlerts: prev.realtimeAlerts.filter(a => a.id !== alertId),
      }));
    });
  }, []);

  // ============================================================
  // Event Subscription
  // ============================================================

  const subscribeToEvents = useCallback((callback: (event: RealtimeEvent) => void) => {
    return realtimeEventBus.subscribe('*', callback);
  }, []);

  // ============================================================
  // Polling Effect
  // ============================================================

  useEffect(() => {
    // Initial load
    refreshAll('initial');

    // Set up polling
    if (isPollingEnabled && pollingInterval > 0) {
      pollingRef.current = setInterval(() => {
        refreshAll('poll');
      }, pollingInterval);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isPollingEnabled, pollingInterval, refreshAll]);

  // ============================================================
  // Realtime Event Listener
  // ============================================================

  useEffect(() => {
    const eventTypes: RealtimeEventType[] = [
      'payment:new',
      'payment:updated',
      'campaign:updated',
      'pools:consumed',
      'pools:purchased',
      'lead:new',
      'goal:progress',
    ];

    const unsubscribes = eventTypes.map(eventType =>
      realtimeEventBus.subscribe(eventType, () => {
        // Trigger refresh when relevant events occur
        refreshAll('event');
      })
    );

    // Also listen for alert events
    const alertUnsub = realtimeEventBus.subscribe('alert:triggered', () => {
      setData(prev => ({
        ...prev,
        realtimeAlerts: getActiveAlerts(),
      }));
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      alertUnsub();
    };
  }, [refreshAll]);

  // ============================================================
  // Context Value
  // ============================================================

  const value: DataContextValue = {
    data,
    updateInfo,
    refreshAll: () => refreshAll('manual'),
    refreshMetric,
    isPollingEnabled,
    setPollingEnabled,
    pollingInterval,
    setPollingInterval,
    subscribeToEvents,
    acknowledgeAlert: handleAcknowledgeAlert,
    dismissAlert: handleDismissAlert,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Convenience hooks for specific data
export function useFinancialData() {
  const { data, updateInfo, refreshMetric } = useData();
  return {
    financial: data.financial,
    isUpdating: updateInfo.isUpdating && updateInfo.affectedKeys.includes('financial'),
    lastUpdate: updateInfo.lastUpdate,
    refresh: () => refreshMetric('financial'),
  };
}

export function useMarketingData() {
  const { data, updateInfo, refreshMetric } = useData();
  return {
    marketing: data.marketing,
    isUpdating: updateInfo.isUpdating && updateInfo.affectedKeys.includes('marketing'),
    lastUpdate: updateInfo.lastUpdate,
    refresh: () => refreshMetric('marketing'),
  };
}

export function useGoalsData() {
  const { data, updateInfo, refreshMetric } = useData();
  return {
    goals: data.goals,
    isUpdating: updateInfo.isUpdating && updateInfo.affectedKeys.includes('goals'),
    lastUpdate: updateInfo.lastUpdate,
    refresh: () => refreshMetric('goals'),
  };
}

export function usePoolsData() {
  const { data, updateInfo, refreshMetric } = useData();
  return {
    pools: data.pools,
    isUpdating: updateInfo.isUpdating && updateInfo.affectedKeys.includes('pools'),
    lastUpdate: updateInfo.lastUpdate,
    refresh: () => refreshMetric('pools'),
  };
}

export function useAlertsData() {
  const { data, acknowledgeAlert, dismissAlert } = useData();
  return {
    smartAlerts: data.alerts,
    realtimeAlerts: data.realtimeAlerts,
    acknowledgeAlert,
    dismissAlert,
  };
}
