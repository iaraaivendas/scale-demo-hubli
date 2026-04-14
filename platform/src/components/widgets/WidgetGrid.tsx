import { cn } from "@/lib/utils";
import { type WidgetConfig } from "@/lib/widgets";

interface WidgetGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function WidgetGrid({ 
  children, 
  className,
  cols = 4,
}: WidgetGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      "grid gap-4 auto-rows-auto",
      colsClass[cols],
      className
    )}>
      {children}
    </div>
  );
}
