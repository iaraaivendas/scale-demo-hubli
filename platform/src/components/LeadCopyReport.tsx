import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getCopyReport,
  generateCopyInsightsReport,
  type CopyReport,
} from "@/lib/copyInsightsEngine";
import { getLead } from "@/lib/storage";
import {
  RefreshCw, FileEdit, MessageCircle, Mail, Megaphone, Briefcase,
  Lightbulb, AlertTriangle, Sparkles, Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface LeadCopyReportProps {
  leadId: string;
}

const channelIcons: Record<string, React.ElementType> = {
  MessageCircle, Mail, Megaphone, Briefcase,
};

const insightTypeConfig = {
  tip: { icon: Lightbulb, color: "text-primary", label: "Dica" },
  warning: { icon: AlertTriangle, color: "text-warning", label: "Atenção" },
  optimization: { icon: Sparkles, color: "text-info", label: "Otimização" },
};

export function LeadCopyReport({ leadId }: LeadCopyReportProps) {
  const [report, setReport] = useState<CopyReport | null>(() => getCopyReport(leadId));
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRefresh = () => {
    const lead = getLead(leadId);
    if (!lead) return;
    setRefreshing(true);
    setTimeout(() => {
      const newReport = generateCopyInsightsReport(lead, report?.activationId || "manual");
      setReport(newReport);
      setRefreshing(false);
      toast({ title: "Análise Atualizada", description: "Copies regeneradas com sucesso." });
    }, 800);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
    });
  };

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">Nenhum relatório disponível</h3>
        <p className="text-muted-foreground mt-1 text-sm">Ative a IA Copy Avançada para gerar as copies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <FileEdit className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-foreground">Copy Intelligence</h4>
            <p className="text-xs text-muted-foreground">Copies otimizadas por canal e perfil</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Tone Analysis */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Análise de Tom</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">Tom recomendado:</span>
              <Badge className="text-[10px]">{report.toneAnalysis.recommended}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{report.toneAnalysis.reason}</p>
            <div className="flex gap-1.5 mt-2">
              {report.toneAnalysis.alternatives.map((alt, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{alt}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Messages */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mensagens-Chave</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.keyMessages.map((msg, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                {msg}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Copy Variants */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Copies por Canal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.variants.map((variant) => {
            const Icon = channelIcons[variant.channelIcon] || Mail;
            const fullText = `${variant.headline}\n\n${variant.body}\n\n${variant.cta}`;
            return (
              <div key={variant.id} className="p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-foreground">{variant.channel}</span>
                    <Badge variant="secondary" className="text-[10px]">{variant.tone}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">CTR: {variant.estimatedCTR}</Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(fullText, variant.id)}
                    >
                      <Copy className={cn("h-3.5 w-3.5", copiedId === variant.id ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">{variant.headline}</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{variant.body}</p>
                  <p className="text-xs font-medium text-primary">{variant.cta}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Copy Insights */}
      <Card className="iara-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Insights de Copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.insights.map((insight) => {
            const config = insightTypeConfig[insight.type];
            const InsightIcon = config.icon;
            return (
              <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <InsightIcon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{insight.title}</span>
                    <Badge variant="secondary" className="text-[10px]">{config.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
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
