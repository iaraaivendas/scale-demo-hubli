import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getClients, 
  saveClient, 
  deleteClient, 
  generateId,
  type Client 
} from "@/lib/storage";
import { PLANS, formatCurrency, type PlanId } from "@/lib/plans";
import { Plus, Building, Trash2, Edit, Zap, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminClients() {
  const [clients, setClients] = useState(getClients());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    plan: "ESSENCIAL" as Client["plan"],
    status: "active" as Client["status"],
  });

  const refreshClients = () => setClients(getClients());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const plan = PLANS[formData.plan];
    const client: Client = editingClient 
      ? {
          ...editingClient,
          name: formData.name,
          plan: formData.plan,
          status: formData.status,
          poolsIncluded: plan.poolsIncluded,
          userLimit: plan.userLimit,
          monthlyPrice: plan.monthlyPrice,
          poolsLimit: plan.poolsIncluded,
        }
      : {
          id: generateId("client"),
          name: formData.name,
          plan: formData.plan,
          status: formData.status,
          poolsIncluded: plan.poolsIncluded,
          poolsAdditional: 0,
          poolsUsed: 0,
          userLimit: plan.userLimit,
          monthlyPrice: plan.monthlyPrice,
          createdAt: new Date().toISOString().split("T")[0],
          poolsLimit: plan.poolsIncluded,
        };
    
    saveClient(client);
    refreshClients();
    setIsDialogOpen(false);
    setEditingClient(null);
    setFormData({ name: "", plan: "ESSENCIAL", status: "active" });
    
    toast({
      title: editingClient ? "Cliente atualizado" : "Cliente criado",
      description: `${client.name} foi ${editingClient ? "atualizado" : "adicionado"} com sucesso.`,
    });
  };

  // Helper to get total pools
  const getTotalPools = (client: Client) => 
    (client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      plan: client.plan,
      status: client.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    deleteClient(client.id);
    refreshClients();
    toast({
      title: "Cliente removido",
      description: `${client.name} foi removido da plataforma.`,
      variant: "destructive",
    });
  };

  const handleToggleStatus = (client: Client) => {
    const updatedClient = {
      ...client,
      status: client.status === "active" ? "inactive" as const : "active" as const,
    };
    saveClient(updatedClient);
    refreshClients();
    toast({
      title: `Cliente ${updatedClient.status === "active" ? "ativado" : "desativado"}`,
      description: `${client.name} foi ${updatedClient.status === "active" ? "ativado" : "desativado"}.`,
    });
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os clientes da plataforma
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingClient(null);
              setFormData({ name: "", plan: "ESSENCIAL", status: "active" });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="iara">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan">Plano</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value: Client["plan"]) => 
                      setFormData(prev => ({ ...prev, plan: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESSENCIAL">Essencial — {PLANS.ESSENCIAL.poolsIncluded.toLocaleString()} pools/mês</SelectItem>
                      <SelectItem value="GROWTH">Growth — {PLANS.GROWTH.poolsIncluded.toLocaleString()} pools/mês</SelectItem>
                      <SelectItem value="PRO">Pro — {PLANS.PRO.poolsIncluded.toLocaleString()} pools/mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Client["status"]) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="iara">
                    {editingClient ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <Card key={client.id} className="iara-card p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${client.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(client)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium text-primary">{client.plan}</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pools</span>
                    <span className="font-medium">
                      {client.poolsUsed} / {getTotalPools(client)}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(client.poolsUsed / getTotalPools(client)) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggleStatus(client)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {client.status === 'active' ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
