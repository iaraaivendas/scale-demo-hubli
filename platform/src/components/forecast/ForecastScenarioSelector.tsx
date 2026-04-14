import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, Target } from "lucide-react";
import { type ForecastScenario, type ForecastPeriod, getScenarioLabel, getPeriodLabel } from "@/lib/forecastEngine";

interface ForecastScenarioSelectorProps {
  scenario: ForecastScenario;
  period: ForecastPeriod;
  onScenarioChange: (scenario: ForecastScenario) => void;
  onPeriodChange: (period: ForecastPeriod) => void;
}

export function ForecastScenarioSelector({
  scenario,
  period,
  onScenarioChange,
  onPeriodChange,
}: ForecastScenarioSelectorProps) {
  const scenarios: { value: ForecastScenario; icon: React.ReactNode }[] = [
    { value: 'conservative', icon: <TrendingDown className="h-4 w-4" /> },
    { value: 'realistic', icon: <Target className="h-4 w-4" /> },
    { value: 'optimistic', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  const periods: ForecastPeriod[] = [30, 60, 90];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Scenario Selector */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">
          Cenário
        </label>
        <div className="flex gap-1 bg-muted/30 p-1 rounded-lg border border-border">
          {scenarios.map(s => (
            <Button
              key={s.value}
              variant={scenario === s.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onScenarioChange(s.value)}
              className={cn(
                "gap-2 transition-all",
                scenario === s.value 
                  ? "bg-foreground/10 text-foreground border border-border shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.icon}
              <span className="hidden sm:inline">{getScenarioLabel(s.value)}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Period Selector */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">
          Período
        </label>
        <div className="flex gap-1 bg-muted/30 p-1 rounded-lg border border-border">
          {periods.map(p => (
            <Button
              key={p}
              variant={period === p ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "transition-all",
                period === p 
                  ? "bg-foreground/10 text-foreground border border-border shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {getPeriodLabel(p)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
