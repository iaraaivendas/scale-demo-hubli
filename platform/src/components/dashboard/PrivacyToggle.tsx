import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PrivacyToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

export function PrivacyToggle({ isVisible, onToggle, className }: PrivacyToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200",
              "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "text-muted-foreground hover:text-foreground",
              className
            )}
            aria-label={isVisible ? "Ocultar valores sensíveis" : "Exibir valores sensíveis"}
          >
            {isVisible ? (
              <Eye className="h-4 w-4 transition-transform duration-200" />
            ) : (
              <EyeOff className="h-4 w-4 transition-transform duration-200" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {isVisible ? "Ocultar valores sensíveis" : "Exibir valores sensíveis"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
