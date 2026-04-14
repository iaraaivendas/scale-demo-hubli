import { useState, useRef, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  getSession,
  getLeads,
  saveLead,
  generateId,
  type Lead,
} from "@/lib/storage";

interface ImportLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ParsedLead {
  name: string;
  email: string;
  phone: string;
  company: string;
  cargo: string;
  status: string;
  tags: string;
  notes: string;
}

interface ValidationResult {
  row: number;
  lead: ParsedLead;
  valid: boolean;
  errors: string[];
}

type Step = "upload" | "preview" | "importing" | "complete";

const SYSTEM_FIELDS = [
  { key: "name", label: "Nome", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Telefone", required: false },
  { key: "company", label: "Empresa", required: false },
  { key: "cargo", label: "Cargo", required: false },
  { key: "status", label: "Status", required: false },
  { key: "tags", label: "Tags", required: false },
  { key: "notes", label: "Observações", required: false },
];

const TEMPLATE_CSV = `Nome,Email,Telefone,Empresa,Cargo,Status,Tags,Observações
"João Silva","joao@empresa.com","(11) 99999-1234","Tech Solutions","Diretor Comercial","new","tecnologia, enterprise","Lead vindo do evento de marketing"
"Maria Oliveira","maria@startup.io","(21) 98888-5678","Startup IO","CEO","qualified","saas, startup","Interessada no plano Growth"
"Carlos Santos","carlos@agencia.com.br","(31) 97777-9012","Agência Digital","Gerente de Marketing","nurturing","marketing, agência","Aguardando retorno sobre proposta"`;

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === "") return true; // optional
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 13;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);

  return rows;
}

