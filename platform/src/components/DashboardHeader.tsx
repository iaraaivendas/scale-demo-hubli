import { getSession, getUser, getClient } from "@/lib/storage";
import { ThemeToggle } from "./ThemeToggle";

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const session = getSession();
  const user = session ? getUser(session.userId) : null;
  const client = session ? getClient(session.clientId) : null;

  // Generate personalized greeting based on role
  const getGreeting = (): string => {
    if (!user) return "Olá!";

    if (session?.role === "superadmin" || user.role === "superadmin") {
      // SuperAdmin sees their full name
      return `Olá, ${user.name}!`;
    }

    if (user.role === "gestor") {
      // Gestor sees company name
      return client ? `Olá, ${client.name}!` : `Olá, ${user.name}!`;
    }

    // Other roles see their first name
    const firstName = user.name.split(" ")[0];
    return `Olá, ${firstName}!`;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()} <span className="inline-block animate-wave">👋</span>
          </h1>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

