import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  getSession,
  getCampaigns,
  getUser,
  saveCampaign,
  generateId,
  type Campaign,
} from "@/lib/storage";
import { formatROI, getROIColorClass, percent } from "@/lib/financialData";
import {
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Megaphone,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const channelColors: Record<string, string> = {
  "Meta Ads": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Google Ads": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  LinkedIn: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  Email: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Organic: "bg-primary/20 text-primary border-primary/30",
};

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(undefined);

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "Meta Ads" as Campaign["channel"],
    budget: "",
  });

  const loadCampaigns = () => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const userData = getUser(session.userId);
    setUser(userData);

    if (userData?.role === "vendedor") {
      navigate("/dashboard");
      return;
    }

    setCampaigns(getCampaigns(session.clientId));
  };

  useEffect(() => {
    loadCampaigns();
  }, [navigate]);

  const handleAddCampaign = () => {
    const session = getSession();
    if (!session) return;

    const budget = parseFloat(newCampaign.budget) || 0;

    const campaign: Campaign = {
      id: generateId("camp"),
      clientId: session.clientId,
      name: newCampaign.name,
      channel: newCampaign.channel,
      status: "active",
      budget,
      spent: 0,
      leads: 0,
      conversions: 0,
      revenue: 0,
      startDate: new Date().toISOString().split("T")[0],
    };

    saveCampaign(campaign);
    loadCampaigns();
    setIsAddDialogOpen(false);
    setNewCampaign({ name: "", channel: "Meta Ads", budget: "" });

    toast({
      title: "Campanha criada!",
      description: `${campaign.name} está pronta para uso.`,
    });
  };

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const overallROI = percent(totalRevenue - totalSpent, totalSpent);

  const canViewFinancials = user?.role === "gestor";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Campanhas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas campanhas e acompanhe o ROI
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="iara">
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Criar Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome da Campanha *</Label>
                  <Input
                    placeholder="Ex: Black Friday 2025"
                    value={newCampaign.name}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select
                    value={newCampaign.channel}
                    onValueChange={(value) =>
                      setNewCampaign({
                        ...newCampaign,
                        channel: value as Campaign["channel"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Organic">Orgânico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Orçamento (R$)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={newCampaign.budget}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, budget: e.target.value })
                    }
                  />
                </div>
                <Button
                  variant="iara"
                  className="w-full"
                  onClick={handleAddCampaign}
                  disabled={!newCampaign.name}
                >
                  Criar Campanha
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="iara-card flex flex-col">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Megaphone className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Campanhas</span>
            </div>
            <p className="text-2xl font-bold font-mono-data">{campaigns.length}</p>
          </Card>
          <Card className="iara-card flex flex-col">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Leads</span>
            </div>
            <p className="text-2xl font-bold text-primary font-mono-data">
              {totalLeads}
            </p>
          </Card>
          <Card className="iara-card flex flex-col">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Conversões</span>
            </div>
            <p className="text-2xl font-bold text-primary font-mono-data">
              {totalConversions}
            </p>
          </Card>
          {canViewFinancials && (
            <>
              <Card className="iara-card flex flex-col">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Receita</span>
                </div>
                <p className="text-2xl font-bold text-primary font-mono-data">
                  R$ {(totalRevenue / 1000).toFixed(0)}k
                </p>
              </Card>
              <Card className="iara-card-glow flex flex-col">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">ROI</span>
                </div>
                <p
                  className={cn(
                    "text-2xl font-bold font-mono-data",
                    getROIColorClass(overallROI),
                    overallROI > 0 && "glow-text"
                  )}
                >
                  {formatROI(overallROI)}
                </p>
              </Card>
            </>
          )}
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((campaign) => {
            const roi = percent(campaign.revenue - campaign.spent, campaign.spent);
            const conversionRate =
              campaign.leads > 0
                ? Math.round((campaign.conversions / campaign.leads) * 100)
                : 0;

            return (
              <Card
                key={campaign.id}
                className="iara-card-glow hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          campaign.status === "active"
                            ? "bg-primary animate-pulse"
                            : "bg-muted-foreground"
                        )}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {campaign.status === "active" ? "Ativa" : campaign.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {campaign.name}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border",
                      channelColors[campaign.channel]
                    )}
                  >
                    {campaign.channel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Leads</p>
                    <p className="text-xl font-bold font-mono-data">
                      {campaign.leads}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversões</p>
                    <p className="text-xl font-bold text-primary font-mono-data">
                      {campaign.conversions}
                    </p>
                  </div>
                </div>

                {canViewFinancials && (
                  <>
                    <div className="pt-4 border-t border-border space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Investido</span>
                        <span className="font-mono-data">
                          R$ {campaign.spent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Receita</span>
                        <span className="font-mono-data text-primary">
                          R$ {campaign.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div className="flex items-center gap-2">
                        {roi > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        ) : roi < 0 ? (
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                        ) : null}
                        <span className="text-sm font-medium">ROI</span>
                      </div>
                      <span
                        className={cn(
                          "text-lg font-bold font-mono-data",
                          getROIColorClass(roi)
                        )}
                      >
                        {formatROI(roi)}
                      </span>
                    </div>
                  </>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Início: {new Date(campaign.startDate).toLocaleDateString("pt-BR")}
                  </span>
                  <span>Conv. Rate: {conversionRate}%</span>
                </div>
              </Card>
            );
          })}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              Nenhuma campanha encontrada
            </h3>
            <p className="text-muted-foreground mt-1">
              Crie sua primeira campanha para começar
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
