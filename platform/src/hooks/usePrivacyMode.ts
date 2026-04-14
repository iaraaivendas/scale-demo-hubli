import { useState, useEffect, useCallback } from 'react';

export type PrivacyWidget = 'receitaMensal' | 'receitaAcumulada' | 'metaMensal';

interface PrivacySettings {
  receitaMensal: boolean;
  receitaAcumulada: boolean;
  metaMensal: boolean;
}

const STORAGE_KEY = 'iara_privacy_settings';

const defaultSettings: PrivacySettings = {
  receitaMensal: true, // true = visible
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

export function usePrivacyMode() {
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

  return {
    settings,
    toggleVisibility,
    isVisible,
    maskValue,
    maskCurrency,
  };
}
