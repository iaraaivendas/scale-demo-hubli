import { useState, useMemo } from "react";
import { 
  CustomerAnalysis, 
  ScoreFilter, 
  analyzeCustomerBase, 
  filterAnalyses, 
  sortAnalyses, 
  summarizeCustomerBase,
  CustomerBaseSummary 
} from "@/lib/revenueScorer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RevenueScoreCard } from "./RevenueScoreCard";
import { RevenueScoreDetail } from "./RevenueScoreDetail";
import { 
  BarChart3, 
  ArrowUpRight, 
  Layers, 
  AlertTriangle, 
  Users,
  Search,
  SortAsc,
  SortDesc,
  TrendingUp,
  Shield,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueScoreDashboardProps {
  clientId: string;
}

export function RevenueScoreDashboard({ clientId }: RevenueScoreDashboardProps) {
  const [filter, setFilter] = useState<ScoreFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAnalysis, setSelectedAnalysis] = useState<CustomerAnalysis | null>(null);

  // Analyze customer base
  const analyses = useMemo(() => {
    return analyzeCustomerBase(clientId);
  }, [clientId]);

  // Summary stats
  const summary = useMemo(() => {
    return summarizeCustomerBase(analyses);
  }, [analyses]);

  // Filter and sort
  const filteredAnalyses = useMemo(() => {
    let result = analyses;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.lead.name.toLowerCase().includes(query) ||
        a.lead.email.toLowerCase().includes(query) ||
        (a.lead.company && a.lead.company.toLowerCase().includes(query))
      );
    }

    // Apply score filter
    if (filter !== 'all') {
      result = filterAnalyses(result, filter, 40); // Min score of 40 for filtering
    }

    // Apply sort
    result = sortAnalyses(result, filter, sortDirection);

    return result;
  }, [analyses, filter, searchQuery, sortDirection]);

  const handleSelectAnalysis = (analysis: CustomerAnalysis) => {
    setSelectedAnalysis(analysis);
  };

  const handleCloseDetail = () => {
    setSelectedAnalysis(null);
  };

  const tabs = [
    { id: 'all' as ScoreFilter, label: 'Todos', icon: Users, count: summary.total },
    { id: 'upsell' as ScoreFilter, label: 'Upsell', icon: ArrowUpRight, count: summary.upsellReady, color: 'text-primary' },
    { id: 'crossSell' as ScoreFilter, label: 'Cross-sell', icon: Layers, count: summary.crossSellReady, color: 'text-accent-foreground' },
    { id: 'churnRisk' as ScoreFilter, label: 'Risco Churn', icon: AlertTriangle, count: summary.churnRisk, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Potencial Upsell"
          value={summary.upsellReady}
          subtitle={`Média: ${summary.averageUpsell}`}
          icon={ArrowUpRight}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <SummaryCard
          title="Potencial Cross-sell"
          value={summary.crossSellReady}
          subtitle={`Média: ${summary.averageCrossSell}`}
          icon={Layers}
          color="text-accent-foreground"
          bgColor="bg-accent/30"
        />
        <SummaryCard
          title="Em Risco"
          value={summary.churnRisk}
          subtitle="Ação imediata"
          icon={AlertTriangle}
          color="text-destructive"
          bgColor="bg-destructive/10"
        />
        <SummaryCard
          title="Clientes Saudáveis"
          value={summary.healthy}
          subtitle={`Saúde média: ${summary.averageHealth}`}
          icon={Shield}
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </div>

      {/* Filters & Tabs */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as ScoreFilter)} className="flex-1">
            <TabsList className="grid grid-cols-4 w-full lg:w-auto">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <tab.icon className={cn("h-4 w-4", filter === tab.id && tab.color)} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs font-mono-data",
                    filter === tab.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {tab.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Search & Sort */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <button
              onClick={() => setSortDirection(d => d === 'desc' ? 'asc' : 'desc')}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title={sortDirection === 'desc' ? 'Maior para menor' : 'Menor para maior'}
            >
              {sortDirection === 'desc' ? (
                <SortDesc className="h-5 w-5 text-muted-foreground" />
              ) : (
                <SortAsc className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Detail View */}
      {selectedAnalysis && (
        <RevenueScoreDetail 
          analysis={selectedAnalysis} 
          onClose={handleCloseDetail} 
        />
      )}

      {/* Customer List */}
      <div className="space-y-3">
        {filteredAnalyses.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAnalyses.map(analysis => (
                <RevenueScoreCard
                  key={analysis.lead.id}
                  analysis={analysis}
                  onSelect={handleSelectAnalysis}
                />
              ))}
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-foreground mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery 
                ? 'Tente ajustar sua busca'
                : 'Cadastre leads para começar a análise'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============= Helper Components =============

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function SummaryCard({ title, value, subtitle, icon: Icon, color, bgColor }: SummaryCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-bold font-mono-data mt-1", color)}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={cn("p-2.5 rounded-lg", bgColor)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
    </Card>
  );
}
