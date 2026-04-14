import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileDown, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Lead } from "@/lib/storage";

interface ExportLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  filteredLeads: Lead[];
}

type ExportScope = "all" | "filtered" | "by_status" | "by_period";
type ExportFormat = "csv" | "json";

interface ExportColumn {
  key: string;
  label: string;
  required: boolean;
  checked: boolean;
}

const DEFAULT_COLUMNS: ExportColumn[] = [
  { key: "name", label: "Nome", required: true, checked: true },
  { key: "email", label: "Email", required: true, checked: true },
  { key: "phone", label: "Telefone", required: true, checked: true },
  { key: "company", label: "Empresa", required: false, checked: true },
  { key: "status", label: "Status", required: false, checked: true },
  { key: "aiStatus", label: "Status IA", required: false, checked: true },
  { key: "origin", label: "Origem", required: false, checked: true },
  { key: "score", label: "Score", required: false, checked: true },
  { key: "createdAt", label: "Data de Criação", required: false, checked: false },
  { key: "lastInteraction", label: "Última Interação", required: false, checked: false },
];

const STATUS_OPTIONS = [
  { value: "new", label: "Novo" },
  { value: "qualified", label: "Qualificado" },
  { value: "nurturing", label: "Nutrição" },
  { value: "cold", label: "Frio" },
  { value: "converted", label: "Convertido" },
  { value: "lost", label: "Perdido" },
];

export function ExportLeadsModal({
  open,
  onOpenChange,
  leads,
  filteredLeads,
}: ExportLeadsModalProps) {
  const [scope, setScope] = useState<ExportScope>("all");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS.map(c => ({ ...c })));
  const [statusFilter, setStatusFilter] = useState("new");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleClose = (v: boolean) => {
    if (!v) {
      setScope("all");
      setFormat("csv");
      setColumns(DEFAULT_COLUMNS.map(c => ({ ...c })));
    }
    onOpenChange(v);
  };

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key && !c.required ? { ...c, checked: !c.checked } : c))
    );
  };

  const selectAll = () => setColumns((prev) => prev.map((c) => ({ ...c, checked: true })));
  const deselectOptional = () =>
    setColumns((prev) => prev.map((c) => ({ ...c, checked: c.required })));

  const getExportLeads = (): Lead[] => {
    switch (scope) {
      case "filtered":
        return filteredLeads;
      case "by_status":
        return leads.filter((l) => l.status === statusFilter);
      case "by_period": {
        const from = dateFrom ? new Date(dateFrom) : new Date("2000-01-01");
        const to = dateTo ? new Date(dateTo) : new Date("2099-12-31");
        return leads.filter((l) => {
          const d = new Date(l.createdAt);
          return d >= from && d <= to;
        });
      }
      default:
        return leads;
    }
  };

  const getLeadValue = (lead: Lead, key: string): string => {
    const statusLabels: Record<string, string> = {
      new: "Novo", qualified: "Qualificado", nurturing: "Nutrição",
      cold: "Frio", converted: "Convertido", lost: "Perdido",
    };
    const aiLabels: Record<string, string> = {
      not_activated: "Não ativado", ai_active: "IA ativa",
      in_conversation: "Em conversa", scheduled: "Agendado", archived: "Arquivado",
    };

    switch (key) {
      case "name": return lead.name;
      case "email": return lead.email;
      case "phone": return lead.phone || "";
      case "company": return lead.company || "";
      case "status": return statusLabels[lead.status] || lead.status;
      case "aiStatus": return aiLabels[lead.aiStatus] || lead.aiStatus;
      case "origin": return lead.origin;
      case "score": return String(lead.score);
      case "createdAt": return lead.createdAt;
      case "lastInteraction": return lead.lastInteraction;
      default: return "";
    }
  };

  const handleExport = () => {
    const exportLeads = getExportLeads();
    const selectedCols = columns.filter((c) => c.checked);

    if (exportLeads.length === 0) {
      toast({ title: "Nenhum lead para exportar", description: "Nenhum lead corresponde aos filtros selecionados.", variant: "destructive" });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    let content: string;
    let mimeType: string;
    let ext: string;

    if (format === "json") {
      const data = exportLeads.map((lead) => {
        const obj: Record<string, string> = {};
        selectedCols.forEach((col) => { obj[col.key] = getLeadValue(lead, col.key); });
        return obj;
      });
      content = JSON.stringify(data, null, 2);
      mimeType = "application/json";
      ext = "json";
    } else {
      const headerRow = selectedCols.map((c) => `"${c.label}"`).join(",");
      const dataRows = exportLeads.map((lead) =>
        selectedCols.map((col) => `"${getLeadValue(lead, col.key).replace(/"/g, '""')}"`).join(",")
      );
      content = [headerRow, ...dataRows].join("\n");
      mimeType = "text/csv;charset=utf-8;";
      ext = "csv";
    }

    const blob = new Blob(["\uFEFF" + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_iara-scale_${today}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída!",
      description: `${exportLeads.length} leads exportados com sucesso.`,
    });
    handleClose(false);
  };

  const exportCount = getExportLeads().length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar Leads
          </DialogTitle>
          <DialogDescription>
            Escolha os filtros, colunas e formato para exportar seus leads
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Scope */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quais leads exportar?</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "all" as const, label: "Todos os leads" },
                { value: "filtered" as const, label: `Leads filtrados (${filteredLeads.length})` },
                { value: "by_status" as const, label: "Por status" },
                { value: "by_period" as const, label: "Por período" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                    scope === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-primary/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === opt.value}
                    onChange={() => setScope(opt.value)}
                    className="accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {scope === "by_status" && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {scope === "by_period" && (
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Columns */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Colunas para exportar</Label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-primary hover:underline">
                  Selecionar todos
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button onClick={deselectOptional} className="text-xs text-primary hover:underline">
                  Desmarcar opcionais
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-md hover:bg-muted/30"
                >
                  <Checkbox
                    checked={col.checked}
                    disabled={col.required}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  <span className="text-foreground">
                    {col.label}
                    {col.required && (
                      <span className="text-xs text-muted-foreground ml-1">(obrigatório)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Formato do arquivo</Label>
            <div className="flex gap-3">
              {[
                { value: "csv" as const, label: "CSV", desc: "Compatível com Excel" },
                { value: "json" as const, label: "JSON", desc: "Para integrações" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all text-center ${
                    format === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    checked={format === opt.value}
                    onChange={() => setFormat(opt.value)}
                    className="sr-only"
                  />
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button variant="iara" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar {exportCount} Lead{exportCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
