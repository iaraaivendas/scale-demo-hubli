import {
  LayoutDashboard,
  Users,
  Target,
  Megaphone,
  Settings,
  LogOut,
  Building,
  BarChart3,
  Zap,
  FileText,
  ChevronLeft,
  MessageCircle,
  LineChart,
  Inbox,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { IaraLogo } from "./IaraLogo";
import { Button } from "./ui/button";
import { clearSession, getSession, getUser, getClient, getWhatsAppConversations, getLead } from "@/lib/storage";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox de Agentes", href: "/inbox", icon: Inbox },
  { name: "Leads", href: "/leads", icon: Target },
  { name: "WhatsApp", href: "/whatsapp", icon: MessageCircle, badge: true },
  { name: "Clientes", href: "/clients", icon: Building },
  { name: "Campanhas", href: "/campaigns", icon: Megaphone },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Forecast", href: "/forecast", icon: LineChart },
  { name: "Copy IA", href: "/copy", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeConversations, setActiveConversations] = useState(0);
  
  const session = getSession();
  const user = session ? getUser(session.userId) : null;
  const client = session ? getClient(session.clientId) : null;

  useEffect(() => {
    if (session) {
      const conversations = getWhatsAppConversations(session.clientId);
      const active = conversations.filter(c => {
        const lead = getLead(c.leadId);
        return lead && lead.aiStatus !== 'not_activated' && lead.aiStatus !== 'archived';
      });
      setActiveConversations(active.length);
    }
  }, [session?.clientId, location.pathname]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <IaraLogo size="sm" showText={!collapsed} />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:text-sidebar-primary"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && user && client && (
        <div className="px-4 py-4 border-b border-sidebar-border">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{client.name}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-xs text-primary font-medium">
              {client.plan}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const showBadge = item.badge && activeConversations > 0;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive && "text-primary"
              )} />
              {!collapsed && (
                <span className="flex-1">{item.name}</span>
              )}
              {showBadge && (
                <span className={cn(
                  "text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium",
                  collapsed && "absolute top-0 right-0"
                )}>
                  {activeConversations}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-2 py-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </NavLink>
        
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
            "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
