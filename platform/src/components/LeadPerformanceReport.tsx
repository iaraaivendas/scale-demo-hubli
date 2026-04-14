import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getPerformanceReport,
  generatePerformanceInsights,
  type PerformanceReport,
  type HealthLevel,
  type InsightSeverity,
  type RecommendationPriority,
} from "@/lib/performanceInsightsEngine";
import { getLead } from "@/lib/storage";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Target,
  Zap,
  ArrowUpCircle,
  Activity,
  Calendar,
  Globe,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface LeadPerformanceReportProps {
  leadId: string;
}

const healthConfig: Record<HealthLevel, { label: string; color: string; bg: string }> = {
  excellent: { label: "Excelente", color: "text-primary", bg: "bg-primary/20" },
  good: { label: "Bom", color: "text-info", bg: "bg-info/20" },
  attention: { label: "Atenção", color: "text-warning", bg: "bg-warning/20" },
  critical: { label: "Crítico", color: "text-destructive", bg: "bg-destructive/20" },
};

const severityConfig: Record<InsightSeverity, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  positive: { label: "Positivo", variant: "default" },
  alert: { label: "Alerta", variant: "secondary" },
  critical: { label: "Crítico", variant: "destructive" },
};

const priorityConfig: Record<RecommendationPriority, { label: string; color: string }> = {
  high: { label: "Alta", color: "text-destructive" },
  medium: { label: "Média", color: "text-warning" },
  low: { label: "Baixa", color: "text-muted-foreground" },
};

const insightIcons: Record<string, React.ElementType> = {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Star, Target, Zap,
  ArrowUpCircle, ShieldAlert: AlertTriangle, AlertOctagon: AlertTriangle, Snowflake: Clock,
};

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-primary";
  if (score >= 40) return "bg-warning";
  return "bg-destructive";
}

export function LeadPerformanceReport({ leadId }: LeadPerformanceReportProps) {
  const [report, setReport] = useState<PerformanceReport | null>(() => getPerformanceReport(leadId));
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    const lead = getLead(leadId);
    if (!lead) return;
    setRefreshing(true);
    setTimeout(() => {
      const newReport = generatePerformanceInsights(lead, report?.activationId || "manual");
      setReport(newReport);
      setRefreshing(false);
      toast({ title: "Análise Atualizada", description: "Relatório de performance regenerado com sucesso." });
    }, 800);
  };

  if (!report) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">Nenhum relatório disponível</h3>
        <p className="text-muted-foreground mt-1 text-sm">Ative a IA Performance & Insights para gerar o relatório.</p>
      </div>
    );
  }

  const health = healthConfig[report.overallHealth];

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        {/* Header with Health Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("h-14 w-14 rounded-full flex items-center justify-center", health.bg)}>
              <span className={cn("text-xl font-bold font-mono-data", health.color)}>
                {report.healthScore}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">Health Score</h4>
              <Badge variant={report.overallHealth === 'excellent' || report.overallHealth === 'good' ? 'default' : 'destructive'}>
                {health.label}
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Scores */}
        <div className="grid gap-4">
          {([
            { key: 'upsell' as const, label: 'Upsell', icon: TrendingUp },
            { key: 'crossSell' as const, label: 'Cross-Sell', icon: ArrowUpCircle },
            { key: 'churnRisk' as const, label: 'Risco de Churn', icon: ShieldCheck, inverted: true },
          ]).map(({ key, label, icon: Icon, inverted }) => {
            const scoreData = report.scores[key];
            return (
              <Card key={key} className="iara-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                    <span className="text-lg font-bold font-mono-data text-foreground">{scoreData.score}</span>
                  </div>
                  <Progress
                    value={scoreData.score}
                    className="h-2"
                    indicatorClassName={getScoreColor(inverted ? scoreData.score : scoreData.score)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">{scoreData.summary}</p>
                  {/* Factor tooltips */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {scoreData.factors.slice(0, 3).map((factor, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="text-[10px] cursor-help">
                            {factor.name}: {factor.value}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[250px]">
                          <p className="text-xs">{factor.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Insights */}
        <Card className="iara-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Insights Comportamentais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.insights.map((insight) => {
              const IconComp = insightIcons[insight.icon] || Activity;
              const severity = severityConfig[insight.severity];
              return (
                <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <IconComp className={cn("h-5 w-5 mt-0.5 shrink-0",
                    insight.severity === 'positive' ? 'text-primary' :
                    insight.severity === 'alert' ? 'text-warning' : 'text-destructive'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{insight.title}</span>
                      <Badge variant={severity.variant} className="text-[10px]">{severity.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="iara-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recomendações de Ação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.recommendations.map((rec, i) => {
              const priority = priorityConfig[rec.priority];
              return (
                <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold text-foreground shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{rec.title}</span>
                      <span className={cn("text-[10px] font-medium", priority.color)}>
                        {priority.label}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">{rec.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="iara-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Métricas de Engajamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold font-mono-data text-foreground">{report.engagementMetrics.daysSinceLastInteraction}d</p>
                <p className="text-[10px] text-muted-foreground">Desde último contato</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <Globe className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-semibold text-foreground">{report.engagementMetrics.origin}</p>
                <p className="text-[10px] text-muted-foreground">Origem</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <Target className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-semibold text-foreground capitalize">{report.engagementMetrics.funnelStatus}</p>
                <p className="text-[10px] text-muted-foreground">Status no Funil</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <BarChart3 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold font-mono-data text-foreground">{report.engagementMetrics.scoreValue}</p>
                <p className="text-[10px] text-muted-foreground">Score</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <Zap className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-semibold text-foreground">{report.engagementMetrics.poolActivated ? "Sim" : "Não"}</p>
                <p className="text-[10px] text-muted-foreground">Pool Ativo</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold font-mono-data text-foreground">{report.engagementMetrics.createdDaysAgo}d</p>
                <p className="text-[10px] text-muted-foreground">Tempo como Lead</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated timestamp */}
        <p className="text-[10px] text-muted-foreground text-center">
          Relatório gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}
        </p>
      </div>
    </TooltipProvider>
  );
}
