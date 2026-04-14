import { Lead, Score, calculateScore } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Target,
  Clock,
  Zap,
  ArrowUpRight,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadOpportunityCardProps {
  lead: Lead;
  opportunityType: 'upsell' | 'cross-sell' | 'nurturing';
}

const UPSELL_THRESHOLD = 70;
const CROSSSELL_THRESHOLD = 50;

export function LeadOpportunityCard({ lead, opportunityType }: LeadOpportunityCardProps) {
  const score = calculateScore(lead);
  const pointsToUpsell = Math.max(0, UPSELL_THRESHOLD - lead.score);
  const pointsToCrossSell = Math.max(0, CROSSSELL_THRESHOLD - lead.score);
  
  const insights = generateInsights(lead, score);
  const attentionPoints = generateAttentionPoints(lead, score);
  
  const opportunityConfig = {
    upsell: {
      label: 'Upsell',
      icon: ArrowUpRight,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    'cross-sell': {
      label: 'Cross-sell',
      icon: Layers,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
      borderColor: 'border-accent',
    },
    nurturing: {
      label: 'Nutrição',
      icon: Target,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
    },
  };
  
  const config = opportunityConfig[opportunityType];
  const OpportunityIcon = config.icon;

  return (
    <Card className={cn(
      "p-4 transition-all hover:shadow-lg border-2",
      config.borderColor
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-foreground">{lead.name}</h4>
            <Badge variant="outline" className={cn("text-xs", config.color, config.bgColor)}>
              <OpportunityIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{lead.company || lead.email}</p>
        </div>
        <div className="text-right">
          <div className={cn(
            "text-2xl font-bold font-mono-data",
            lead.score >= UPSELL_THRESHOLD ? "text-primary" :
            lead.score >= CROSSSELL_THRESHOLD ? "text-accent-foreground" : "text-warning"
          )}>
            {lead.score}
          </div>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
      </div>

      {/* Progress to thresholds */}
      <div className="space-y-3 mb-4">
        {opportunityType !== 'upsell' && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progresso para Upsell</span>
              <span className="font-mono-data text-primary">
                {lead.score >= UPSELL_THRESHOLD ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Apto
                  </span>
                ) : (
                  `${pointsToUpsell} pts restantes`
                )}
              </span>
            </div>
            <Progress 
              value={Math.min(100, (lead.score / UPSELL_THRESHOLD) * 100)} 
              className="h-2"
            />
          </div>
        )}
        
        {opportunityType === 'nurturing' && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progresso para Cross-sell</span>
              <span className="font-mono-data text-accent-foreground">
                {lead.score >= CROSSSELL_THRESHOLD ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Apto
                  </span>
                ) : (
                  `${pointsToCrossSell} pts restantes`
                )}
              </span>
            </div>
            <Progress 
              value={Math.min(100, (lead.score / CROSSSELL_THRESHOLD) * 100)} 
              className="h-2"
            />
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="mb-4">
        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <Zap className="h-3 w-3" /> Insights
        </h5>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <insight.icon className={cn("h-4 w-4 mt-0.5 shrink-0", insight.color)} />
              <span className="text-foreground">{insight.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attention Points */}
      {attentionPoints.length > 0 && (
        <div className="pt-3 border-t border-border">
          <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-warning" /> Pontos de Atenção
          </h5>
          <div className="space-y-2">
            {attentionPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <point.icon className={cn("h-4 w-4 mt-0.5 shrink-0", point.color)} />
                <div>
                  <span className="text-foreground">{point.text}</span>
                  {point.action && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      → {point.action}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="mt-4 pt-3 border-t border-border">
        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Composição do Score
        </h5>
        <div className="grid grid-cols-2 gap-2">
          {score.signals.slice(0, 4).map((signal) => (
            <div key={signal.name} className="text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground truncate">{signal.name}</span>
                <span className={cn(
                  "font-mono-data ml-1",
                  signal.value >= 70 ? "text-primary" :
                  signal.value >= 40 ? "text-warning" : "text-destructive"
                )}>
                  {Math.round(signal.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

interface Insight {
  icon: React.ElementType;
  color: string;
  text: string;
}

interface AttentionPoint {
  icon: React.ElementType;
  color: string;
  text: string;
  action?: string;
}

function generateInsights(lead: Lead, score: Score): Insight[] {
  const insights: Insight[] = [];
  
  // Engagement insight
  const daysSinceInteraction = Math.floor(
    (Date.now() - new Date(lead.lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceInteraction <= 3) {
    insights.push({
      icon: TrendingUp,
      color: "text-primary",
      text: "Engajamento recente alto - Lead muito ativo",
    });
  } else if (daysSinceInteraction <= 7) {
    insights.push({
      icon: TrendingUp,
      color: "text-accent-foreground",
      text: "Engajamento estável na última semana",
    });
  }
  
  // Status insight
  if (lead.status === 'qualified') {
    insights.push({
      icon: CheckCircle2,
      color: "text-primary",
      text: "Lead qualificado - Pronto para abordagem comercial",
    });
  } else if (lead.status === 'converted') {
    insights.push({
      icon: CheckCircle2,
      color: "text-primary",
      text: "Cliente convertido - Potencial de expansão de conta",
    });
  }
  
  // Origin insight
  const highValueOrigins = ['LinkedIn', 'Google Ads', 'Referral'];
  if (highValueOrigins.includes(lead.origin)) {
    insights.push({
      icon: Target,
      color: "text-primary",
      text: `Origem de alta conversão: ${lead.origin}`,
    });
  }
  
  // Score insight
  if (lead.score >= 80) {
    insights.push({
      icon: Zap,
      color: "text-primary",
      text: "Score excepcional - Prioridade máxima",
    });
  }

  return insights.slice(0, 3);
}

function generateAttentionPoints(lead: Lead, score: Score): AttentionPoint[] {
  const points: AttentionPoint[] = [];
  
  const daysSinceInteraction = Math.floor(
    (Date.now() - new Date(lead.lastInteraction).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Engagement warning
  if (daysSinceInteraction > 14) {
    points.push({
      icon: Clock,
      color: "text-warning",
      text: `${daysSinceInteraction} dias sem interação`,
      action: "Agendar follow-up urgente para reativar interesse",
    });
  } else if (daysSinceInteraction > 7) {
    points.push({
      icon: Clock,
      color: "text-muted-foreground",
      text: `${daysSinceInteraction} dias desde última interação`,
      action: "Enviar conteúdo de nutrição relevante",
    });
  }
  
  // Cold lead warning
  if (lead.status === 'cold') {
    points.push({
      icon: TrendingDown,
      color: "text-destructive",
      text: "Lead esfriando - Risco de perda",
      action: "Aplicar campanha de reativação segmentada",
    });
  }
  
  // Low signals
  score.signals.forEach(signal => {
    if (signal.value < 40) {
      points.push({
        icon: AlertTriangle,
        color: "text-warning",
        text: `${signal.name} abaixo do ideal (${Math.round(signal.value)})`,
        action: getSignalAction(signal.name),
      });
    }
  });

  return points.slice(0, 3);
}

function getSignalAction(signalName: string): string {
  const actions: Record<string, string> = {
    'Engajamento Recente': 'Aumentar touchpoints e personalizar abordagem',
    'Qualificação': 'Refinar perfil com perguntas qualificadoras',
    'Origem do Lead': 'Validar fit do canal de aquisição',
    'Tempo no Funil': 'Acelerar processo com proposta direta',
    'Histórico de Interações': 'Documentar mais interações no CRM',
  };
  return actions[signalName] || 'Revisar estratégia para este sinal';
}
