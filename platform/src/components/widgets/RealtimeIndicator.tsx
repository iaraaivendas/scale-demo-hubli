import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/DataContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface RealtimeIndicatorProps {
  className?: string;
  showControls?: boolean;
}

export function RealtimeIndicator({
  className,
  showControls = true,
}: RealtimeIndicatorProps) {
  const {
    updateInfo,
    isPollingEnabled,
    setPollingEnabled,
    refreshAll,
  } = useData();

  const [timeAgo, setTimeAgo] = useState('agora');

  // Update time ago display
  useEffect(() => {
    const updateTimeAgo = () => {
      const diff = Date.now() - updateInfo.lastUpdate.getTime();
      
      if (diff < 5000) {
        setTimeAgo('agora');
      } else if (diff < 60000) {
        setTimeAgo(`${Math.floor(diff / 1000)}s atrás`);
      } else if (diff < 3600000) {
        setTimeAgo(`${Math.floor(diff / 60000)}min atrás`);
      } else {
        setTimeAgo(`${Math.floor(diff / 3600000)}h atrás`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 5000);

    return () => clearInterval(interval);
  }, [updateInfo.lastUpdate]);

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                isPollingEnabled
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isPollingEnabled ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {isPollingEnabled ? 'Ao vivo' : 'Pausado'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isPollingEnabled
                ? 'Atualizações automáticas ativas'
                : 'Atualizações pausadas'}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Last Update */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all',
                updateInfo.isUpdating
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/50 text-muted-foreground'
              )}
            >
              {updateInfo.isUpdating ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {updateInfo.isUpdating ? 'Atualizando...' : timeAgo}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Última atualização:{' '}
              {updateInfo.lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
            {updateInfo.updateSource !== 'initial' && (
              <p className="text-xs text-muted-foreground">
                Fonte: {updateInfo.updateSource === 'poll' ? 'automática' : 
                       updateInfo.updateSource === 'event' ? 'evento' : 'manual'}
              </p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setPollingEnabled(!isPollingEnabled)}
                >
                  {isPollingEnabled ? (
                    <WifiOff className="h-3.5 w-3.5" />
                  ) : (
                    <Wifi className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPollingEnabled ? 'Pausar' : 'Retomar'} atualizações</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => refreshAll()}
                  disabled={updateInfo.isUpdating}
                >
                  <RefreshCw
                    className={cn(
                      'h-3.5 w-3.5',
                      updateInfo.isUpdating && 'animate-spin'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Atualizar agora</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
