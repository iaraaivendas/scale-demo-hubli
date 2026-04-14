import { AdminLayout } from "@/components/AdminLayout";
import { MetricCard } from "@/components/MetricCard";
import { Card } from "@/components/ui/card";
import { getClients, getUsers, getLeads, getCampaigns } from "@/lib/storage";
import { Building, Users, Target, Megaphone, TrendingUp, Zap } from "lucide-react";

export default function AdminDashboard() {
  const clients = getClients();
  const users = getUsers();
  const leads = getLeads();
  const campaigns = getCampaigns();
  
  const activeClients = clients.filter(c => c.status === "active").length;
  const totalPools = clients.reduce((sum, c) => sum + (c.poolsIncluded || c.poolsLimit || 0) + (c.poolsAdditional || 0), 0);
  const usedPools = clients.reduce((sum, c) => sum + c.poolsUsed, 0);
  const poolUsagePercent = totalPools > 0 ? Math.round((usedPools / totalPools) * 100) : 0;
  
  const revenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da plataforma I.ARA Scale
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Clientes Ativos"
            value={activeClients}
            subtitle={`${clients.length} total`}
            icon={Building}
            change={12}
          />
          <MetricCard
            label="Usuários"
            value={users.length}
            subtitle="Na plataforma"
            icon={Users}
          />
          <MetricCard
            label="Leads Totais"
            value={leads.length}
            subtitle="Todos os clientes"
            icon={Target}
            change={8}
          />
          <MetricCard
            label="Campanhas"
            value={campaigns.length}
            subtitle="Em execução"
            icon={Megaphone}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="iara-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pools Consumidos</p>
                <p className="text-2xl font-bold text-foreground">
                  {usedPools.toLocaleString()} / {totalPools.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {poolUsagePercent}% utilização
                </p>
              </div>
            </div>
          </Card>

          <Card className="iara-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {revenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Todas as campanhas
                </p>
              </div>
            </div>
          </Card>

          <Card className="iara-card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Building className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planos</p>
                <div className="flex gap-2 mt-1">
                  {['ESSENCIAL', 'GROWTH', 'PRO'].map(plan => {
                    const count = clients.filter(c => c.plan === plan).length;
                    return (
                      <span key={plan} className="text-xs bg-muted px-2 py-1 rounded">
                        {plan}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Clients List */}
        <Card className="iara-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Clientes Recentes
          </h2>
          <div className="space-y-3">
            {clients.slice(0, 5).map(client => (
              <div
                key={client.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-foreground">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.plan}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {client.poolsUsed} / {(client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">pools</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
