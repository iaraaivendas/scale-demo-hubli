import { ReactNode } from "react";
import { CustomerSidebar } from "./CustomerSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

// AppLayout now uses CustomerSidebar (for customer mode)
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <CustomerSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
