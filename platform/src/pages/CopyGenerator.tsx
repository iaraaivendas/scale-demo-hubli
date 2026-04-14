import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSession,
  getUser,
  getCopyDrafts,
  saveCopyDraft,
  generateId,
  type CopyDraft,
} from "@/lib/storage";
import { Sparkles, Copy, Check, FileText, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const copyTemplates = [
  {
    type: "campanha",
    label: "Campanhas de Marketing",
    variations: [
      "🚀 [Empresa] lança [Produto/Serviço]: a solução definitiva para [problema do cliente]. Descubra como transformar seus resultados!",
      "⚡ Oferta exclusiva: [Benefício principal] com [X]% de desconto. Válido apenas até [data]. Não perca essa oportunidade!",
      "🎯 Você sabia que [estatística impactante]? Com [Produto], sua empresa pode [resultado esperado]. Saiba mais!",
      "💡 Novidade! [Empresa] apresenta [Feature/Produto] - desenvolvido para empresas que querem [objetivo]. Experimente grátis!",
      "🏆 Case de sucesso: [Cliente] aumentou [métrica] em [X]% com [Produto]. Quer resultados assim? Fale conosco!",
    ],
  },
  {
    type: "email",
    label: "Email de Follow-up",
    variations: [
      "Olá [Nome], percebi que você demonstrou interesse em [Produto]. Gostaria de agendar uma conversa para entender melhor suas necessidades?",
      "Oi [Nome]! Vi que você baixou nosso material sobre [Tema]. Posso te ajudar com alguma dúvida específica?",
      "[Nome], notei que você visitou nossa página de [Serviço]. Que tal conversarmos sobre como podemos ajudar sua empresa?",
    ],
  },
  {
    type: "whatsapp",
    label: "Mensagem WhatsApp",
    variations: [
      "Olá [Nome]! 👋 Sou [Vendedor] da [Empresa]. Vi seu interesse em [Produto] e gostaria de saber se posso ajudar!",
      "Oi [Nome]! Tudo bem? Vi que você se cadastrou no nosso site. Posso te mostrar como o [Produto] pode ajudar sua empresa?",
      "[Nome], bom dia! 🚀 Quero te apresentar uma solução que pode aumentar seus resultados em até X%. Podemos conversar?",
    ],
  },
  {
    type: "linkedin",
    label: "Mensagem LinkedIn",
    variations: [
      "[Nome], acompanho seu trabalho na [Empresa] e acredito que nosso [Produto] pode ser um diferencial para sua equipe. Podemos conversar?",
      "Olá [Nome], vi que você atua com [Área]. Desenvolvemos uma solução que tem ajudado empresas similares. Aceita uma conexão?",
      "[Nome], parabéns pelo seu trabalho! Gostaria de compartilhar como ajudamos empresas do seu segmento a crescer. Interesse?",
    ],
  },
  {
    type: "reativacao",
    label: "Reativação de Lead Frio",
    variations: [
      "[Nome], faz um tempo que não conversamos. Muita coisa mudou e tenho novidades que podem te interessar. Vamos retomar?",
      "Oi [Nome]! Lembro que conversamos sobre [Tema] há alguns meses. Temos uma condição especial este mês. Interesse?",
      "[Nome], vi que as coisas podem ter mudado por aí. Que tal uma conversa rápida para ver se podemos ajudar agora?",
    ],
  },
];

export default function CopyGenerator() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("email");
  const [generatedCopies, setGeneratedCopies] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<CopyDraft[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");

  const loadDrafts = () => {
    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const userData = getUser(session.userId);
    if (userData?.role === "vendedor") {
      navigate("/dashboard");
      return;
    }

    setDrafts(getCopyDrafts(session.clientId));
  };

  useEffect(() => {
    loadDrafts();
  }, [navigate]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const template = copyTemplates.find((t) => t.type === selectedType);
    if (template) {
      // Shuffle and pick variations
      const shuffled = [...template.variations].sort(() => Math.random() - 0.5);
      setGeneratedCopies(shuffled);
    }
    
    setIsGenerating(false);
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const handleApprove = (text: string) => {
    const session = getSession();
    if (!session) return;

    const draft: CopyDraft = {
      id: generateId("copy"),
      clientId: session.clientId,
      content: text,
      approved: true,
      createdAt: new Date().toISOString(),
    };

    saveCopyDraft(draft);
    loadDrafts();

    toast({
      title: "Aprovado!",
      description: "Copy salvo para uso.",
    });
  };

  const selectedTemplate = copyTemplates.find((t) => t.type === selectedType);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Gerador de Copy
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere variações de texto com IA para suas campanhas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Generator */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="iara-card-glow">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Copy</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {copyTemplates.map((template) => (
                        <SelectItem key={template.type} value={template.type}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Contexto adicional (opcional)</Label>
                  <Textarea
                    placeholder="Descreva o produto, oferta ou contexto específico..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  variant="iara"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <Sparkles className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
                  {isGenerating ? "Gerando..." : "Gerar Variações"}
                </Button>
              </div>
            </Card>

            {/* Generated Copies */}
            {generatedCopies.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Variações Geradas
                </h3>
                {generatedCopies.map((copy, index) => (
                  <Card
                    key={index}
                    className="iara-card hover:border-primary/30 transition-all"
                  >
                    <p className="text-foreground mb-4">{copy}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="iara-outline"
                        size="sm"
                        onClick={() => handleCopy(copy, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        {copiedIndex === index ? "Copiado" : "Copiar"}
                      </Button>
                      <Button
                        variant="iara"
                        size="sm"
                        onClick={() => handleApprove(copy)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Approved Drafts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Copies Aprovados
            </h3>
            {drafts.length > 0 ? (
              <div className="space-y-3">
                {drafts.slice(0, 5).map((draft) => (
                  <Card
                    key={draft.id}
                    className="iara-card text-sm"
                  >
                    <p className="text-foreground line-clamp-3">{draft.content}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {new Date(draft.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(draft.content, -1)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="iara-card text-center py-8">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhum copy aprovado ainda
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
