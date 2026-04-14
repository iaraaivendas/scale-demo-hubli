import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Settings, 
  Trash2,
  GripVertical,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type WidgetConfig, type WidgetSize, WIDGET_SIZE_CLASS } from "@/lib/widgets";

interface WidgetContainerProps {
  config: WidgetConfig;
  children: React.ReactNode;
  isEditing?: boolean;
  onResize?: (size: WidgetSize) => void;
  onToggleVisibility?: () => void;
  onRemove?: () => void;
  onSettings?: () => void;
  onRefresh?: () => void;
  className?: string;
  dragHandleProps?: Record<string, unknown>;
}

export function WidgetContainer({
  config,
  children,
  isEditing = false,
  onResize,
  onToggleVisibility,
  onRemove,
  onSettings,
  onRefresh,
  className,
  dragHandleProps,
}: WidgetContainerProps) {
  const sizeOptions: { label: string; value: WidgetSize }[] = [
    { label: 'Pequeno', value: 'sm' },
    { label: 'Médio', value: 'md' },
    { label: 'Grande', value: 'lg' },
    { label: 'Extra Grande', value: 'xl' },
  ];

  if (!config.visible && !isEditing) {
    return null;
  }

  return (
    <Card 
      className={cn(
        "iara-card relative group transition-all duration-200",
        WIDGET_SIZE_CLASS[config.size],
        !config.visible && "opacity-50",
        isEditing && "ring-2 ring-primary/20 ring-dashed",
        className
      )}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isEditing && (
            <div 
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <h3 className="font-semibold text-foreground text-sm">{config.title}</h3>
        </div>
        
        {/* Actions Menu */}
        <div className={cn(
          "flex items-center gap-1 transition-opacity",
          !isEditing && "opacity-0 group-hover:opacity-100"
        )}>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Size Options */}
              {onResize && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Tamanho
                  </div>
                  {sizeOptions.map((option) => (
                    <DropdownMenuItem 
                      key={option.value}
                      onClick={() => onResize(option.value)}
                      className={cn(config.size === option.value && "bg-accent")}
                    >
                      {option.value === 'sm' && <Minimize2 className="h-4 w-4 mr-2" />}
                      {(option.value === 'md' || option.value === 'lg') && (
                        <Maximize2 className="h-4 w-4 mr-2" />
                      )}
                      {option.value === 'xl' && <Maximize2 className="h-4 w-4 mr-2" />}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Visibility */}
              {onToggleVisibility && (
                <DropdownMenuItem onClick={onToggleVisibility}>
                  {config.visible ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Ocultar Widget
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Mostrar Widget
                    </>
                  )}
                </DropdownMenuItem>
              )}
              
              {/* Settings */}
              {onSettings && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
              )}
              
              {/* Remove */}
              {onRemove && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onRemove}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Widget
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Widget Content */}
      <div className="min-h-0">
        {children}
      </div>
    </Card>
  );
}
