import { Lightbulb, LightbulbOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative transition-all duration-300",
        isLight 
          ? "text-warning hover:text-warning hover:bg-warning/10" 
          : "text-muted-foreground hover:text-primary hover:bg-primary/10",
        className
      )}
      title={isLight ? "Ativar modo escuro" : "Ativar modo claro"}
    >
      {isLight ? (
        <Lightbulb className="h-5 w-5 transition-transform duration-300 scale-110" />
      ) : (
        <LightbulbOff className="h-5 w-5 transition-transform duration-300" />
      )}
    </Button>
  );
}
