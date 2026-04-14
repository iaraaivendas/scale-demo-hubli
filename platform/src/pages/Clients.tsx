import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getSession,
  getClients,
  getUser,
  saveClient,
  generateId,
  type Client,
} from "@/lib/storage";
import { PLANS, formatCurrency, type PlanId } from "@/lib/plans";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Plus,
  Building,
  Zap,
  Calendar,
  Edit,
  Power,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(undefined);

  const [formData, setFormData] = useState({
    name: "",
    plan: "ESSENCIAL" as Client["plan"],
  });

  const loadClients = () => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const userData = getUser(session.userId);
    setUser(userData);

    if (userData?.role !== "gestor") {
      navigate("/dashboard");
      return;
    }

    setClients(getClients());
  };

  useEffect(() => {
    loadClients();
  }, [navigate]);

  const handleAddClient = () => {
    const plan = PLANS[formData.plan];
    const client: Client = {
      id: generateId("client"),
      name: formData.name,
      status: "active",
      plan: formData.plan,
      poolsIncluded: plan.poolsIncluded,
      poolsAdditional: 0,
      poolsUsed: 0,
      userLimit: plan.userLimit,
      monthlyPrice: plan.monthlyPrice,
      createdAt: new Date().toISOString().split("T")[0],
      // Legacy compatibility
      poolsLimit: plan.poolsIncluded,
    };

    saveClient(client);
    loadClients();
    setIsAddDialogOpen(false);
    setFormData({ name: "", plan: "ESSENCIAL" });

    toast({
      title: "Cliente criado!",
      description: `${client.name} foi adicionado com sucesso.`,
    });
  };

  const handleToggleStatus = (client: Client) => {
    const newStatus = client.status === "active" ? "inactive" : "active";
    saveClient({ ...client, status: newStatus });
    loadClients();

    toast({
      title: newStatus === "active" ? "Cliente ativado" : "Cliente desativado",
      description:
        newStatus === "active"
          ? "O cliente pode usar a IA novamente."
          : "Pools pausados e IA desativada.",
    });
  };

  const handleEditClient = () => {
    if (!editingClient) return;

    const plan = PLANS[formData.plan];
    saveClient({
      ...editingClient,
      name: formData.name || editingClient.name,
      plan: formData.plan,
      poolsIncluded: plan.poolsIncluded,
      userLimit: plan.userLimit,
      monthlyPrice: plan.monthlyPrice,
      poolsLimit: plan.poolsIncluded,
    });

    loadClients();
    setEditingClient(null);
    setFormData({ name: "", plan: "ESSENCIAL" });

    toast({
      title: "Cliente atualizado!",
      description: "As alterações foram salvas.",
    });
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, plan: client.plan });
  };

  // Helper to get total pools (included + additional)
  const getTotalPools = (client: Client) => 
    (client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie clientes e seus planos
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="iara">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Adicionar Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa *</Label>
                  <Input
                    placeholder="Nome da empresa"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) =>
                      setFormData({ ...formData, plan: value as Client["plan"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="ESSENCIAL">
                        Essencial — {PLANS.ESSENCIAL.poolsIncluded.toLocaleString()} pools/mês
                      </SelectItem>
                      <SelectItem value="GROWTH">
                        Growth — {PLANS.GROWTH.poolsIncluded.toLocaleString()} pools/mês
                      </SelectItem>
                      <SelectItem value="PRO">
                        Pro — {PLANS.PRO.poolsIncluded.toLocaleString()} pools/mês
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 rounded-lg bg-accent/30 text-sm">
                  <p className="text-muted-foreground">
                    Mensalidade:{" "}
                    <span className="text-primary font-semibold">
                      {formatCurrency(PLANS[formData.plan].monthlyPrice)}
                    </span>
                  </p>
                </div>
                <Button
                  variant="iara"
                  className="w-full"
                  onClick={handleAddClient}
                  disabled={!formData.name}
                >
                  Criar Cliente
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
        >
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  placeholder="Nome da empresa"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, plan: value as Client["plan"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="ESSENCIAL">
                      Essencial — {PLANS.ESSENCIAL.poolsIncluded.toLocaleString()} pools/mês
                    </SelectItem>
                    <SelectItem value="GROWTH">
                      Growth — {PLANS.GROWTH.poolsIncluded.toLocaleString()} pools/mês
                    </SelectItem>
                    <SelectItem value="PRO">
                      Pro — {PLANS.PRO.poolsIncluded.toLocaleString()} pools/mês
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="iara" className="w-full" onClick={handleEditClient}>
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => {
            const totalPools = getTotalPools(client);
            const poolPercentage = totalPools > 0 ? Math.round(
              (client.poolsUsed / totalPools) * 100
            ) : 0;

            return (
              <Card
                key={client.id}
                className={cn(
                  "iara-card-glow transition-all",
                  client.status === "inactive" && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-lg p-2.5",
                        client.status === "active"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {client.name}
                      </h3>
                      <StatusBadge status={client.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleToggleStatus(client)}
                      className={cn(
                        client.status === "active"
                          ? "text-destructive hover:text-destructive"
                          : "text-primary hover:text-primary"
                      )}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <span
                    className={cn(
                      "text-sm font-semibold px-2 py-0.5 rounded",
                      client.plan === "PRO"
                        ? "bg-primary/20 text-primary"
                        : client.plan === "GROWTH"
                        ? "bg-info/20 text-info"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {client.plan}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(client.monthlyPrice || PLANS[client.plan].monthlyPrice)}/mês
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pools</span>
                    <span className="font-mono-data">
                      {client.poolsUsed.toLocaleString()} /{" "}
                      {totalPools.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-iara">
                    <div
                      className={cn(
                        "progress-iara-fill",
                        poolPercentage >= 100 && "!bg-destructive",
                        poolPercentage >= 80 &&
                          poolPercentage < 100 &&
                          "!bg-gradient-to-r !from-warning !to-orange-400"
                      )}
                      style={{ width: `${Math.min(poolPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {poolPercentage}% utilizado
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Desde {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              Nenhum cliente encontrado
            </h3>
            <p className="text-muted-foreground mt-1">
              Adicione seu primeiro cliente para começar
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
