import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Save, 
  Layout, 
  Settings, 
  Trash2, 
  Check,
  RefreshCw,
  Edit,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWidgets } from "@/contexts/WidgetContext";
import { type WidgetType, WIDGET_TYPE_LABELS, createWidget } from "@/lib/widgets";
import { useState } from "react";

interface WidgetToolbarProps {
  className?: string;
  showLayoutSelector?: boolean;
  onAddWidget?: (type: WidgetType) => void;
}

export function WidgetToolbar({ 
  className,
  showLayoutSelector = true,
  onAddWidget,
}: WidgetToolbarProps) {
  const { 
    currentLayout, 
    layouts, 
    loadLayout, 
    saveCurrentLayout, 
    deleteLayout,
    isEditing,
    setIsEditing,
    triggerRefresh,
    addWidget,
  } = useWidgets();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');

  const widgetTypes: WidgetType[] = [
    'kpi',
    'line-chart',
    'bar-chart',
    'donut-chart',
    'progress',
    'table',
    'heatmap',
  ];

  const handleSaveLayout = () => {
    saveCurrentLayout(layoutName || undefined);
    setSaveDialogOpen(false);
    setLayoutName('');
  };

  const handleAddWidget = (type: WidgetType) => {
    if (onAddWidget) {
      onAddWidget(type);
    } else {
      const widget = createWidget(type, `Novo ${WIDGET_TYPE_LABELS[type]}`, 'custom');
      addWidget(widget);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg bg-card border border-border",
      className
    )}>
      {/* Edit Mode Toggle */}
      <Button
        variant={isEditing ? "default" : "outline"}
        size="sm"
        onClick={() => setIsEditing(!isEditing)}
        className="gap-2"
      >
        {isEditing ? (
          <>
            <Check className="h-4 w-4" />
            Concluir
          </>
        ) : (
          <>
            <Edit className="h-4 w-4" />
            Editar
          </>
        )}
      </Button>

      {/* Add Widget */}
      {isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Widget
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {widgetTypes.map((type) => (
              <DropdownMenuItem 
                key={type}
                onClick={() => handleAddWidget(type)}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                {WIDGET_TYPE_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="flex-1" />

      {/* Refresh Data */}
      <Button
        variant="ghost"
        size="sm"
        onClick={triggerRefresh}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Atualizar</span>
      </Button>

      {/* Layout Selector */}
      {showLayoutSelector && layouts.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Layout className="h-4 w-4" />
              {currentLayout?.name || 'Layouts'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {layouts.map((layout) => (
              <DropdownMenuItem 
                key={layout.id}
                onClick={() => loadLayout(layout.id)}
                className="justify-between"
              >
                <span>{layout.name}</span>
                {currentLayout?.id === layout.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {currentLayout && (
              <DropdownMenuItem 
                onClick={() => deleteLayout(currentLayout.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Layout Atual
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Save Layout */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Layout</DialogTitle>
            <DialogDescription>
              Salve a configuração atual dos widgets para uso futuro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="layoutName">Nome do Layout</Label>
              <Input
                id="layoutName"
                placeholder={currentLayout?.name || 'Meu Layout Personalizado'}
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLayout}>
              Salvar Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
