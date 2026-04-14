import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type PrivacyWidget = 'receitaMensal' | 'receitaAcumulada' | 'metaMensal';

interface PrivacySettings {
  receitaMensal: boolean;
  receitaAcumulada: boolean;
  metaMensal: boolean;
}

interface PrivacyContextType {
  settings: PrivacySettings;
  toggleVisibility: (widget: PrivacyWidget) => void;
  isVisible: (widget: PrivacyWidget) => boolean;
  maskValue: (value: string | number, widget: PrivacyWidget) => string;
  maskCurrency: (value: number, widget: PrivacyWidget) => string;
}

const STORAGE_KEY = 'iara_privacy_settings';

const defaultSettings: PrivacySettings = {
  receitaMensal: true,
  receitaAcumulada: true,
  metaMensal: true,
};

function loadSettings(): PrivacySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading privacy settings:', e);
  }
  return defaultSettings;
}

function saveSettings(settings: PrivacySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving privacy settings:', e);
  }
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PrivacySettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toggleVisibility = useCallback((widget: PrivacyWidget) => {
    setSettings(prev => ({
      ...prev,
      [widget]: !prev[widget],
    }));
  }, []);

  const isVisible = useCallback((widget: PrivacyWidget): boolean => {
    return settings[widget];
  }, [settings]);

  const maskValue = useCallback((value: string | number, widget: PrivacyWidget): string => {
    if (settings[widget]) {
      return typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
    }
    return '•••••';
  }, [settings]);

  const maskCurrency = useCallback((value: number, widget: PrivacyWidget): string => {
    if (settings[widget]) {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return 'R$ ****';
  }, [settings]);

  return (
    <PrivacyContext.Provider value={{
      settings,
      toggleVisibility,
      isVisible,
      maskValue,
      maskCurrency,
    }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
