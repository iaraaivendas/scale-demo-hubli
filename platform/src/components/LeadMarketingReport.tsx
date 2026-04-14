import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getMarketingReport,
  generateMarketingInsights,
  type MarketingReport,
} from "@/lib/marketingInsightsEngine";
import { getLead } from "@/lib/storage";
import {
  RefreshCw, Star, Target, Megaphone, BookOpen, Users, Mail,
  MessageCircle, Search, Briefcase, Smartphone, Clock, Heart, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface LeadMarketingReportProps {
  leadId: string;
}

const iconMap: Record<string, React.ElementType> = {
  Star, Target, Megaphone, BookOpen, Users, Mail, MessageCircle,
  Search, Briefcase, Smartphone,
};

const priorityConfig = {
  high: { label: "Alta", color: "text-destructive" },
  medium: { label: "Média", color: "text-warning" },
  low: { label: "Baixa", color: "text-muted-foreground" },
};

export function LeadMarketingReport({ leadId }: LeadMarketingReportProps) {
  const [report, setReport] = useState<MarketingReport | null>(() => getMarketingReport(leadId));
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    const lead = getLead(leadId);
    if (!lead) return;
    setRefreshing(true);
    setTimeout(() => {
      const newReport = generateMarketingInsights(lead, report?.activationId || "manual");
      setReport(newReport);
      setRefreshing(false);
      toast({ title: "Análise Atualizada", description: "Relatório de marketing regenerado com sucesso." });
    }, 800);
  };

  if (!report) {
    return (
      <div className="text-center py-12">
        <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">Nenhum relatório disponível</h3>
        <p className="text-muted-foreground mt-1 text-sm">Ative a IA Marketing para gerar o relatório.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-pink-400/20 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-pink-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-foreground">Marketing Intelligence</h4>
            <p className="text-xs text-muted-foreground">Segmentação, campanhas e canais otimizados</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Audience Profile */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Perfil de Audiência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Activity className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold text-foreground">{report.audienceProfile.engagementLevel}</p>
              <p className="text-[10px] text-muted-foreground">Engajamento</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Heart className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold text-foreground">{report.audienceProfile.preferredChannel}</p>
              <p className="text-[10px] text-muted-foreground">Canal Preferido</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold text-foreground">{report.audienceProfile.bestContactTime}</p>
              <p className="text-[10px] text-muted-foreground">Melhor Horário</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <BookOpen className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold text-foreground">{report.audienceProfile.contentAffinity.length}</p>
              <p className="text-[10px] text-muted-foreground">Afinidades</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {report.audienceProfile.contentAffinity.map((item, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">{item}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Segments */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Segmentos Recomendados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.segments.map((seg) => {
            const Icon = iconMap[seg.icon] || Target;
            return (
              <div key={seg.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Icon className="h-5 w-5 text-pink-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{seg.name}</span>
                    <span className="text-xs font-mono text-foreground">{seg.matchScore}%</span>
                  </div>
                  <Progress value={seg.matchScore} className="h-1.5 mt-1" indicatorClassName="bg-pink-400" />
                  <p className="text-xs text-muted-foreground mt-1">{seg.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Channel Recommendations */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Canais Recomendados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.channelRecommendations.map((ch) => {
            const Icon = iconMap[ch.icon] || Mail;
            return (
              <div key={ch.channel} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{ch.channel}</span>
                    <Badge variant={ch.score >= 75 ? "default" : "secondary"} className="text-[10px]">
                      {ch.score}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ch.reason}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Suggested Campaigns */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Campanhas Sugeridas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.suggestedCampaigns.map((camp) => {
            const prio = priorityConfig[camp.priority];
            return (
              <div key={camp.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{camp.name}</span>
                  <span className={cn("text-[10px] font-medium", prio.color)}>{prio.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{camp.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-[10px]">📡 {camp.channel}</Badge>
                  <Badge variant="secondary" className="text-[10px]">🎯 {camp.estimatedConversion}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground text-center">
        Relatório gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}
      </p>
    </div>
  );
}
