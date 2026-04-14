import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PrivacyToggle } from './PrivacyToggle';
import { usePrivacy, type PrivacyWidget } from '@/contexts/PrivacyContext';

interface GoalProgressChartProps {
  achieved: number;
  goal: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'donut' | 'progress';
  /** Privacy widget key - enables privacy toggle when set */
  privacyKey?: PrivacyWidget;
}

export function GoalProgressChart({ 
  achieved, 
  goal, 
  title = "Meta", 
  size = 'md',
  variant = 'donut',
  privacyKey,
}: GoalProgressChartProps) {
  const { isVisible, toggleVisibility } = usePrivacy();
  const isHidden = privacyKey && !isVisible(privacyKey);
  
  const progress = Math.min(100, Math.round((achieved / goal) * 100));
  const remaining = goal - achieved;
  
  const data = [
    { name: 'Atingido', value: achieved, color: 'hsl(142, 76%, 45%)' },
    { name: 'Restante', value: Math.max(0, remaining), color: 'hsl(0, 0%, 14%)' },
  ];
  
  const sizeConfig = {
    sm: { height: 160, innerRadius: 40, outerRadius: 55, textSize: 'text-xl' },
    md: { height: 200, innerRadius: 55, outerRadius: 75, textSize: 'text-2xl' },
    lg: { height: 260, innerRadius: 70, outerRadius: 95, textSize: 'text-3xl' },
  };
  
  const config = sizeConfig[size];

  const formatCurrency = (value: number) => {
    if (isHidden) return 'R$ ****';
    return `R$ ${value.toLocaleString('pt-BR')}`;
  };

  const formatCurrencyShort = (value: number) => {
    if (isHidden) return '****';
    return `R$ ${(value / 1000).toFixed(0)}k`;
  };
  
  if (variant === 'progress') {
    return (
      <Card className="iara-card-glow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          {privacyKey && (
            <PrivacyToggle
              isVisible={isVisible(privacyKey)}
              onToggle={() => toggleVisibility(privacyKey)}
            />
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <span className={cn("font-bold gradient-text-iara", config.textSize)}>
              {progress}%
            </span>
            <span className={cn(
              "text-sm transition-all duration-200",
              isHidden ? "text-muted-foreground" : "text-muted-foreground"
            )}>
              {formatCurrency(achieved)} / {formatCurrency(goal)}
            </span>
          </div>
          <div className="progress-iara h-4">
            <div 
              className="progress-iara-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Restam: <span className={cn(
                "font-mono-data transition-all duration-200",
                isHidden ? "text-muted-foreground" : "text-foreground"
              )}>
                {formatCurrency(Math.max(0, remaining))}
              </span>
            </span>
            {progress >= 100 && (
              <span className="text-primary font-medium">Meta Atingida! 🎉</span>
            )}
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="iara-card-glow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        {privacyKey && (
          <PrivacyToggle
            isVisible={isVisible(privacyKey)}
            onToggle={() => toggleVisibility(privacyKey)}
          />
        )}
      </div>
      <div className="relative" style={{ height: config.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold gradient-text-iara", config.textSize)}>
            {progress}%
          </span>
          <span className="text-xs text-muted-foreground">concluído</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase">Atingido</p>
          <p className={cn(
            "text-lg font-bold font-mono-data transition-all duration-200",
            isHidden ? "text-muted-foreground" : "text-primary"
          )}>
            {formatCurrencyShort(achieved)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase">Restante</p>
          <p className={cn(
            "text-lg font-bold font-mono-data transition-all duration-200",
            isHidden ? "text-muted-foreground" : "text-foreground"
          )}>
            {formatCurrencyShort(Math.max(0, remaining))}
          </p>
        </div>
      </div>
    </Card>
  );
}
