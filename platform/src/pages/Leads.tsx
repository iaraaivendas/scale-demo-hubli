import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadAIStatusBadge, LeadAIStatusDot } from "@/components/LeadAIStatusBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SelectAIModal } from "@/components/SelectAIModal";
import { LeadAIList } from "@/components/LeadAIList";
import { LeadAIActivationHistory } from "@/components/LeadAIActivationHistory";
import { LeadPerformanceReport } from "@/components/LeadPerformanceReport";
import { LeadMarketingReport } from "@/components/LeadMarketingReport";
import { LeadCopyReport } from "@/components/LeadCopyReport";
import { AITypeIcon } from "@/components/AITypeIcon";
import {
  getSession,
  getLeads,
  getUser,
  getClient,
  getUsers,
  saveLead,
  generateId,
  getLeadAIActivations,
  activateAITypeForLead,
  pauseLeadAI,
  resumeLeadAI,
  finishLeadAI,
  getScore,
  initializeDemoData,
  type Lead,
  type LeadAIStatus,
  type Client,
  type User,
} from "@/lib/storage";
import { AI_TYPES, type AITypeId, type LeadAIActivation } from "@/lib/aiTypes";
import { ImportLeadsModal } from "@/components/ImportLeadsModal";
import { ExportLeadsModal } from "@/components/ExportLeadsModal";
import { 
  Search, 
  Plus, 
  Filter, 
  Users, 
  Target, 
  Zap,
  Mail,
  Phone,
  Building,
  Calendar,
  MessageCircle,
  Eye,
  ChevronRight,
  Upload,
  FileDown,
  LineChart,
  Megaphone,
  FileEdit,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const aiStatusOptions = [
  { value: "all", label: "Todos os Status IA" },
  { value: "not_activated", label: "🟡 Não ativado" },
  { value: "ai_active", label: "🔵 IA ativa" },
  { value: "in_conversation", label: "🟢 Em conversa" },
  { value: "scheduled", label: "🟣 Agendado" },
  { value: "archived", label: "⚫ Arquivado" },
];

const originOptions = [
  { value: "all", label: "Todas as Origens" },
  { value: "Meta Ads", label: "Meta Ads" },
  { value: "Google Ads", label: "Google Ads" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Organic", label: "Orgânico" },
  { value: "Email", label: "Email" },
];

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [aiStatusFilter, setAiStatusFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showSelectAIModal, setShowSelectAIModal] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [leadActivations, setLeadActivations] = useState<LeadAIActivation[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // New lead form state
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    origin: "Organic",
  });

  const loadLeads = () => {
    initializeDemoData();
    
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const clientUsers = getUsers(session.clientId);
    const userData = clientUsers.find(u => u.role === 'gestor') || clientUsers[0];
    const clientData = getClient(session.clientId);
    
    setUser(userData);
    setClient(clientData);
    
    const allLeads = getLeads(session.clientId, userData?.id, userData?.role);
    setLeads(allLeads);
    setFilteredLeads(allLeads);
  };

  const loadLeadActivations = (leadId: string) => {
    const activations = getLeadAIActivations(leadId);
    setLeadActivations(activations);
  };

  useEffect(() => {
    loadLeads();
  }, [navigate]);

  useEffect(() => {
    if (selectedLead) {
      loadLeadActivations(selectedLead.id);
    }
  }, [selectedLead]);

  useEffect(() => {
    let result = leads;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          lead.company?.toLowerCase().includes(searchLower)
      );
    }

    // AI Status filter
    if (aiStatusFilter !== "all") {
      result = result.filter((lead) => lead.aiStatus === aiStatusFilter);
    }

    // Origin filter
    if (originFilter !== "all") {
      result = result.filter((lead) => lead.origin === originFilter);
    }

    setFilteredLeads(result);
  }, [search, aiStatusFilter, originFilter, leads]);

  const handleAddLead = () => {
    const session = getSession();
    if (!session) return;

    const lead: Lead = {
      id: generateId("lead"),
      clientId: session.clientId,
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      company: newLead.company,
      status: "new",
      aiStatus: "not_activated",
      origin: newLead.origin,
      lastInteraction: new Date().toISOString().split("T")[0],
      score: Math.floor(Math.random() * 30) + 40,
      poolActivated: false,
      createdAt: new Date().toISOString().split("T")[0],
    };

    saveLead(lead);
    loadLeads();
    setIsAddDialogOpen(false);
    setNewLead({ name: "", email: "", phone: "", company: "", origin: "Organic" });

    toast({
      title: "Lead adicionado!",
      description: `${lead.name} foi adicionado à sua base.`,
    });
  };

  const handleActivateAI = async (aiTypeId: AITypeId) => {
    const session = getSession();
    if (!session || !user || !selectedLead) return { success: false, message: "Sessão inválida" };
    
    const result = activateAITypeForLead(
      selectedLead.id, 
      session.clientId, 
      aiTypeId,
      user.id, 
      user.name
    );
    
    if (result.success) {
      loadLeads();
      loadLeadActivations(selectedLead.id);
      // Refresh selected lead
      const updatedLeads = getLeads(session.clientId, user?.id, user?.role);
      const updatedLead = updatedLeads.find(l => l.id === selectedLead.id);
      if (updatedLead) setSelectedLead(updatedLead);
      
      toast({
        title: "IA Ativada!",
        description: result.message,
      });
    }
    
    return result;
  };

  const handlePauseAI = (activationId: string) => {
    const success = pauseLeadAI(activationId);
    if (success) {
      loadLeads();
      if (selectedLead) loadLeadActivations(selectedLead.id);
      toast({
        title: "IA Pausada",
        description: "A IA foi pausada para este lead.",
      });
    }
  };

  const handleResumeAI = (activationId: string) => {
    const success = resumeLeadAI(activationId);
    if (success) {
      loadLeads();
      if (selectedLead) loadLeadActivations(selectedLead.id);
      toast({
        title: "IA Retomada",
        description: "A IA foi reativada para este lead.",
      });
    }
  };

  const handleFinishAI = (activationId: string) => {
    const success = finishLeadAI(activationId);
    if (success) {
      loadLeads();
      if (selectedLead) loadLeadActivations(selectedLead.id);
      toast({
        title: "IA Finalizada",
        description: "A IA foi finalizada e arquivada.",
      });
    }
  };

  const handleViewConversation = (aiTypeId: AITypeId) => {
    navigate("/whatsapp");
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailPanel(true);
  };

  // Get active AI count for a lead
  const getActiveAICount = (leadId: string) => {
    const activations = getLeadAIActivations(leadId);
    return activations.filter(a => a.status === 'active' || a.status === 'paused').length;
  };

  // Statistics
  const stats = {
    total: filteredLeads.length,
    notActivated: filteredLeads.filter(l => l.aiStatus === 'not_activated').length,
    aiActive: filteredLeads.filter(l => l.aiStatus === 'ai_active').length,
    inConversation: filteredLeads.filter(l => l.aiStatus === 'in_conversation').length,
    scheduled: filteredLeads.filter(l => l.aiStatus === 'scheduled').length,
    archived: filteredLeads.filter(l => l.aiStatus === 'archived').length,
  };

  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Main Content */}
        <div className={cn(
          "flex-1 p-6 lg:p-8 space-y-6 animate-fade-in transition-all duration-300",
          showDetailPanel && "lg:pr-0"
        )}>
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Leads
              </h1>
              <p className="text-muted-foreground mt-1">
                Centro de controle de IAs — Ative, pause e gerencie IAs por lead
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" onClick={() => setShowExportModal(true)}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="iara">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Adicionar Lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Nome do lead"
                      value={newLead.name}
                      onChange={(e) =>
                        setNewLead({ ...newLead, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newLead.email}
                      onChange={(e) =>
                        setNewLead({ ...newLead, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={newLead.phone}
                      onChange={(e) =>
                        setNewLead({ ...newLead, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input
                      placeholder="Nome da empresa"
                      value={newLead.company}
                      onChange={(e) =>
                        setNewLead({ ...newLead, company: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select
                      value={newLead.origin}
                      onValueChange={(value) =>
                        setNewLead({ ...newLead, origin: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Meta Ads">Meta Ads</SelectItem>
                        <SelectItem value="Google Ads">Google Ads</SelectItem>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Organic">Orgânico</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="iara"
                    className="w-full"
                    onClick={handleAddLead}
                    disabled={!newLead.name || !newLead.email}
                  >
                    Adicionar Lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* AI Status Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card 
              className={cn(
                "iara-card p-4 cursor-pointer transition-all hover:border-primary/30",
                aiStatusFilter === "all" && "border-primary/50 bg-primary/5"
              )}
              onClick={() => setAiStatusFilter("all")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono-data">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
            <Card 
              className={cn(
                "iara-card p-4 cursor-pointer transition-all hover:border-warning/30",
                aiStatusFilter === "not_activated" && "border-warning/50 bg-warning/5"
              )}
              onClick={() => setAiStatusFilter("not_activated")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/20 p-2">
                  <Target className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning font-mono-data">{stats.notActivated}</p>
                  <p className="text-xs text-muted-foreground">Não ativados</p>
                </div>
              </div>
            </Card>
            <Card 
              className={cn(
                "iara-card p-4 cursor-pointer transition-all hover:border-info/30",
                aiStatusFilter === "ai_active" && "border-info/50 bg-info/5"
              )}
              onClick={() => setAiStatusFilter("ai_active")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-info/20 p-2">
                  <Zap className="h-4 w-4 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-info font-mono-data">{stats.aiActive}</p>
                  <p className="text-xs text-muted-foreground">IA ativa</p>
                </div>
              </div>
            </Card>
            <Card 
              className={cn(
                "iara-card p-4 cursor-pointer transition-all hover:border-primary/30",
                aiStatusFilter === "in_conversation" && "border-primary/50 bg-primary/5"
              )}
              onClick={() => setAiStatusFilter("in_conversation")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary font-mono-data">{stats.inConversation}</p>
                  <p className="text-xs text-muted-foreground">Em conversa</p>
                </div>
              </div>
            </Card>
            <Card 
              className={cn(
                "iara-card p-4 cursor-pointer transition-all hover:border-purple-400/30",
                aiStatusFilter === "scheduled" && "border-purple-400/50 bg-purple-400/5"
              )}
              onClick={() => setAiStatusFilter("scheduled")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-400/20 p-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400 font-mono-data">{stats.scheduled}</p>
                  <p className="text-xs text-muted-foreground">Agendados</p>
                </div>
              </div>
            </Card>
            <Card 
              className={cn(
                "iara-card p-4 cursor-pointer transition-all hover:border-muted-foreground/30",
                aiStatusFilter === "archived" && "border-muted-foreground/50 bg-muted"
              )}
              onClick={() => setAiStatusFilter("archived")}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground font-mono-data">{stats.archived}</p>
                  <p className="text-xs text-muted-foreground">Arquivados</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={aiStatusFilter} onValueChange={setAiStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {aiStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {originOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Leads Table */}
          <Card className="iara-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status IA
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      IAs Ativas
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Origem
                    </th>
                    {user?.role !== "marketing" && (
                      <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Score
                      </th>
                    )}
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const activeAICount = getActiveAICount(lead.id);
                    const leadAIs = getLeadAIActivations(lead.id).filter(a => a.status === 'active');
                    
                    return (
                      <tr 
                        key={lead.id} 
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer group"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <td className="py-4 px-4">
                          <LeadAIStatusBadge status={lead.aiStatus} size="sm" />
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {lead.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{lead.name}</p>
                              <p className="text-xs text-muted-foreground">{lead.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {activeAICount > 0 ? (
                            <div className="flex flex-col gap-1">
                              {leadAIs.slice(0, 2).map((activation) => {
                                const aiType = AI_TYPES[activation.aiTypeId];
                                return (
                                  <div
                                    key={activation.id}
                                    className={cn(
                                      "flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10",
                                      aiType.color
                                    )}
                                    title={aiType.name}
                                  >
                                    <span className="text-primary text-xs">🟢</span>
                                    <AITypeIcon aiTypeId={activation.aiTypeId} size="sm" />
                                    <span className={cn("text-xs font-medium", aiType.color)}>
                                      {aiType.name.replace('IA ', '')} — Ativa
                                    </span>
                                  </div>
                                );
                              })}
                              {activeAICount > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{activeAICount - 2} mais
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{lead.email}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">{lead.origin}</span>
                        </td>
                        {user?.role !== "marketing" && (
                          <td className="py-4 px-4 text-center">
                            <ScoreBadge score={lead.score} size="sm" />
                          </td>
                        )}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="iara"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                setShowSelectAIModal(true);
                              }}
                              className="gap-1.5"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              {lead.aiStatus === 'not_activated' ? 'Ativar IA' : 'Gerenciar IAs'}
                            </Button>
                            {(lead.aiStatus === 'ai_active' || lead.aiStatus === 'in_conversation') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/whatsapp");
                                }}
                                className="gap-1.5"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Conversa
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeadClick(lead);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">
                  Nenhum lead encontrado
                </h3>
                <p className="text-muted-foreground mt-1">
                  Tente ajustar os filtros ou adicione um novo lead
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Detail Panel - Painel de Controle de IAs (Full Screen Overlay) */}
        {showDetailPanel && selectedLead && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowDetailPanel(false)}>
            <div 
              className="absolute inset-y-0 right-0 w-full max-w-3xl bg-card border-l border-border shadow-xl p-6 lg:p-8 overflow-y-auto animate-slide-in-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Painel de Controle</h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDetailPanel(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="ais" className="w-full">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="ais" className="flex-1 gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    IAs
                  </TabsTrigger>
                  {leadActivations.some(a => a.aiTypeId === 'performance' && (a.status === 'active' || a.status === 'finished')) && (
                    <TabsTrigger value="performance" className="flex-1 gap-1.5">
                      <LineChart className="h-3.5 w-3.5" />
                      Performance
                    </TabsTrigger>
                  )}
                  {leadActivations.some(a => a.aiTypeId === 'marketing' && (a.status === 'active' || a.status === 'finished')) && (
                    <TabsTrigger value="marketing" className="flex-1 gap-1.5">
                      <Megaphone className="h-3.5 w-3.5" />
                      Marketing
                    </TabsTrigger>
                  )}
                  {leadActivations.some(a => a.aiTypeId === 'copy' && (a.status === 'active' || a.status === 'finished')) && (
                    <TabsTrigger value="copy" className="flex-1 gap-1.5">
                      <FileEdit className="h-3.5 w-3.5" />
                      Copy
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">Histórico</TabsTrigger>
                </TabsList>
                
                {/* IAs Tab - Principal */}
                <TabsContent value="ais" className="space-y-6">
                  {/* Lead Header */}
                  <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-lg">
                    <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {selectedLead.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-foreground truncate">{selectedLead.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{selectedLead.company}</p>
                      <LeadAIStatusBadge status={selectedLead.aiStatus} size="sm" className="mt-1" />
                    </div>
                  </div>

                  {/* AI List - Centro de Controle */}
                  {client && (
                    <LeadAIList
                      activations={leadActivations}
                      clientPlan={client.plan}
                      onActivateAI={() => setShowSelectAIModal(true)}
                      onPauseAI={handlePauseAI}
                      onResumeAI={handleResumeAI}
                      onFinishAI={handleFinishAI}
                      onViewConversation={handleViewConversation}
                    />
                  )}

                  {/* Pool Info */}
                  {client && (
                    <div className="p-5 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Pools Disponíveis</span>
                        <span className="text-sm font-mono font-semibold text-primary">
                          {client.poolsLimit - client.poolsUsed} / {client.poolsLimit}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(client.poolsUsed / client.poolsLimit) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Plano: <span className="font-medium text-foreground">{client.plan}</span>
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-4">
                  <LeadPerformanceReport leadId={selectedLead.id} />
                </TabsContent>
                
                {/* Marketing Tab */}
                <TabsContent value="marketing" className="space-y-4">
                  <LeadMarketingReport leadId={selectedLead.id} />
                </TabsContent>
                
                {/* Copy Tab */}
                <TabsContent value="copy" className="space-y-4">
                  <LeadCopyReport leadId={selectedLead.id} />
                </TabsContent>
                
                {/* Info Tab */}
                <TabsContent value="info" className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">
                        {selectedLead.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{selectedLead.name}</h4>
                      <LeadAIStatusBadge status={selectedLead.aiStatus} size="sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <StatusBadge status={selectedLead.status} className="mt-1" />
                    </div>
                    {user?.role !== "marketing" && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Score</p>
                        <ScoreBadge score={selectedLead.score} size="lg" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{selectedLead.email}</span>
                    </div>
                    {selectedLead.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedLead.phone}</span>
                      </div>
                    )}
                    {selectedLead.company && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{selectedLead.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Último contato: {new Date(selectedLead.lastInteraction).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </TabsContent>
                
                {/* History Tab */}
                <TabsContent value="history">
                  <LeadAIActivationHistory 
                    activations={leadActivations} 
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Select AI Modal */}
      {selectedLead && client && (
        <SelectAIModal
          open={showSelectAIModal}
          onOpenChange={setShowSelectAIModal}
          lead={selectedLead}
          client={client}
          existingActivations={leadActivations}
          onConfirm={handleActivateAI}
          onNavigateToWhatsApp={() => navigate("/whatsapp")}
        />
      )}

      <ImportLeadsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={loadLeads}
      />

      <ExportLeadsModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        leads={leads}
        filteredLeads={filteredLeads}
      />
    </AppLayout>
  );
}
