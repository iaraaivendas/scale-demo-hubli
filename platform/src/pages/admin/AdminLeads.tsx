import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getLeads, getClients, type Lead } from "@/lib/storage";
import { Target, Building, Zap } from "lucide-react";

export default function AdminLeads() {
  const [leads] = useState(getLeads());
  const [clients] = useState(getClients());
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredLeads = leads.filter(lead => {
    if (filterClient !== "all" && lead.clientId !== filterClient) return false;
    if (filterStatus !== "all" && lead.status !== filterStatus) return false;
    return true;
  });

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || "—";
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Visão global de todos os leads na plataforma
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="nurturing">Nutrição</SelectItem>
                <SelectItem value="cold">Frio</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="iara-card p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{filteredLeads.length}</p>
                <p className="text-xs text-muted-foreground">Total de leads</p>
              </div>
            </div>
          </Card>
          <Card className="iara-card p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {filteredLeads.filter(l => l.poolActivated).length}
                </p>
                <p className="text-xs text-muted-foreground">Com IA ativa</p>
              </div>
            </div>
          </Card>
          <Card className="iara-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-success" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {filteredLeads.filter(l => l.status === 'converted').length}
                </p>
                <p className="text-xs text-muted-foreground">Convertidos</p>
              </div>
            </div>
          </Card>
          <Card className="iara-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(filteredLeads.reduce((sum, l) => sum + l.score, 0) / filteredLeads.length) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Score médio</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Leads Table */}
        <Card className="iara-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Lead
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Origem
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                    IA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {getClientName(lead.clientId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {lead.origin}
                    </td>
                    <td className="px-6 py-4">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-6 py-4">
                      {lead.poolActivated ? (
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Zap className="h-3.5 w-3.5" />
                          <span>Ativa</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
