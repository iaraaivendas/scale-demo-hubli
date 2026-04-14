import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { DollarSign, Clock, TrendingUp, Zap } from "lucide-react";
import type { ROICalculation } from "@/lib/expansionMetrics";

interface ROICounterProps {
  roi: ROICalculation;
  clientName?: string;
  className?: string;
}

export function ROICounter({ roi, clientName, className }: ROICounterProps) {
  return (
    <Card className={cn("iara-card-glow relative overflow-hidden", className)}>
      {/* Gradient background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg p-2 bg-primary/20">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">ROI vs SDR Humano</h3>
            {clientName && (
              <p className="text-xs text-muted-foreground">{clientName}</p>
            )}
          </div>
        </div>

        {/* Main Savings Display */}
        <div className="text-center py-4 mb-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Economia este mês
          </p>
          <p className="text-4xl font-bold text-primary font-mono-data glow-text">
            R$ {roi.sdrAISavings.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            usando SDR IA vs SDR Humano
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <Clock className="h-4 w-4 text-info mx-auto mb-1" />
            <p className="text-xl font-bold font-mono-data text-foreground">
              {roi.hoursAutomated}h
            </p>
            <p className="text-[10px] text-muted-foreground">
              Automatizadas
            </p>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/30">
            <Zap className="h-4 w-4 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold font-mono-data text-foreground">
              R$ {roi.costPerLead.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Custo/Lead
            </p>
          </div>

          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold font-mono-data text-primary">
              {roi.efficiency}%
            </p>
            <p className="text-[10px] text-muted-foreground">
              Eficiência
            </p>
          </div>
        </div>

        {/* Pitch Message */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-primary">
          <p className="text-xs text-muted-foreground italic">
            "Com upgrade para o próximo plano, a economia mensal pode chegar a{" "}
            <span className="text-primary font-semibold">
              R$ {Math.round(roi.sdrAISavings * 1.5).toLocaleString()}
            </span>
            ."
          </p>
        </div>
      </div>
    </Card>
  );
}
