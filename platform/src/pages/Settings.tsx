import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSession,
  getUser,
  getClient,
  saveUser,
  type User,
  type Client,
} from "@/lib/storage";
import { User as UserIcon, Building, Zap, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "" });

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const userData = getUser(session.userId);
    const clientData = getClient(session.clientId);

    if (userData) {
      setUser(userData);
      setFormData({ name: userData.name, email: userData.email });
    }
    if (clientData) {
      setClient(clientData);
    }
  }, [navigate]);

  const handleSave = () => {
    if (!user) return;

    saveUser({ ...user, name: formData.name, email: formData.email });

    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram salvas.",
    });
  };

  const handleClearData = () => {
    if (confirm("Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.")) {
      localStorage.clear();
      navigate("/login");
      
      toast({
        title: "Dados limpos",
        description: "Todos os dados foram removidos.",
      });
    }
  };

  if (!user || !client) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seu perfil e preferências
          </p>
        </div>

        {/* Profile */}
        <Card className="iara-card-glow">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/20 p-2.5">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Perfil</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <Button variant="iara" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </Card>

        {/* Client Info */}
        <Card className="iara-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-muted p-2.5">
              <Building className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Empresa</h3>
              <p className="text-sm text-muted-foreground">{client.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-accent/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Plano
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">{client.plan}</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Pools
              </p>
              <p className="font-semibold font-mono-data mt-1">
                {client.poolsUsed} / {(client.poolsIncluded || client.poolsLimit || 0) + (client.poolsAdditional || 0)}
              </p>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="iara-card border-destructive/30">
          <h3 className="font-semibold text-destructive mb-4">Zona de Perigo</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Limpar todos os dados do LocalStorage. Esta ação irá resetar o protótipo.
          </p>
          <Button variant="destructive" onClick={handleClearData}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Todos os Dados
          </Button>
        </Card>

        {/* About */}
        <Card className="iara-card">
          <h3 className="font-semibold text-foreground mb-2">Sobre</h3>
          <p className="text-sm text-muted-foreground">
            I.ARA Scale — Protótipo funcional v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Revenue Operations & AI Growth Intelligence
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dados armazenados localmente via LocalStorage
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
