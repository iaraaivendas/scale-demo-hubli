import { useEffect, useState, useRef } from "react";
import { IaraLogo } from "@/components/IaraLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Mail, Bot, CheckCircle2, Clock, Send, Loader2,
  Zap, Users, BarChart3, RefreshCw, Play, ChevronRight,
  ChevronLeft, Building, Briefcase, Phone, Star, PenLine, X, Trash2,
  MessageCircle, Wifi, WifiOff
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const WS_URL = (() => {
  const base = import.meta.env.VITE_WS_URL || "";
  if (base) return base;
  // Em produção usa o mesmo host da página
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
})();

// Tipos
interface Lead {
  id: string; nome: string; empresa: string; cargo: string;
  email: string; telefone: string; segmento: string;
  tamanho_empresa: string; cidade: string; score_inicial: string;
  status: string; ultimo_contato: string;
}

interface ActivityLog {
  id: string; timestamp: string; agente: string;
  acao: string; leadId?: string; leadNome?: string; detalhe: string;
}

interface Sequence {
  id: string; leadId: string; leadNome: string; empresa: string;
  status: string; taxaAbertura: number; criadaEm: string;
  steps: { numero: number; tipo: string; status: string; assunto: string; corpo: string }[];
}

// Badge de status do lead
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    "Novo":        { label: "Novo",         class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    "Em Sequencia":{ label: "Em Sequência", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    "Respondeu":   { label: "Respondeu",    class: "bg-primary/20 text-primary border-primary/30" },
    "Frio":        { label: "Frio",         class: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  };
  const s = map[status] ?? { label: status, class: "bg-muted text-muted-foreground" };
  return <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", s.class)}>{s.label}</span>;
}

// Badge do agente no feed
function AgentBadge({ agente }: { agente: string }) {
  const map: Record<string, string> = {
    Prospector:   "bg-blue-500/20 text-blue-400",
    Copywriter:   "bg-purple-500/20 text-purple-400",
    Sequenciador: "bg-orange-500/20 text-orange-400",
    Dispatcher:   "bg-pink-500/20 text-pink-400",
    Monitor:      "bg-primary/20 text-primary",
    Sistema:      "bg-slate-500/20 text-slate-300",
  };
  return (
    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide", map[agente] ?? "bg-muted text-muted-foreground")}>
      {agente}
    </span>
  );
}

const PAGE_SIZE = 20;

function Pagination({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 mt-1 rounded-b-md">
      <span className="text-[11px] text-muted-foreground font-medium">
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-[11px] text-muted-foreground px-1.5 font-medium tabular-nums">{page}/{totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Inbox() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedSeq, setSelectedSeq] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "sequences">("leads");
  const [leadsPage, setLeadsPage] = useState(1);
  const [seqPage, setSeqPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTo, setComposerTo] = useState("");
  const [composerAssunto, setComposerAssunto] = useState("");
  const [composerCorpo, setComposerCorpo] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Busca inicial de dados
  const fetchData = async () => {
    try {
      const [leadsRes, seqRes, actRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/leads`),
        fetch(`${BACKEND_URL}/api/sequences`),
        fetch(`${BACKEND_URL}/api/activity?limit=100`),
      ]);
      if (leadsRes.ok) { const d = await leadsRes.json(); setLeads(d.leads ?? []); }
      if (seqRes.ok)   { const d = await seqRes.json(); setSequences(d.sequences ?? []); }
      if (actRes.ok)   { const d = await actRes.json(); setLogs((d.logs ?? []).reverse()); }
    } catch { /* backend pode estar offline */ }
  };

  // WebSocket — recebe atualizações em tempo real
  useEffect(() => {
    fetchData();

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => { setWsConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.tipo === "log_agente") {
            setLogs(prev => [...prev, msg.payload]);
          }
          if (msg.tipo === "lead_atualizado") {
            setLeads(prev => prev.map(l => l.id === msg.payload.id ? msg.payload : l));
          }
          if (msg.tipo === "nova_sequencia") {
            setSequences(prev => [...prev, msg.payload]);
          }
          if (msg.tipo === "demo_reset") {
            setLogs([]);
            setSequences([]);
            setSelectedLead(null);
            setSelectedSeq(null);
            setComposerOpen(false);
            setLogsPage(1);
            setLeadsPage(1);
            setSeqPage(1);
            if (msg.payload?.leads) setLeads(msg.payload.leads);
          }
        } catch { /* ignore */ }
      };
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  // Vai para a última página do feed quando chega novo log
  useEffect(() => {
    const totalPages = Math.ceil(logs.length / PAGE_SIZE);
    if (totalPages > 0) setLogsPage(totalPages);
  }, [logs.length]);

  const DEMO_EMAIL = "iara.ai.vendas@gmail.com";

  const openComposer = (lead: Lead, step?: { assunto: string; corpo: string }) => {
    setComposerTo(DEMO_EMAIL);
    setComposerAssunto(step?.assunto ?? `Olá, ${lead.nome.split(" ")[0]}!`);
    setComposerCorpo(step?.corpo ?? `Olá ${lead.nome.split(" ")[0]},\n\n`);
    setSendResult(null);
    setComposerOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedLead) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composerTo,
          assunto: composerAssunto,
          corpo: composerCorpo,
          leadId: selectedLead.id,
          leadNome: selectedLead.nome,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, msg: "E-mail enviado com sucesso!" });
      } else {
        setSendResult({ ok: false, msg: data.error ?? "Erro ao enviar." });
      }
    } catch {
      setSendResult({ ok: false, msg: "Sem conexão com o backend." });
    } finally {
      setSending(false);
    }
  };

  // Reseta todos os dados sem precisar do terminal
  const handleReset = async () => {
    setLoading(true);
    // Limpa estado local imediatamente
    setLogs([]);
    setSequences([]);
    setSelectedLead(null);
    setSelectedSeq(null);
    setComposerOpen(false);
    setLogsPage(1);
    setLeadsPage(1);
    setSeqPage(1);
    try {
      // O backend faz reloadLeads + broadcast demo_reset com leads frescos
      const res = await fetch(`${BACKEND_URL}/api/demo/reset`, { method: "POST" });
      if (res.ok) {
        // Busca leads após reset confirmado
        const leadsRes = await fetch(`${BACKEND_URL}/api/leads`);
        if (leadsRes.ok) {
          const d = await leadsRes.json();
          setLeads(d.leads ?? []);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Inicia o pipeline sem precisar do terminal
  const handleStartPipeline = async () => {
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/demo/start`, { method: "POST" });
    } catch { /* ignore */ }
    setLoading(false);
  };

  // Métricas rápidas
  const novos    = leads.filter(l => l.status === "Novo").length;
  const emSeq    = leads.filter(l => l.status === "Em Sequencia").length;
  const respondeu = leads.filter(l => l.status === "Respondeu").length;
  const frio     = leads.filter(l => l.status === "Frio").length;

  const [mobilePanel, setMobilePanel] = useState<"list" | "detail" | "feed" | "whatsapp">("list");

  // WhatsApp state
  const [waNumero, setWaNumero] = useState("");
  const [waSavedNumero, setWaSavedNumero] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<{ connected: boolean; mock: boolean } | null>(null);
  const [waSaving, setWaSaving] = useState(false);

  // Busca status WhatsApp e número salvo
  useEffect(() => {
    const fetchWaStatus = async () => {
      try {
        const [statusRes, numRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/whatsapp/status`),
          fetch(`${BACKEND_URL}/api/whatsapp/demo-number`),
        ]);
        if (statusRes.ok) setWaStatus(await statusRes.json());
        if (numRes.ok) { const d = await numRes.json(); if (d.demoNumero) setWaSavedNumero(d.demoNumero); }
      } catch { /* ignore */ }
    };
    fetchWaStatus();
    const interval = setInterval(fetchWaStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveWaNumero = async () => {
    if (!waNumero.trim()) return;
    setWaSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/whatsapp/demo-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: waNumero }),
      });
      if (res.ok) { const d = await res.json(); setWaSavedNumero(d.demoNumero); setWaNumero(""); }
    } catch { /* ignore */ }
    setWaSaving(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden">
      {/* Topbar minimalista */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-border flex-shrink-0">
        <IaraLogo size="sm" showText={true} />
        <ThemeToggle />
      </div>
      <div className="flex flex-col flex-1 min-h-0 gap-3 md:gap-4 p-3 md:p-6 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Inbox de Agentes
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Pipeline comercial automatizado com IA
            </p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-end">
            <div className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border",
              wsConnected ? "border-primary/40 text-primary bg-primary/10" : "border-muted text-muted-foreground")}>
              <span className={cn("w-1.5 h-1.5 rounded-full", wsConnected ? "bg-primary animate-pulse" : "bg-muted-foreground")} />
              <span className="hidden sm:inline">{wsConnected ? "Ao vivo" : "Desconectado"}</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-8 px-2.5">
              <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={loading} className="h-8 px-2.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Resetar</span>
            </Button>
            <Button size="sm" onClick={handleStartPipeline} disabled={loading} className="h-8 px-2.5">
              <Play className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Iniciar Pipeline</span>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          {[
            { label: "Novos",        value: novos,     icon: Users,       color: "text-blue-400" },
            { label: "Em Sequência", value: emSeq,     icon: Zap,         color: "text-yellow-400" },
            { label: "Responderam",  value: respondeu, icon: CheckCircle2, color: "text-primary" },
            { label: "Frios",        value: frio,      icon: Clock,       color: "text-slate-400" },
          ].map(k => (
            <Card key={k.label} className="p-3 md:p-4 flex items-center gap-2 md:gap-3">
              <k.icon className={cn("h-6 w-6 md:h-8 md:w-8 flex-shrink-0", k.color)} />
              <div>
                <p className="text-xl md:text-2xl font-bold text-foreground">{k.value}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{k.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Mobile nav — só visível em telas pequenas */}
        <div className="flex lg:hidden rounded-md bg-muted p-1 flex-shrink-0">
          {[
            { key: "list",      label: "Lista",    icon: Mail },
            { key: "detail",    label: "Detalhes", icon: Bot },
            { key: "feed",      label: "Agentes",  icon: BarChart3 },
            { key: "whatsapp",  label: "WhatsApp", icon: MessageCircle },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setMobilePanel(tab.key as "list" | "detail" | "feed" | "whatsapp")}
              className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1.5 text-[10px] font-medium transition-all",
                mobilePanel === tab.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Layout principal: lista leads + painel direito */}
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Coluna esquerda: tabs Leads / Sequences / WhatsApp */}
          <div className={cn(
            "flex flex-col min-h-0 overflow-hidden",
            "lg:w-[380px] xl:w-[420px]",
            mobilePanel === "list" || mobilePanel === "whatsapp" ? "flex w-full lg:flex" : "hidden lg:flex"
          )}>
            {/* Tab headers */}
            <div className="flex rounded-md bg-muted p-1 mb-2 flex-shrink-0">
              <button
                onClick={() => { setActiveTab("leads"); setMobilePanel("list"); }}
                className={cn("flex-1 flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-all",
                  activeTab === "leads" && mobilePanel !== "whatsapp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Mail className="h-3.5 w-3.5" /> Leads ({leads.length})
              </button>
              <button
                onClick={() => { setActiveTab("sequences"); setMobilePanel("list"); }}
                className={cn("flex-1 flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-all",
                  activeTab === "sequences" && mobilePanel !== "whatsapp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Seqs ({sequences.length})
              </button>
              <button
                onClick={() => setMobilePanel("whatsapp")}
                className={cn("flex-1 flex items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-all",
                  mobilePanel === "whatsapp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">WA</span>
              </button>
            </div>

            {/* Lista de Leads */}
            {activeTab === "leads" && mobilePanel !== "whatsapp" && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 min-h-0 rounded-md border border-border/50">
                  <div className="space-y-1.5 p-2">
                    {leads.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum lead carregado.<br/>Rode o pipeline para começar.
                      </p>
                    )}
                    {leads.slice((leadsPage - 1) * PAGE_SIZE, leadsPage * PAGE_SIZE).map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => { setSelectedLead(lead); setSelectedSeq(null); setMobilePanel("detail"); }}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          selectedLead?.id === lead.id
                            ? "border-primary/50 bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-accent/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">{lead.nome}</span>
                              <Bot className="h-3 w-3 text-primary flex-shrink-0" />
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{lead.cargo} · {lead.empresa}</p>
                            <p className="text-xs text-muted-foreground">{lead.segmento} · {lead.tamanho_empresa}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <StatusBadge status={lead.status} />
                            <span className="text-[10px] text-muted-foreground">Score {lead.score_inicial}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Pagination page={leadsPage} total={leads.length} pageSize={PAGE_SIZE} onChange={setLeadsPage} />
              </div>
            )}

            {/* Lista de Sequências */}
            {activeTab === "sequences" && mobilePanel !== "whatsapp" && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 min-h-0 rounded-md border border-border/50">
                  <div className="space-y-1.5 p-2">
                    {sequences.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma sequência criada ainda.
                      </p>
                    )}
                    {sequences.slice((seqPage - 1) * PAGE_SIZE, seqPage * PAGE_SIZE).map(seq => (
                      <div
                        key={seq.id}
                        onClick={() => { setSelectedSeq(seq); setSelectedLead(null); setMobilePanel("detail"); }}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          selectedSeq?.id === seq.id
                            ? "border-primary/50 bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-accent/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{seq.leadNome}</p>
                            <p className="text-xs text-muted-foreground">{seq.empresa}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full border",
                              seq.status === "Ativa" ? "border-primary/40 text-primary bg-primary/10" : "border-muted text-muted-foreground")}>
                              {seq.status}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{seq.steps?.length ?? 0} steps</span>
                          </div>
                        </div>
                        {/* Steps visuais */}
                        <div className="flex gap-1.5 mt-2">
                          {(seq.steps ?? []).map(step => (
                            <div key={step.numero} className={cn(
                              "flex-1 h-1 rounded-full",
                              step.status === "Enviado" ? "bg-primary" :
                              step.status === "Agendado" ? "bg-yellow-500" : "bg-muted"
                            )} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Pagination page={seqPage} total={sequences.length} pageSize={PAGE_SIZE} onChange={setSeqPage} />
              </div>
            )}
            {/* Painel WhatsApp */}
            {mobilePanel === "whatsapp" && (
              <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-auto">
                {/* Status */}
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium",
                  waStatus?.connected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : waStatus?.mock
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                    : "border-muted bg-muted/30 text-muted-foreground")}>
                  {waStatus?.connected
                    ? <><Wifi className="h-3.5 w-3.5" /> WhatsApp conectado</>
                    : waStatus?.mock
                    ? <><WifiOff className="h-3.5 w-3.5" /> Modo simulação — configure Evolution API para envio real</>
                    : <><WifiOff className="h-3.5 w-3.5" /> Verificando conexão...</>}
                </div>

                {/* Número demo */}
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" />
                    Número para demonstração
                  </p>
                  {waSavedNumero && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-primary/10 border border-primary/20">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs text-primary font-medium">+{waSavedNumero}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      value={waNumero}
                      onChange={e => setWaNumero(e.target.value)}
                      placeholder="Ex: 11999999999"
                      className="text-sm h-8 flex-1"
                      onKeyDown={e => e.key === "Enter" && handleSaveWaNumero()}
                    />
                    <Button size="sm" className="h-8 px-3" onClick={handleSaveWaNumero} disabled={waSaving || !waNumero.trim()}>
                      {waSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Durante a demo, o Agente WhatsApp enviará uma mensagem personalizada para este número.
                  </p>
                </div>

                {/* Feed de mensagens WhatsApp */}
                <div className="flex-1 min-h-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5 font-medium">Mensagens enviadas</p>
                  <ScrollArea className="h-full rounded-md border border-border/50">
                    <div className="p-2 space-y-2">
                      {logs.filter(l => l.agente === "WhatsApp").length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          Nenhuma mensagem ainda.<br/>
                          <span className="text-primary">Inicie o Pipeline</span> para ativar o Agente WhatsApp.
                        </p>
                      ) : (
                        logs.filter(l => l.agente === "WhatsApp").map(log => (
                          <div key={log.id} className="text-xs border border-border rounded-lg p-2.5 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                                WhatsApp
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed">{log.detalhe}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>

          {/* Coluna central: painel de detalhes */}
          <div className={cn(
            "flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden",
            mobilePanel === "detail" ? "flex w-full lg:flex" : "hidden lg:flex"
          )}>

            {/* Composer — ocupa toda a altura quando aberto */}
            {composerOpen && selectedLead && (
              <Card className="flex-1 min-h-0 p-5 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Enviar E-mail — {selectedLead.nome.split(" ")[0]}</span>
                  </div>
                  <button onClick={() => setComposerOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col flex-1 min-h-0 gap-3">
                  <div className="flex-shrink-0">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1 block">Para</label>
                    <Input value={composerTo} onChange={e => setComposerTo(e.target.value)}
                      className="text-sm h-8" placeholder="destinatario@empresa.com" />
                  </div>
                  <div className="flex-shrink-0">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1 block">Assunto</label>
                    <Input value={composerAssunto} onChange={e => setComposerAssunto(e.target.value)}
                      className="text-sm h-8" placeholder="Assunto do e-mail" />
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1 block">Mensagem</label>
                    <Textarea value={composerCorpo} onChange={e => setComposerCorpo(e.target.value)}
                      className="flex-1 min-h-0 text-sm resize-none" placeholder="Corpo do e-mail..." />
                  </div>
                  {sendResult && (
                    <div className={cn("flex-shrink-0 text-xs px-3 py-2 rounded-lg",
                      sendResult.ok ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20")}>
                      {sendResult.msg}
                    </div>
                  )}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setComposerOpen(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="flex-1 gap-2" onClick={handleSendEmail} disabled={sending || !composerTo}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {sending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Painel do lead — só aparece quando o composer está fechado */}
            {selectedLead && !composerOpen && (
              <Card className="flex-1 min-h-0 p-5 overflow-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedLead.nome}</h2>
                    <p className="text-sm text-muted-foreground">{selectedLead.cargo}</p>
                  </div>
                  <StatusBadge status={selectedLead.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { icon: Building,  label: "Empresa",        value: selectedLead.empresa },
                    { icon: Briefcase, label: "Segmento",        value: `${selectedLead.segmento} · ${selectedLead.tamanho_empresa}` },
                    { icon: Mail,      label: "E-mail",          value: selectedLead.email },
                    { icon: Phone,     label: "Telefone",        value: selectedLead.telefone },
                    { icon: Star,      label: "Score",           value: `${selectedLead.score_inicial}/10` },
                    { icon: Clock,     label: "Último contato",  value: selectedLead.ultimo_contato || "—" },
                  ].map(f => (
                    <div key={f.label} className="flex items-start gap-2 p-3 rounded-lg bg-accent/30">
                      <f.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{f.label}</p>
                        <p className="text-sm text-foreground font-medium break-all">{f.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sequência ativa — apenas a mais recente */}
                {sequences.filter(s => s.leadId === selectedLead.id).slice(-1).map(seq => (
                  <div key={seq.id} className="mt-6 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">E-mails gerados pela IA</p>
                    <div className="space-y-2">
                      {seq.steps.map(step => (
                        <div key={step.numero} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                              step.status === "Enviado" ? "bg-primary text-primary-foreground" :
                              step.status === "Agendado" ? "bg-yellow-500/20 text-yellow-400" : "bg-muted text-muted-foreground")}>
                              {step.numero}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{step.tipo}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{step.assunto || "Aguardando..."}</p>
                            </div>
                            {step.assunto && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-shrink-0"
                                onClick={() => openComposer(selectedLead, { assunto: step.assunto, corpo: step.corpo })}>
                                <PenLine className="h-3 w-3" /> Usar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="w-full gap-2"
                    onClick={() => openComposer(selectedLead)}>
                    <PenLine className="h-4 w-4" /> Escrever e-mail para {selectedLead.nome.split(" ")[0]}
                  </Button>
                </div>
              </Card>
            )}

            {selectedSeq && !composerOpen && (
              <Card className="h-full p-5 overflow-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selectedSeq.leadNome}</h2>
                    <p className="text-sm text-muted-foreground">{selectedSeq.empresa}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full border",
                    selectedSeq.status === "Ativa" ? "border-primary/40 text-primary bg-primary/10" : "border-muted text-muted-foreground")}>
                    {selectedSeq.status}
                  </span>
                </div>
                <div className="space-y-3">
                  {selectedSeq.steps.map(step => (
                    <div key={step.numero} className="p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                          step.status === "Enviado" ? "bg-primary text-primary-foreground" :
                          step.status === "Agendado" ? "bg-yellow-500/20 text-yellow-400" : "bg-muted text-muted-foreground")}>
                          {step.numero}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{step.tipo}</p>
                          <p className="text-xs text-muted-foreground">{step.status}</p>
                        </div>
                        {step.assunto && (() => {
                          const seqLead = leads.find(l => l.id === selectedSeq.leadId);
                          return seqLead ? (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-shrink-0"
                              onClick={() => { setSelectedLead(seqLead); openComposer(seqLead, { assunto: step.assunto, corpo: step.corpo }); }}>
                              <PenLine className="h-3 w-3" /> Usar
                            </Button>
                          ) : null;
                        })()}
                      </div>
                      {step.assunto && (
                        <>
                          <p className="text-xs font-medium text-foreground mb-1">Assunto: {step.assunto}</p>
                          <p className="text-xs text-muted-foreground line-clamp-3">{step.corpo}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {!selectedLead && !selectedSeq && (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecione um lead ou sequência para ver os detalhes</p>
                </div>
              </Card>
            )}
          </div>

          {/* Coluna direita: feed de atividade dos agentes */}
          <div className={cn(
            "flex flex-col min-h-0",
            "lg:w-[280px] xl:w-[320px]",
            mobilePanel === "feed" ? "flex w-full lg:flex" : "hidden lg:flex"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Atividade dos Agentes</span>
              {wsConnected && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-auto" />}
            </div>
            <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {logs.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6 space-y-2">
                      <p>Aguardando pipeline...</p>
                      <p>Pressione o botão <span className="text-primary font-medium">Iniciar Pipeline</span> para começar.</p>
                    </div>
                  )}
                  {logs.slice((logsPage - 1) * PAGE_SIZE, logsPage * PAGE_SIZE).map(log => (
                    <div key={log.id} className="text-xs border border-border rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center gap-2">
                        <AgentBadge agente={log.agente} />
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed">{log.detalhe}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t border-border px-2 py-1">
                <Pagination page={logsPage} total={logs.length} pageSize={PAGE_SIZE} onChange={setLogsPage} />
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
