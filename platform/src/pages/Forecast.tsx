import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LineChart, TrendingUp, Megaphone, Calculator } from "lucide-react";
import {
  getSession,
  getClient,
  getUsers,
  initializeDemoData,
  type Client,
} from "@/lib/storage";
import {
  FinancialForecastDashboard,
  CommercialForecastDashboard,
  MarketingForecastDashboard,
  ForecastSimulator,
} from "@/components/forecast";
import { DataProvider } from "@/contexts/DataContext";
import { RealtimeIndicator, SimulatorControls } from "@/components/widgets";

export default function Forecast() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get("tab") || "financial";

  useEffect(() => {
    initializeDemoData();

    const session = getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const clientData = getClient(session.clientId);
    const clientUsers = getUsers(session.clientId);
    const userData = clientUsers.find((u) => u.role === "gestor") || clientUsers[0];

    setClient(clientData);

    if (userData?.role === "vendedor") {
      navigate("/dashboard");
      return;
    }

    setLoading(false);
  }, [navigate]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <DataProvider clientId={client?.id}>
      <AppLayout>
        <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Forecast
              </h1>
              <p className="text-muted-foreground mt-1">
                Projeções financeiras, comerciais e de marketing de {client?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SimulatorControls compact />
              <RealtimeIndicator showControls />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-card border border-border h-auto p-1">
              <TabsTrigger value="financial" className="gap-2">
                <LineChart className="h-4 w-4" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="commercial" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Comercial
              </TabsTrigger>
              <TabsTrigger value="marketing" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="simulator" className="gap-2">
                <Calculator className="h-4 w-4" />
                Simulador
              </TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="space-y-6">
              {client && <FinancialForecastDashboard clientId={client.id} />}
            </TabsContent>

            <TabsContent value="commercial" className="space-y-6">
              {client && <CommercialForecastDashboard clientId={client.id} />}
            </TabsContent>

            <TabsContent value="marketing" className="space-y-6">
              {client && <MarketingForecastDashboard clientId={client.id} />}
            </TabsContent>

            <TabsContent value="simulator" className="space-y-6">
              {client && <ForecastSimulator clientId={client.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </DataProvider>
  );
}
