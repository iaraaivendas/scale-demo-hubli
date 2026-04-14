import { 
  MessageSquare, 
  RefreshCw, 
  LineChart, 
  TrendingUp, 
  Megaphone, 
  FileEdit,
  Zap
} from "lucide-react";
import type { AITypeId } from "@/lib/aiTypes";
import { cn } from "@/lib/utils";

const iconMap: Record<AITypeId, typeof MessageSquare> = {
  commercial: MessageSquare,
  reactivation: RefreshCw,
  performance: LineChart,
  upsell: TrendingUp,
  marketing: Megaphone,
  copy: FileEdit,
};

interface AITypeIconProps {
  aiTypeId: AITypeId;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AITypeIcon({ aiTypeId, className, size = 'md' }: AITypeIconProps) {
  const Icon = iconMap[aiTypeId] || Zap;
  
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return <Icon className={cn(sizeClasses[size], className)} />;
}
