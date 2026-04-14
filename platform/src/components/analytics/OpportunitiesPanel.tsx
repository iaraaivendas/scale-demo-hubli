import { useState } from "react";
import { Lead } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadOpportunityCard } from "./LeadOpportunityCard";
import { 
  ArrowUpRight, 
  Layers, 
  Target,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OpportunitiesPanelProps {
  leads: Lead[];
  canViewFinancials: boolean;
}

const UPSELL_THRESHOLD = 70;
const CROSSSELL_MIN = 50;
const CROSSSELL_MAX = 69;

export function OpportunitiesPanel({ leads, canViewFinancials }: OpportunitiesPanelProps) {
  const [activeTab, setActiveTab] = useState("upsell");
  
  // Categorize leads
  const upsellLeads = leads.filter(l => 
    l.score >= UPSELL_THRESHOLD && l.status === 'converted'
  );
  
  const crossSellLeads = leads.filter(l => 
    l.score >= CROSSSELL_MIN && l.score < UPSELL_THRESHOLD && 
    ['qualified', 'converted'].includes(l.status)
  );
  
  const nurturingLeads = leads.filter(l => 
    l.score < CROSSSELL_MIN && 
    ['new', 'qualified', 'nurturing'].includes(l.status)
  ).sort((a, b) => b.score - a.score).slice(0, 6);

  const tabs = [
    {
      id: 'upsell',
      label: 'Upsell',
      icon: ArrowUpRight,
      count: upsellLeads.length,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      leads: upsellLeads,
      type: 'upsell' as const,
      description: 'Leads convertidos com score ≥70 - Potencial de expansão de conta',
    },
    {
      id: 'cross-sell',
      label: 'Cross-sell',
      icon: Layers,
      count: crossSellLeads.length,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
      leads: crossSellLeads,
      type: 'cross-sell' as const,
      description: 'Leads qualificados com score 50-69 - Oportunidade de produtos complementares',
    },
    {
      id: 'nurturing',
      label: 'Nutrição',
      icon: Target,
      count: nurturingLeads.length,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      leads: nurturingLeads,
      type: 'nurturing' as const,
      description: 'Leads ativos com score <50 - Precisam ser nutridos para subir score',
    },
  ];

  return (
    <Card className="iara-card-glow">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          Oportunidades de Upsell & Cross-sell
        </h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className={cn("h-4 w-4", activeTab === tab.id && tab.color)} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs font-mono-data",
                activeTab === tab.id ? tab.bgColor : "bg-muted"
              )}>
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {/* Tab Description */}
            <div className={cn(
              "p-3 rounded-lg border flex items-start gap-2",
              tab.bgColor, 
              tab.id === 'upsell' ? 'border-primary/20' :
              tab.id === 'cross-sell' ? 'border-accent' : 'border-warning/20'
            )}>
              <tab.icon className={cn("h-5 w-5 mt-0.5", tab.color)} />
              <div>
                <p className={cn("text-sm font-medium", tab.color)}>
                  {tab.count} {tab.count === 1 ? 'lead identificado' : 'leads identificados'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tab.description}
                </p>
              </div>
            </div>

            {/* Lead Cards */}
            {tab.leads.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {tab.leads.map(lead => (
                  <LeadOpportunityCard 
                    key={lead.id} 
                    lead={lead} 
                    opportunityType={tab.type}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum lead nesta categoria</p>
                <p className="text-sm mt-1">
                  {tab.id === 'upsell' && 'Leads convertidos com score ≥70 aparecerão aqui'}
                  {tab.id === 'cross-sell' && 'Leads qualificados com score 50-69 aparecerão aqui'}
                  {tab.id === 'nurturing' && 'Leads ativos com score <50 aparecerão aqui'}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary font-mono-data">
              {upsellLeads.length}
            </p>
            <p className="text-xs text-muted-foreground">Aptos para Upsell</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent-foreground font-mono-data">
              {crossSellLeads.length}
            </p>
            <p className="text-xs text-muted-foreground">Aptos para Cross-sell</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning font-mono-data">
              {nurturingLeads.length}
            </p>
            <p className="text-xs text-muted-foreground">Em Nutrição</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
