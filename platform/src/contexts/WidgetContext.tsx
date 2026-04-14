import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  type WidgetConfig,
  type WidgetLayout,
  type WidgetSize,
  getWidgetLayouts,
  saveWidgetLayout,
  getActiveLayoutId,
  setActiveLayoutId,
  reorderWidgets,
  toggleWidgetVisibility,
  updateWidgetSize,
  updateWidgetSettings,
} from '@/lib/widgets';

interface WidgetContextValue {
  // Current layout
  currentLayout: WidgetLayout | null;
  widgets: WidgetConfig[];
  
  // Layout management
  layouts: WidgetLayout[];
  loadLayout: (layoutId: string) => void;
  saveCurrentLayout: (name?: string) => void;
  createNewLayout: (name: string, widgets: WidgetConfig[]) => void;
  deleteLayout: (layoutId: string) => void;
  
  // Widget management
  setWidgets: (widgets: WidgetConfig[]) => void;
  addWidget: (widget: WidgetConfig) => void;
  removeWidget: (widgetId: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  toggleVisibility: (widgetId: string) => void;
  resizeWidget: (widgetId: string, size: WidgetSize) => void;
  updateSettings: (widgetId: string, settings: Record<string, unknown>) => void;
  
  // Editing mode
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  
  // Data refresh
  lastRefresh: Date;
  triggerRefresh: () => void;
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

export function WidgetProvider({ 
  children, 
  defaultWidgets 
}: { 
  children: React.ReactNode;
  defaultWidgets: WidgetConfig[];
}) {
  const [layouts, setLayouts] = useState<WidgetLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<WidgetLayout | null>(null);
  const [widgets, setWidgetsState] = useState<WidgetConfig[]>(defaultWidgets);
  const [isEditing, setIsEditing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Load layouts from localStorage on mount
  useEffect(() => {
    const storedLayouts = getWidgetLayouts();
    setLayouts(storedLayouts);
    
    const activeId = getActiveLayoutId();
    if (activeId) {
      const activeLayout = storedLayouts.find(l => l.id === activeId);
      if (activeLayout) {
        setCurrentLayout(activeLayout);
        setWidgetsState(activeLayout.widgets);
      }
    }
  }, []);

  const setWidgets = useCallback((newWidgets: WidgetConfig[]) => {
    setWidgetsState(newWidgets);
  }, []);

  const addWidget = useCallback((widget: WidgetConfig) => {
    setWidgetsState(prev => [...prev, { ...widget, order: prev.length }]);
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgetsState(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setWidgetsState(prev => reorderWidgets(prev, fromIndex, toIndex));
  }, []);

  const toggleVisibility = useCallback((widgetId: string) => {
    setWidgetsState(prev => toggleWidgetVisibility(prev, widgetId));
  }, []);

  const resizeWidget = useCallback((widgetId: string, size: WidgetSize) => {
    setWidgetsState(prev => updateWidgetSize(prev, widgetId, size));
  }, []);

  const updateSettings = useCallback((widgetId: string, settings: Record<string, unknown>) => {
    setWidgetsState(prev => updateWidgetSettings(prev, widgetId, settings));
  }, []);

  const loadLayout = useCallback((layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (layout) {
      setCurrentLayout(layout);
      setWidgetsState(layout.widgets);
      setActiveLayoutId(layoutId);
    }
  }, [layouts]);

  const saveCurrentLayout = useCallback((name?: string) => {
    const now = new Date().toISOString();
    
    if (currentLayout) {
      // Update existing layout
      const updatedLayout: WidgetLayout = {
        ...currentLayout,
        name: name || currentLayout.name,
        widgets,
        updatedAt: now,
      };
      saveWidgetLayout(updatedLayout);
      setCurrentLayout(updatedLayout);
      setLayouts(getWidgetLayouts());
    } else {
      // Create new layout
      const newLayout: WidgetLayout = {
        id: `layout-${Date.now()}`,
        name: name || 'Novo Layout',
        widgets,
        createdAt: now,
        updatedAt: now,
      };
      saveWidgetLayout(newLayout);
      setCurrentLayout(newLayout);
      setActiveLayoutId(newLayout.id);
      setLayouts(getWidgetLayouts());
    }
  }, [currentLayout, widgets]);

  const createNewLayout = useCallback((name: string, layoutWidgets: WidgetConfig[]) => {
    const now = new Date().toISOString();
    const newLayout: WidgetLayout = {
      id: `layout-${Date.now()}`,
      name,
      widgets: layoutWidgets,
      createdAt: now,
      updatedAt: now,
    };
    saveWidgetLayout(newLayout);
    setCurrentLayout(newLayout);
    setWidgetsState(layoutWidgets);
    setActiveLayoutId(newLayout.id);
    setLayouts(getWidgetLayouts());
  }, []);

  const deleteLayout = useCallback((layoutId: string) => {
    const updatedLayouts = layouts.filter(l => l.id !== layoutId);
    localStorage.setItem('iara_widget_layouts', JSON.stringify(updatedLayouts));
    setLayouts(updatedLayouts);
    
    if (currentLayout?.id === layoutId) {
      setCurrentLayout(null);
      setWidgetsState(defaultWidgets);
    }
  }, [layouts, currentLayout, defaultWidgets]);

  const triggerRefresh = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  return (
    <WidgetContext.Provider value={{
      currentLayout,
      widgets,
      layouts,
      loadLayout,
      saveCurrentLayout,
      createNewLayout,
      deleteLayout,
      setWidgets,
      addWidget,
      removeWidget,
      reorder,
      toggleVisibility,
      resizeWidget,
      updateSettings,
      isEditing,
      setIsEditing,
      lastRefresh,
      triggerRefresh,
    }}>
      {children}
    </WidgetContext.Provider>
  );
}

export function useWidgets() {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgets must be used within a WidgetProvider');
  }
  return context;
}
