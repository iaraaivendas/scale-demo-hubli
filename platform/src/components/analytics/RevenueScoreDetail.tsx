import { CustomerAnalysis, ScoreFactor, getPriorityColor } from "@/lib/revenueScorer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  Layers, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  CheckCircle2,
  XCircle,
  MinusCircle,
  User,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RevenueScoreDetailProps {
  analysis: CustomerAnalysis;
  onClose: () => void;
}

export function RevenueScoreDetail({ analysis, onClose }: RevenueScoreDetailProps) {
  const { lead, scores, upsellExplanation, crossSellExplanation, churnExplanation, priority, priorityLabel, priorityDescription, overallHealth } = analysis;

  const healthConfig = {
    excellent: { color: 'text-primary', bg: 'bg-primary/20', label: 'Excelente', icon: CheckCircle2 },
    good: { color: 'text-accent-foreground', bg: 'bg-accent/30', label: 'Bom', icon: CheckCircle2 },
    attention: { color: 'text-warning', bg: 'bg-warning/20', label: 'Atenção', icon: MinusCircle },
    critical: { color: 'text-destructive', bg: 'bg-destructive/20', label: 'Crítico', icon: XCircle },
  };

  const health = healthConfig[overallHealth];
  const HealthIcon = health.icon;

  return (
    <Card className="iara-card-glow overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", health.bg)}>
              {lead.company ? (
                <Building2 className={cn("h-6 w-6", health.color)} />
              ) : (
                <User className={cn("h-6 w-6", health.color)} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{lead.name}</h2>
              {lead.company && (
                <p className="text-sm text-muted-foreground">{lead.company}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {lead.email}
                </span>
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {lead.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Health & Priority */}
        <div className="flex items-center gap-3 mt-4">
          <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", health.bg)}>
            <HealthIcon className={cn("h-4 w-4", health.color)} />
            <span className={cn("font-medium", health.color)}>{health.label}</span>
          </div>
          <Badge className={cn("text-sm", getPriorityColor(priority))}>
            {priorityLabel}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mt-3">
          {priorityDescription}
        </p>
      </div>

      {/* Score Overview */}
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Resumo dos Scores
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <ScoreCircle 
            label="Upsell" 
            score={scores.upsell} 
            icon={ArrowUpRight}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <ScoreCircle 
            label="Cross-sell" 
            score={scores.crossSell} 
            icon={Layers}
            color="text-accent-foreground"
            bgColor="bg-accent/30"
          />
          <ScoreCircle 
            label="Saúde" 
            score={scores.churnRisk} 
            icon={AlertTriangle}
            color="text-warning"
            bgColor="bg-warning/10"
            inverted
          />
        </div>
      </div>

      {/* Detailed Explanations */}
      <div className="p-6">
        <Tabs defaultValue="upsell" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upsell" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Upsell
            </TabsTrigger>
            <TabsTrigger value="crossSell" className="gap-2">
              <Layers className="h-4 w-4" />
              Cross-sell
            </TabsTrigger>
            <TabsTrigger value="churn" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Churn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upsell">
            <ScoreExplanationPanel
              title="Score de Upsell"
              score={scores.upsell}
              explanation={upsellExplanation}
              color="text-primary"
              bgColor="bg-primary/10"
            />
          </TabsContent>

          <TabsContent value="crossSell">
            <ScoreExplanationPanel
              title="Score de Cross-sell"
              score={scores.crossSell}
              explanation={crossSellExplanation}
              color="text-accent-foreground"
              bgColor="bg-accent/30"
            />
          </TabsContent>

          <TabsContent value="churn">
            <ScoreExplanationPanel
              title="Score de Saúde (Churn)"
              score={scores.churnRisk}
              explanation={churnExplanation}
              color="text-warning"
              bgColor="bg-warning/10"
              inverted
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

// ============= Helper Components =============

interface ScoreCircleProps {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  inverted?: boolean;
}

function ScoreCircle({ label, score, icon: Icon, color, bgColor, inverted }: ScoreCircleProps) {
  const displayLabel = inverted 
    ? (score >= 70 ? 'Saudável' : score >= 40 ? 'Atenção' : 'Risco')
    : (score >= 70 ? 'Alto' : score >= 40 ? 'Médio' : 'Baixo');

  return (
    <div className="text-center">
      <div className={cn(
        "mx-auto w-20 h-20 rounded-full flex items-center justify-center relative",
        bgColor
      )}>
        <span className={cn("text-2xl font-bold font-mono-data", color)}>
          {score}
        </span>
        <Icon className={cn("absolute -top-1 -right-1 h-5 w-5", color)} />
      </div>
      <p className="text-sm font-medium text-foreground mt-2">{label}</p>
      <p className={cn("text-xs", color)}>{displayLabel}</p>
    </div>
  );
}

interface ScoreExplanationPanelProps {
  title: string;
  score: number;
  explanation: {
    score: number;
    factors: ScoreFactor[];
    summary: string;
  };
  color: string;
  bgColor: string;
  inverted?: boolean;
}

function ScoreExplanationPanel({ 
  title, 
  score, 
  explanation, 
  color, 
  bgColor,
  inverted 
}: ScoreExplanationPanelProps) {
  const impactIcons = {
    positive: { icon: TrendingUp, color: 'text-primary' },
    negative: { icon: TrendingDown, color: 'text-destructive' },
    neutral: { icon: Minus, color: 'text-muted-foreground' },
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={cn("p-4 rounded-lg", bgColor)}>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("text-3xl font-bold font-mono-data", color)}>
            {score}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
        <p className="text-sm text-foreground">{explanation.summary}</p>
      </div>

      {/* Factors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Fatores Considerados
        </h4>
        {explanation.factors.map((factor, index) => {
          const ImpactIcon = impactIcons[factor.impact].icon;
          const impactColor = impactIcons[factor.impact].color;

          return (
            <div key={index} className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ImpactIcon className={cn("h-4 w-4", impactColor)} />
                  <span className="font-medium text-foreground">{factor.name}</span>
                </div>
                <span className={cn("font-mono-data font-semibold", impactColor)}>
                  +{factor.value}
                </span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {factor.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
