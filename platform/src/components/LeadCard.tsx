import { cn } from "@/lib/utils";
import { Lead, getScore, activateAIForLead, getSession, getUser } from "@/lib/storage";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import { Zap, Mail, Phone, Building, Calendar, User } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface LeadCardProps {
  lead: Lead;
  onUpdate?: () => void;
  showScore?: boolean;
}

export function LeadCard({ lead, onUpdate, showScore = true }: LeadCardProps) {
  const [isActivating, setIsActivating] = useState(false);
  const session = getSession();
  const score = getScore(lead.id);
  const currentUser = session ? getUser(session.userId) : null;
  const userRole = currentUser?.role;

  const handleActivateAI = async () => {
    if (!session) return;
    
    setIsActivating(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = activateAIForLead(lead.id, session.clientId);
    
    if (result.success) {
      toast({
        title: "IA Ativada!",
        description: result.message,
      });
      onUpdate?.();
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
    
    setIsActivating(false);
  };

  return (
    <div className="iara-card group hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
            <StatusBadge status={lead.status} />
          </div>
          
          <div className="space-y-1.5 mt-3">
            {lead.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-3.5 w-3.5" />
                <span>{lead.company}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Último contato: {new Date(lead.lastInteraction).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{lead.origin}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {showScore && (userRole === "gestor" || userRole === "vendedor") && (
            <div className="text-right">
              <ScoreBadge score={lead.score} size="lg" />
              {score && (
                <p className="text-[10px] text-muted-foreground mt-1 max-w-[140px]">
                  {score.recommendation}
                </p>
              )}
            </div>
          )}
          
          {!lead.poolActivated && (
            <Button
              variant="iara"
              size="sm"
              onClick={handleActivateAI}
              disabled={isActivating}
              className="gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              {isActivating ? "Ativando..." : "Ativar IA"}
            </Button>
          )}
          
          {lead.poolActivated && (
            <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <Zap className="h-3 w-3" />
              <span>IA Ativa</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
