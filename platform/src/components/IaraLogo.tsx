import { cn } from "@/lib/utils";
import iaraLogoImg from "@/assets/iara-logo.png";

interface IaraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function IaraLogo({ className, size = "md", showText = true }: IaraLogoProps) {
  const sizes = {
    sm: { icon: "h-6 w-auto", text: "text-lg" },
    md: { icon: "h-8 w-auto", text: "text-xl" },
    lg: { icon: "h-12 w-auto", text: "text-3xl" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src={iaraLogoImg} 
        alt="I.ARA Logo" 
        className={cn("object-contain", sizes[size].icon)}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "font-bold tracking-tight gradient-text-iara",
            sizes[size].text
          )}>
            Scale
          </span>
        </div>
      )}
    </div>
  );
}
