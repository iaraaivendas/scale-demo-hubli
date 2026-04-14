import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IaraLogo } from "@/components/IaraLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon, Lock, Mail, Loader2, Info, Copy, Check, ShieldCheck, BarChart3, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSession, getUserByEmail, setSession, bootstrapUsers, loadUsers } from "@/lib/storage";
import { cn } from "@/lib/utils";

// Demo credentials for development (4 roles)
const DEMO_CREDENTIALS = [
  { 
    role: 'SuperAdmin', 
    email: 'matheus@iara.com', 
    password: 'admin2026',
    icon: ShieldCheck,
    description: 'Fundador I.ARA - Acesso total',
    isSuperAdmin: true,
  },
  { 
    role: 'Gestor', 
    email: 'gestor@iara.com', 
    password: 'senha123',
    icon: ShieldCheck,
    description: 'Cliente - Acesso completo',
    isSuperAdmin: false,
  },
  { 
    role: 'Marketing', 
    email: 'marketing@iara.com', 
    password: 'senha123',
    icon: BarChart3,
    description: 'Cliente - Analytics e campanhas',
    isSuperAdmin: false,
  },
  { 
    role: 'Vendas', 
    email: 'vendas@iara.com', 
    password: 'senha123',
    icon: Briefcase,
    description: 'Cliente - Leads atribuídos',
    isSuperAdmin: false,
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState<number | null>(null);

  useEffect(() => {
    // Ensure demo users exist in localStorage
    bootstrapUsers();
    
    // Debug: log current users
    const users = loadUsers();
    console.log('[IARA Login] Users in localStorage:', users.map(u => ({ email: u.email, password: u.password, active: u.active, role: u.role })));

    const session = getSession();
    if (session?.mode === "customer") {
      navigate("/dashboard");
      return;
    }
    setCheckingAuth(false);
  }, [navigate]);

  const handleSelectCredential = (index: number, cred: typeof DEMO_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setSelectedCredential(index);
    toast({
      title: "Credenciais selecionadas",
      description: `${cred.role}: ${cred.email}`,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const user = getUserByEmail(email.trim());

      console.log('[IARA Login] Attempting login for:', email);
      console.log('[IARA Login] User found:', user ? { email: user.email, active: user.active, hasPassword: !!user.password, role: user.role } : 'not found');

      if (!user) {
        toast({
          title: "Usuário não encontrado",
          description: "Este email não está cadastrado no sistema.",
          variant: "destructive",
        });
        return;
      }

      if (user.active !== true) {
        toast({
          title: "Usuário inativo",
          description: "Sua conta está desativada. Contate o administrador.",
          variant: "destructive",
        });
        return;
      }

      if (password !== user.password) {
        toast({
          title: "Senha incorreta",
          description: "A senha informada não corresponde.",
          variant: "destructive",
        });
        return;
      }

      // For superadmin, set first client as default viewing client
      const viewingClientId = user.role === 'superadmin' ? 'client_001' : undefined;
      
      setSession({
        userId: user.id,
        clientId: user.clientId,
        email: user.email,
        role: user.role,
        loginAt: new Date().toISOString(),
        mode: "customer",
        viewingClientId,
      });

      toast({
        title: "Login realizado!",
        description: user.role === 'superadmin' 
          ? `Bem-vindo, ${user.name}! (SuperAdmin - Acesso Total)`
          : `Bem-vindo, ${user.name}! (${user.role})`,
      });

      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <IaraLogo size="lg" />
          <p className="mt-4 text-muted-foreground text-center">
            Revenue Operations & AI Growth Intelligence
          </p>
        </div>

        {/* Demo Credentials Card */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3 mb-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Credenciais de Desenvolvimento
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique para preencher automaticamente
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {DEMO_CREDENTIALS.map((cred, index) => {
              const Icon = cred.icon;
              const isSelected = selectedCredential === index;
              const isSuperAdminCred = cred.isSuperAdmin;
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                    isSelected 
                      ? "bg-primary/20 border border-primary/40" 
                      : isSuperAdminCred
                        ? "bg-warning/5 hover:bg-warning/10 border border-warning/20"
                        : "bg-background/50 hover:bg-background border border-transparent"
                  )}
                  onClick={() => handleSelectCredential(index, cred)}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    isSelected 
                      ? "bg-primary/30" 
                      : isSuperAdminCred 
                        ? "bg-warning/20" 
                        : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      isSelected 
                        ? "text-primary" 
                        : isSuperAdminCred 
                          ? "text-warning" 
                          : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        isSuperAdminCred ? "text-warning" : "text-foreground"
                      )}>
                        {cred.role}
                      </span>
                      {isSuperAdminCred && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-medium">
                          FUNDADOR
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">• {cred.description}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {cred.email} / {cred.password}
                    </p>
                  </div>
                  {isSelected ? (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Login Card */}
        <Card className="iara-card-glow p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Acesso ao Sistema
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Entre com suas credenciais de cliente I.ARA
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="iara"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Acesso exclusivo para clientes I.ARA Scale
        </p>
      </div>
    </div>
  );
}
