import { useState } from 'react';
import { 
  Zap, 
  Play, 
  Pause, 
  CreditCard, 
  Target, 
  Users, 
  AlertTriangle,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeSimulator } from '@/hooks/useRealtimeData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SimulatorControlsProps {
  className?: string;
  compact?: boolean;
}

export function SimulatorControls({ 
  className, 
  compact = false 
}: SimulatorControlsProps) {
  const { isRunning, start, stop, simulateEvent } = useRealtimeSimulator();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [interval, setInterval] = useState(10);
  const [probability, setProbability] = useState(30);

  const handleToggle = () => {
    if (isRunning) {
      stop();
    } else {
      start(interval * 1000, probability / 100);
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2', className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRunning ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggle}
                className={cn(
                  'gap-2',
                  isRunning && 'bg-primary animate-pulse'
                )}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Simulando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Simular</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isRunning 
                ? 'Pausar simulação de eventos em tempo real' 
                : 'Iniciar simulação de eventos em tempo real'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={cn('p-4', className)}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Zap className={cn(
                'h-5 w-5',
                isRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'
              )} />
              <span className="font-medium">Simulador de Eventos</span>
              {isRunning && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium animate-pulse">
                  Ativo
                </span>
              )}
            </div>
            <Button
              variant={isRunning ? 'default' : 'outline'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Intervalo: {interval}s
              </label>
              <Slider
                value={[interval]}
                onValueChange={([v]) => setInterval(v)}
                min={3}
                max={30}
                step={1}
                disabled={isRunning}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Probabilidade: {probability}%
              </label>
              <Slider
                value={[probability]}
                onValueChange={([v]) => setProbability(v)}
                min={10}
                max={100}
                step={5}
                disabled={isRunning}
              />
            </div>
          </div>

          {/* Manual Event Triggers */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Disparar evento manualmente:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateEvent('payment')}
                className="gap-1.5"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pagamento
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateEvent('lead')}
                className="gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                Lead
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateEvent('pools')}
                className="gap-1.5"
              >
                <Database className="h-3.5 w-3.5" />
                Pools
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateEvent('campaign')}
                className="gap-1.5"
              >
                <Target className="h-3.5 w-3.5" />
                Campanha
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateEvent('alert')}
                className="gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Alerta
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