export function ImportLeadsModal({
  open,
  onOpenChange,
  onImportComplete,
}: ImportLeadsModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "replace">("skip");
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState({ imported: 0, duplicates: 0, errors: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setDataRows([]);
    setColumnMapping({});
    setValidationResults([]);
    setDuplicateAction("skip");
    setImportProgress(0);
    setImportResult({ imported: 0, duplicates: 0, errors: 0 });
    setIsDragging(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const autoMapColumns = (fileHeaders: string[]) => {
    const mapping: Record<string, string> = {};
    const normalizeHeader = (h: string) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const mappingRules: Record<string, string[]> = {
      name: ["nome", "name", "lead"],
      email: ["email", "e-mail", "mail"],
      phone: ["telefone", "phone", "tel", "celular", "whatsapp"],
      company: ["empresa", "company", "organizacao", "organizaçao"],
      cargo: ["cargo", "posicao", "position", "title", "job"],
      status: ["status", "situacao", "estado"],
      tags: ["tags", "categorias", "labels"],
      notes: ["observacoes", "notas", "notes", "obs"],
    };

    fileHeaders.forEach((header, idx) => {
      const normalized = normalizeHeader(header);
      for (const [field, aliases] of Object.entries(mappingRules)) {
        if (aliases.some((a) => normalized.includes(a))) {
          mapping[field] = String(idx);
          break;
        }
      }
    });
    return mapping;
  };

  const processFile = useCallback(async (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 5MB.", variant: "destructive" });
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      toast({ title: "Formato não suportado", description: "Use arquivos .csv, .xlsx ou .xls", variant: "destructive" });
      return;
    }

    setFile(f);
    const text = await f.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      toast({ title: "Arquivo vazio", description: "O arquivo não contém dados suficientes.", variant: "destructive" });
      return;
    }

    if (rows.length - 1 > 1000) {
      toast({ title: "Limite excedido", description: `O arquivo contém ${rows.length - 1} leads. O limite é 1000 por importação.`, variant: "destructive" });
      return;
    }

    const fileHeaders = rows[0];
    const data = rows.slice(1);
    setHeaders(fileHeaders);
    setDataRows(data);

    const mapping = autoMapColumns(fileHeaders);
    setColumnMapping(mapping);

    // Validate
    validateData(data, mapping);
    setStep("preview");
  }, []);

  const validateData = (data: string[][], mapping: Record<string, string>) => {
    const results: ValidationResult[] = data.map((row, idx) => {
      const lead: ParsedLead = {
        name: mapping.name ? row[parseInt(mapping.name)] || "" : "",
        email: mapping.email ? row[parseInt(mapping.email)] || "" : "",
        phone: mapping.phone ? row[parseInt(mapping.phone)] || "" : "",
        company: mapping.company ? row[parseInt(mapping.company)] || "" : "",
        cargo: mapping.cargo ? row[parseInt(mapping.cargo)] || "" : "",
        status: mapping.status ? row[parseInt(mapping.status)] || "" : "",
        tags: mapping.tags ? row[parseInt(mapping.tags)] || "" : "",
        notes: mapping.notes ? row[parseInt(mapping.notes)] || "" : "",
      };

      const errors: string[] = [];
      if (!lead.name.trim()) errors.push("Nome obrigatório");
      if (!lead.email.trim()) errors.push("Email obrigatório");
      else if (!validateEmail(lead.email)) errors.push("Email inválido");
      if (!validatePhone(lead.phone)) errors.push("Telefone inválido");

      return { row: idx + 2, lead, valid: errors.length === 0, errors };
    });
    setValidationResults(results);
  };

  const handleMappingChange = (field: string, colIdx: string) => {
    const newMapping = { ...columnMapping, [field]: colIdx };
    setColumnMapping(newMapping);
    validateData(dataRows, newMapping);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_leads_iara.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    const errorRows = validationResults.filter((r) => !r.valid);
    let csv = "Linha,Nome,Email,Erros\n";
    errorRows.forEach((r) => {
      csv += `${r.row},"${r.lead.name}","${r.lead.email}","${r.errors.join("; ")}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "erros_importacao.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const session = getSession();
    if (!session) return;

    setStep("importing");
    const validLeads = validationResults.filter((r) => r.valid);
    const existingLeads = getLeads(session.clientId);
    const existingEmails = new Set(existingLeads.map((l) => l.email.toLowerCase()));

    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (let i = 0; i < validLeads.length; i++) {
      const vr = validLeads[i];
      const isDuplicate = existingEmails.has(vr.lead.email.toLowerCase());

      if (isDuplicate) {
        if (duplicateAction === "skip") {
          duplicates++;
        } else {
          // Replace: find and update
          const existing = existingLeads.find(
            (l) => l.email.toLowerCase() === vr.lead.email.toLowerCase()
          );
          if (existing) {
            const updatedLead: Lead = {
              ...existing,
              name: vr.lead.name,
              phone: vr.lead.phone || existing.phone,
              company: vr.lead.company || existing.company,
            };
            saveLead(updatedLead);
            imported++;
          }
        }
      } else {
        const statusMap: Record<string, Lead["status"]> = {
          new: "new", novo: "new",
          qualified: "qualified", qualificado: "qualified",
          nurturing: "nurturing", nutricao: "nurturing", nutrição: "nurturing",
          cold: "cold", frio: "cold",
          converted: "converted", convertido: "converted",
          lost: "lost", perdido: "lost",
        };
        const normalizedStatus = vr.lead.status.toLowerCase().trim();
        const mappedStatus = statusMap[normalizedStatus] || "new";

        const lead: Lead = {
          id: generateId("lead"),
          clientId: session.clientId!,
          name: vr.lead.name.trim(),
          email: vr.lead.email.trim(),
          phone: vr.lead.phone.trim() || undefined,
          company: vr.lead.company.trim() || undefined,
          status: mappedStatus,
          aiStatus: "not_activated",
          origin: "Importação",
          lastInteraction: new Date().toISOString().split("T")[0],
          score: Math.floor(Math.random() * 30) + 40,
          poolActivated: false,
          createdAt: new Date().toISOString().split("T")[0],
        };
        saveLead(lead);
        existingEmails.add(lead.email.toLowerCase());
        imported++;
      }

      errors = validationResults.filter((r) => !r.valid).length;
      setImportProgress(Math.round(((i + 1) / validLeads.length) * 100));
      // Simulate processing time
      await new Promise((r) => setTimeout(r, 20));
    }

    setImportResult({ imported, duplicates, errors });
    setStep("complete");
    onImportComplete();
  };

  const validCount = validationResults.filter((r) => r.valid).length;
  const errorCount = validationResults.filter((r) => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Leads em Massa
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com seus leads para adicionar múltiplos contatos de uma vez
          </DialogDescription>
        </DialogHeader>

        {/* STEP: Upload */}
        {step === "upload" && (
          <div className="space-y-4 pt-2">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">
                Arraste um arquivo ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Formatos aceitos: .csv, .xlsx, .xls (máx. 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-primary hover:underline mx-auto"
            >
              <Download className="h-4 w-4" />
              Baixar modelo de exemplo (.csv)
            </button>
          </div>
        )}

        {/* STEP: Preview */}
        {step === "preview" && (
          <div className="space-y-4 pt-2">
            {/* File info */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{file?.name}</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={resetState}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Validation summary */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">{validCount} válidos</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">{errorCount} com erros</span>
                </div>
              )}
            </div>

            {/* Column mapping */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Mapeamento de colunas</p>
              <div className="grid grid-cols-2 gap-2">
                {SYSTEM_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <Label className="text-xs w-20 shrink-0">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={columnMapping[field.key] || "unmapped"}
                      onValueChange={(v) => handleMappingChange(field.key, v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="unmapped">— Não mapear —</SelectItem>
                        {headers.map((h, idx) => (
                          <SelectItem key={idx} value={String(idx)}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Data preview table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[200px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">#</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Nome</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Email</th>
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResults.slice(0, 10).map((vr, idx) => (
                      <tr
                        key={idx}
                        className={cn(
                          "border-t border-border/50",
                          !vr.valid && "bg-destructive/5"
                        )}
                      >
                        <td className="px-3 py-2 text-muted-foreground">{vr.row}</td>
                        <td className="px-3 py-2 text-foreground">{vr.lead.name || "—"}</td>
                        <td className="px-3 py-2 text-foreground">{vr.lead.email || "—"}</td>
                        <td className="px-3 py-2">
                          {vr.valid ? (
                            <span className="text-primary flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> OK
                            </span>
                          ) : (
                            <span className="text-destructive flex items-center gap-1" title={vr.errors.join(", ")}>
                              <AlertCircle className="h-3 w-3" /> {vr.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validationResults.length > 10 && (
                <div className="px-3 py-2 bg-muted/30 text-xs text-muted-foreground text-center">
                  Mostrando 10 de {validationResults.length} linhas
                </div>
              )}
            </div>

            {/* Error report download */}
            {errorCount > 0 && (
              <button
                onClick={downloadErrorReport}
                className="flex items-center gap-2 text-xs text-destructive hover:underline"
              >
                <FileWarning className="h-3.5 w-3.5" />
                Baixar relatório de erros (.csv)
              </button>
            )}

            {/* Duplicate action */}
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground">Leads duplicados (mesmo email)</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="duplicate"
                    checked={duplicateAction === "skip"}
                    onChange={() => setDuplicateAction("skip")}
                    className="accent-primary"
                  />
                  <span className="text-foreground">Pular duplicados</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="duplicate"
                    checked={duplicateAction === "replace"}
                    onChange={() => setDuplicateAction("replace")}
                    className="accent-primary"
                  />
                  <span className="text-foreground">Substituir duplicados</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetState}>
                Voltar
              </Button>
              <Button
                variant="iara"
                onClick={handleImport}
                disabled={validCount === 0}
              >
                Importar {validCount} Lead{validCount !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP: Importing */}
        {step === "importing" && (
          <div className="space-y-4 py-8 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-foreground">Importando leads...</p>
            <Progress value={importProgress} className="h-2" indicatorClassName="bg-primary" />
            <p className="text-sm text-muted-foreground">{importProgress}% concluído</p>
          </div>
        )}

        {/* STEP: Complete */}
        {step === "complete" && (
          <div className="space-y-4 py-6 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">Importação concluída!</p>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-foreground">
                <strong className="text-primary">{importResult.imported}</strong> leads importados
              </span>
              {importResult.duplicates > 0 && (
                <span className="text-muted-foreground">
                  {importResult.duplicates} duplicados ignorados
                </span>
              )}
              {importResult.errors > 0 && (
                <span className="text-destructive">
                  {importResult.errors} com erros
                </span>
              )}
            </div>
            <Button variant="iara" onClick={() => handleClose(false)}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
