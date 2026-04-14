import { AdminLayout } from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, Shield, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const handleResetData = () => {
    localStorage.clear();
    toast({
      title: "Dados resetados",
      description: "Recarregue a página para reiniciar o demo.",
    });
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configurações do sistema I.ARA Scale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Info */}
          <Card className="iara-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Sistema</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium">1.0.0 (Demo)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ambiente</span>
                <span className="font-medium">Protótipo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Armazenamento</span>
                <span className="font-medium">LocalStorage</span>
              </div>
            </div>
          </Card>

          {/* Database */}
          <Card className="iara-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Database className="h-5 w-5 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Dados</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Todos os dados são armazenados localmente no navegador.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleResetData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar Dados Demo
              </Button>
            </div>
          </Card>

          {/* Security */}
          <Card className="iara-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Autenticação</span>
                <span className="font-medium">Mock (Demo)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sessão</span>
                <span className="font-medium">LocalStorage</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
