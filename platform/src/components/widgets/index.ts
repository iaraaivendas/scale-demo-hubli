// Widget Components Export
export { WidgetContainer } from './WidgetContainer';
export { KPIWidget } from './KPIWidget';
export { LineChartWidget } from './LineChartWidget';
export { BarChartWidget } from './BarChartWidget';
export { DonutChartWidget } from './DonutChartWidget';
export { ProgressWidget } from './ProgressWidget';
export { TableWidget, type TableColumn } from './TableWidget';
export { WidgetGrid } from './WidgetGrid';
export { WidgetToolbar } from './WidgetToolbar';
export { WidgetDashboard } from './WidgetDashboard';

// Real-time components
export { RealtimeIndicator } from './RealtimeIndicator';
export { UpdateIndicator, WidgetUpdateGlow } from './UpdateIndicator';
export { AlertsPanel, AlertsBadge } from './AlertsPanel';
export { SimulatorControls } from './SimulatorControls';

// Re-export types from lib
export type { WidgetConfig, WidgetLayout, WidgetData, WidgetType, WidgetSize, WidgetVariant } from '@/lib/widgets';
