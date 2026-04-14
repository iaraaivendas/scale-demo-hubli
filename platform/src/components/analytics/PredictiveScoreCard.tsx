import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Building2,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  Layers,
  AlertTriangle,
  Shield,
} from "lucide-react";
import type { PredictiveScore } from "@/lib/expansionMetrics";
import { 
  analyzeCustomer, 
  CustomerAnalysis, 
  getScoreLevel, 
  getChurnRiskLevel,
  getPriorityColor 
} from "@/lib/revenueScorer";
import type { Lead } from "@/lib/storage";

interface PredictiveScoreCardProps {
  leadName: string;
  predictiveScore: PredictiveScore;
  lead?: Lead; // Optional: if provided, shows Revenue Scores
  onAction?: () => void;
  className?: string;
}

export function PredictiveScoreCard({
  leadName,
  predictiveScore,
  lead,
  onAction,
  className,
}: PredictiveScoreCardProps) {
  const { score, upgradeReady, signals, recommendation } = predictiveScore;
  const scoreLevel = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

  // Calculate Revenue Scores if lead is provided
  const revenueAnalysis: CustomerAnalysis | null = lead ? analyzeCustomer(lead) : null;

  return (
    <Card className={cn("iara-card-glow", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-2 bg-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Score Preditivo</h3>
            <p className="text-xs text-muted-foreground">{leadName}</p>
          </div>
        </div>
        {upgradeReady && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="h-3 w-3" />
            Pronto para Upgrade
          </span>
        )}
      </div>

      {/* Main Score */}
      <div className="text-center py-4 mb-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
        <p className={cn(
          "text-5xl font-bold font-mono-data",
          scoreLevel === 'high' ? "text-primary glow-text" :
          scoreLevel === 'medium' ? "text-warning" : "text-muted-foreground"
        )}>
          {score}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Sinal Duplo Score
        </p>
      </div>

      {/* Revenue Scores - NEW */}
      {revenueAnalysis && (
        <div className="mb-4 p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Scores de Receita</h4>
          </div>
          
          {/* Upsell */}
          <RevenueScoreBar
            label="Upsell"
            score={revenueAnalysis.scores.upsell}
            icon={ArrowUpRight}
            color="text-primary"
          />
          
          {/* Cross-sell */}
          <RevenueScoreBar
            label="Cross-sell"
            score={revenueAnalysis.scores.crossSell}
            icon={Layers}
            color="text-accent-foreground"
          />
          
          {/* Churn Health */}
          <RevenueScoreBar
            label="Saúde"
            score={revenueAnalysis.scores.churnRisk}
            icon={AlertTriangle}
            color="text-warning"
            inverted
          />

          {/* Priority Action */}
          <div className={cn(
            "mt-3 p-2 rounded-md text-xs font-medium text-center",
            getPriorityColor(revenueAnalysis.priority)
          )}>
            {revenueAnalysis.priorityLabel}
          </div>
        </div>
      )}

      {/* Behavioral Signals */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-info" />
          <h4 className="text-sm font-medium text-foreground">Sinais Comportamentais</h4>
        </div>
        <div className="space-y-2">
          {signals.behavioral.map((signal, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{signal.name}</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  signal.value >= 70 ? "bg-primary/20 text-primary" :
                  signal.value >= 40 ? "bg-warning/20 text-warning" :
                  "bg-muted text-muted-foreground"
                )}>
                  {signal.indicator}
                </span>
                <span className="font-mono-data text-xs w-8 text-right">
                  {signal.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographic Signals */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-secondary-foreground" />
          <h4 className="text-sm font-medium text-foreground">Sinais Demográficos</h4>
        </div>
        <div className="space-y-2">
          {signals.demographic.map((signal, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{signal.name}</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  signal.value >= 70 ? "bg-info/20 text-info" :
                  signal.value >= 40 ? "bg-muted text-muted-foreground" :
                  "bg-destructive/20 text-destructive"
                )}>
                  {signal.indicator}
                </span>
                <span className="font-mono-data text-xs w-8 text-right">
                  {signal.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-primary mb-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Recomendação:</span>{" "}
            {revenueAnalysis 
              ? revenueAnalysis.priorityDescription 
              : recommendation}
          </p>
        </div>
      </div>

      {/* Action Button */}
      {upgradeReady && (
        <Button
          variant="iara"
          className="w-full gap-2"
          onClick={onAction}
        >
          Criar Tarefa no CRM
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </Card>
  );
}

// ============= Helper Component =============

interface RevenueScoreBarProps {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
  inverted?: boolean;
}

function RevenueScoreBar({ label, score, icon: Icon, color, inverted }: RevenueScoreBarProps) {
  const level = inverted 
    ? (score >= 70 ? 'Saudável' : score >= 40 ? 'Atenção' : 'Risco')
    : (score >= 70 ? 'Alto' : score >= 40 ? 'Médio' : 'Baixo');

  const levelColor = inverted
    ? (score >= 70 ? 'text-primary' : score >= 40 ? 'text-warning' : 'text-destructive')
    : (score >= 70 ? 'text-primary' : score >= 40 ? 'text-warning' : 'text-muted-foreground');

  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-3 w-3", color)} />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", levelColor)}>{level}</span>
          <span className={cn("font-mono-data font-semibold", color)}>{score}</span>
        </div>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}
