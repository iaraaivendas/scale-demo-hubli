import { CustomerAnalysis, getScoreLevel, getChurnRiskLevel, getPriorityColor } from "@/lib/revenueScorer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowUpRight, 
  Layers, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  User,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueScoreCardProps {
  analysis: CustomerAnalysis;
  onSelect?: (analysis: CustomerAnalysis) => void;
  compact?: boolean;
}

export function RevenueScoreCard({ analysis, onSelect, compact = false }: RevenueScoreCardProps) {
  const { lead, scores, priority, priorityLabel, overallHealth } = analysis;

  const scoreConfig = {
    upsell: {
      label: 'Upsell',
      icon: ArrowUpRight,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    crossSell: {
      label: 'Cross-sell',
      icon: Layers,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
    },
    churnRisk: {
      label: 'Risco Churn',
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  };

  const healthConfig = {
    excellent: { color: 'text-primary', bg: 'bg-primary/20', label: 'Excelente' },
    good: { color: 'text-accent-foreground', bg: 'bg-accent/30', label: 'Bom' },
    attention: { color: 'text-warning', bg: 'bg-warning/20', label: 'Atenção' },
    critical: { color: 'text-destructive', bg: 'bg-destructive/20', label: 'Crítico' },
  };

  const health = healthConfig[overallHealth];

  if (compact) {
    return (
      <Card 
        className={cn(
          "p-4 cursor-pointer transition-all hover:shadow-lg hover:border-primary/30",
          onSelect && "hover:scale-[1.02]"
        )}
        onClick={() => onSelect?.(analysis)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", health.bg)}>
              <User className={cn("h-4 w-4", health.color)} />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{lead.name}</h4>
              <p className="text-xs text-muted-foreground">{lead.company || lead.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Mini Scores */}
            <div className="flex items-center gap-2">
              <ScorePill score={scores.upsell} type="upsell" />
              <ScorePill score={scores.crossSell} type="crossSell" />
              <ScorePill score={scores.churnRisk} type="churnRisk" inverted />
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "p-5 transition-all hover:shadow-lg",
        onSelect && "cursor-pointer hover:border-primary/30"
      )}
      onClick={() => onSelect?.(analysis)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg", health.bg)}>
            {lead.company ? (
              <Building2 className={cn("h-5 w-5", health.color)} />
            ) : (
              <User className={cn("h-5 w-5", health.color)} />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{lead.name}</h4>
            <p className="text-sm text-muted-foreground">{lead.company || lead.email}</p>
          </div>
        </div>
        
        <Badge className={cn("text-xs font-medium", getPriorityColor(priority))}>
          {priorityLabel}
        </Badge>
      </div>

      {/* Score Bars */}
      <div className="space-y-3 mb-4">
        {/* Upsell */}
        <ScoreBar
          label="Upsell"
          score={scores.upsell}
          config={scoreConfig.upsell}
        />
        
        {/* Cross-sell */}
        <ScoreBar
          label="Cross-sell"
          score={scores.crossSell}
          config={scoreConfig.crossSell}
        />
        
        {/* Churn Health (inverted display) */}
        <ScoreBar
          label="Saúde (Churn)"
          score={scores.churnRisk}
          config={scoreConfig.churnRisk}
          inverted
        />
      </div>

      {/* Health Status */}
      <div className={cn("p-3 rounded-lg", health.bg)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Status Geral</span>
          <span className={cn("font-semibold", health.color)}>{health.label}</span>
        </div>
      </div>
    </Card>
  );
}

// ============= Helper Components =============

interface ScoreBarProps {
  label: string;
  score: number;
  config: { label: string; icon: React.ElementType; color: string; bgColor: string };
  inverted?: boolean;
}

function ScoreBar({ label, score, config, inverted }: ScoreBarProps) {
  const Icon = config.icon;
  const level = inverted ? getChurnRiskLevel(score) : getScoreLevel(score);
  
  // For churn, we show the inverted perspective (100 - score = risk)
  const displayScore = score;
  const riskLabel = inverted ? (score < 40 ? 'Alto Risco' : score < 70 ? 'Atenção' : 'Saudável') : null;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", config.color)} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {riskLabel && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              score < 40 ? "bg-destructive/20 text-destructive" :
              score < 70 ? "bg-warning/20 text-warning" :
              "bg-primary/20 text-primary"
            )}>
              {riskLabel}
            </span>
          )}
          <span className={cn("font-mono-data font-semibold", config.color)}>
            {displayScore}
          </span>
        </div>
      </div>
      <Progress 
        value={displayScore} 
        className={cn("h-2", config.bgColor)}
      />
    </div>
  );
}

interface ScorePillProps {
  score: number;
  type: 'upsell' | 'crossSell' | 'churnRisk';
  inverted?: boolean;
}

function ScorePill({ score, type, inverted }: ScorePillProps) {
  const level = inverted ? getChurnRiskLevel(score) : getScoreLevel(score);
  
  const colors = {
    high: inverted ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary',
    medium: 'bg-warning/20 text-warning',
    low: inverted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
  };

  const icons = {
    upsell: ArrowUpRight,
    crossSell: Layers,
    churnRisk: AlertTriangle,
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono-data",
      colors[level]
    )}>
      <Icon className="h-3 w-3" />
      {score}
    </div>
  );
}
