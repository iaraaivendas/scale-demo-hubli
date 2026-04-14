import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IaraLogo } from "@/components/IaraLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  isAdminAuthenticated, 
  setSession,
  setAdminUser,
  initializeDemoData,
} from "@/lib/storage";
import { Shield, Lock } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@iara.scale");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    initializeDemoData();
    
    if (isAdminAuthenticated()) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Demo admin credentials
    if (email === "admin@iara.scale" && password === "admin123") {
      setAdminUser({
        id: "admin_001",
        name: "I.ARA Admin",
        email: "admin@iara.scale",
      });
      
      setSession({
        userId: "admin_001",
        clientId: "",
        email: "admin@iara.scale",
        role: "iara_admin",
        loginAt: new Date().toISOString(),
        mode: "iara_admin",
      });
      
      navigate("/admin/dashboard");
    } else {
      setError("Credenciais inválidas");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <IaraLogo size="lg" />
          <div className="flex items-center gap-2 mt-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-primary font-semibold">Admin Console</span>
          </div>
          <p className="mt-2 text-muted-foreground text-center text-sm">
            Painel administrativo do I.ARA Scale
          </p>
        </div>

        {/* Login Card */}
        <Card className="iara-card-glow p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Acesso Administrativo
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use as credenciais: admin@iara.scale / admin123
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@iara.scale"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              variant="iara"
              size="lg"
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Entrar no Admin
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Protótipo funcional — Acesso restrito
        </p>
      </div>
    </div>
  );
}
