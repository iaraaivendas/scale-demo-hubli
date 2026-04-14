import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface UpdateIndicatorProps {
  isUpdating?: boolean;
  lastUpdate?: Date;
  className?: string;
}

export function UpdateIndicator({
  isUpdating = false,
  lastUpdate,
  className,
}: UpdateIndicatorProps) {
  const [showPulse, setShowPulse] = useState(false);

  // Show pulse animation when data updates
  useEffect(() => {
    if (lastUpdate) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  if (isUpdating) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span className="text-xs text-muted-foreground">Atualizando...</span>
      </div>
    );
  }

  if (showPulse) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <span className="text-xs text-success animate-fade-in">Atualizado</span>
      </div>
    );
  }

  return null;
}

// Animation for individual widget updates
export function WidgetUpdateGlow({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 rounded-xl pointer-events-none',
        'bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5',
        'animate-pulse',
        className
      )}
    />
  );
}
