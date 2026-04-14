import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/DashboardHeader";
import { 
  getSession, 
  getClient, 
  getLeads, 
  getUsers, 
  getCampaigns,
  calculateDashboardMetrics,
  initializeDemoData,
  type DashboardMetrics,
  type Lead,
  type Campaign,
  type User,
  type Client,
} from "@/lib/storage";
import { 
  getFinancialMetrics, 
  getGoalsMetrics, 
  getPoolMetrics,
  type FinancialMetrics,
  type GoalsMetrics,
  type PoolMetrics,
  type TimePeriod,
} from "@/lib/dashboardData";
import { 
  Users, 
  Target, 
  TrendingUp, 
  ArrowUpRight,
  DollarSign,
  Loader2,
  Zap,
  MessageCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LeadAIStatusBadge } from "@/components/LeadAIStatusBadge";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueBarChart } from "@/components/dashboard/RevenueBarChart";
import { RevenueLineChart } from "@/components/dashboard/RevenueLineChart";
import { GoalProgressChart } from "@/components/dashboard/GoalProgressChart";

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [goalsMetrics, setGoalsMetrics] = useState<GoalsMetrics | null>(null);
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics | null>(null);
  const [topLeads, setTopLeads] = useState<Lead[]>([]);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('year');
  
  const loadData = () => {
    initializeDemoData();
    
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const clientData = getClient(session.clientId);
    const clientUsers = getUsers(session.clientId);
    const userData = clientUsers.find(u => u.role === 'gestor') || clientUsers[0];
    
    setClient(clientData);
    setUser(userData);

    if (clientData && userData) {
      setMetrics(calculateDashboardMetrics(clientData.id));
      setFinancialMetrics(getFinancialMetrics(clientData.id));
      setGoalsMetrics(getGoalsMetrics(clientData.id));
      setPoolMetrics(getPoolMetrics(clientData));
      
      const allLeads = getLeads(clientData.id, userData.id, userData.role);
      const activeAILeads = allLeads.filter(l => 
        l.aiStatus === 'ai_active' || l.aiStatus === 'in_conversation'
      );
      const sorted = [...activeAILeads].sort((a, b) => b.score - a.score);
      setTopLeads(sorted.slice(0, 4));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!metrics || !client || !user || !financialMetrics || !goalsMetrics || !poolMetrics) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Erro ao carregar dados. Tente fazer login novamente.</div>
        </div>
      </AppLayout>
    );
  }

  const canViewFinancials = user.role === "gestor";
  const filteredRevenueHistory = period === 'month' 
    ? financialMetrics.revenueHistory.slice(-1)
    : period === 'quarter'
    ? financialMetrics.revenueHistory.slice(-3)
    : financialMetrics.revenueHistory;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <DashboardHeader />
            <p className="text-muted-foreground mt-1">
              Visão geral de {client.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DashboardFilters period={period} onPeriodChange={setPeriod} />
            <Button variant="iara" onClick={() => navigate("/whatsapp")}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Financial KPIs */}
        {canViewFinancials && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Receita Mensal"
              value={financialMetrics.monthlyRevenue}
              prefix="R$ "
              change={financialMetrics.monthlyGrowth}
              icon={DollarSign}
              variant="primary"
              privacyKey="receitaMensal"
            />
            <KPICard
              label="Receita Acumulada"
              value={financialMetrics.yearlyRevenue}
              prefix="R$ "
              icon={TrendingUp}
              variant="success"
              privacyKey="receitaAcumulada"
            />
            <KPICard
              label="Meta Mensal"
              value={goalsMetrics.monthlyGoal}
              prefix="R$ "
              suffix={` (${goalsMetrics.monthlyProgress}%)`}
              icon={Target}
              variant={goalsMetrics.monthlyProgress >= 100 ? "success" : goalsMetrics.monthlyProgress >= 70 ? "warning" : "default"}
              privacyKey="metaMensal"
            />
            <KPICard
              label="Pools Consumidos"
              value={`${poolMetrics.usagePercent}%`}
              suffix={` (${poolMetrics.used}/${poolMetrics.included + poolMetrics.additional})`}
              icon={Activity}
              variant={poolMetrics.usagePercent >= 90 ? "warning" : "info"}
            />
          </div>
        )}

        {/* Charts Row 1 */}
        {canViewFinancials && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueBarChart 
                data={filteredRevenueHistory} 
                title="Receita Mensal (últimos 12 meses)"
              />
            </div>
            <GoalProgressChart
              achieved={goalsMetrics.monthlyAchieved}
              goal={goalsMetrics.monthlyGoal}
              title="Meta Mensal"
              variant="progress"
              privacyKey="metaMensal"
            />
          </div>
        )}

        {/* Charts Row 2 */}
        {canViewFinancials && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueLineChart 
                data={filteredRevenueHistory}
                title="Evolução da Receita"
                showGoal
              />
            </div>
            <GoalProgressChart
              achieved={goalsMetrics.yearlyAchieved}
              goal={goalsMetrics.yearlyGoal}
              title="Meta Anual"
              variant="donut"
              size="lg"
            />
          </div>
        )}

        {/* AI & Leads Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="iara-card-glow p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/20">
                <Zap className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads com IA Ativa</p>
                <p className="text-2xl font-bold text-info font-mono-data">
                  {metrics.leadsWithAIActive}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="iara-card-glow p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversas em Andamento</p>
                <p className="text-2xl font-bold text-primary font-mono-data">
                  {metrics.conversationsInProgress}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="iara-card-glow p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads Ativos</p>
                <p className="text-2xl font-bold text-primary font-mono-data">
                  {metrics.activeLeads}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="iara-card-glow p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/20">
                <BarChart3 className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold text-warning font-mono-data">
                  {metrics.conversionRate}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Leads with AI Active */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Leads com IA Ativa
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/whatsapp")}>
              Ver WhatsApp
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {topLeads.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topLeads.map((lead) => (
                <Card 
                  key={lead.id} 
                  className="iara-card hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate("/whatsapp")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {lead.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.company}</p>
                      </div>
                    </div>
                    <LeadAIStatusBadge status={lead.aiStatus} size="sm" showLabel={false} />
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{lead.origin}</span>
                    {user.role !== "marketing" && (
                      <span className={cn(
                        "text-sm font-mono-data font-bold",
                        lead.score >= 70 ? "text-primary" :
                        lead.score >= 40 ? "text-warning" : "text-muted-foreground"
                      )}>
                        {lead.score}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="iara-card p-8 text-center">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhum lead com IA ativa no momento
              </p>
              <Button 
                variant="iara-outline" 
                className="mt-4"
                onClick={() => navigate("/leads")}
              >
                Ativar IA em Leads
              </Button>
            </Card>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2 hover:border-primary/50"
            onClick={() => navigate("/analytics?tab=financial")}
          >
            <DollarSign className="h-8 w-8 text-primary" />
            <span className="font-medium">Dashboard Financeiro</span>
            <span className="text-xs text-muted-foreground">Faturamento e metas</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2 hover:border-info/50"
            onClick={() => navigate("/analytics?tab=marketing")}
          >
            <BarChart3 className="h-8 w-8 text-info" />
            <span className="font-medium">Dashboard Marketing</span>
            <span className="text-xs text-muted-foreground">Performance de campanhas</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col gap-2 hover:border-warning/50"
            onClick={() => navigate("/analytics?tab=goals")}
          >
            <Target className="h-8 w-8 text-warning" />
            <span className="font-medium">Dashboard de Metas</span>
            <span className="text-xs text-muted-foreground">Acompanhamento de objetivos</span>
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
