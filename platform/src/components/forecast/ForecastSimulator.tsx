import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Play,
  Loader2,
  Lock,
  Sparkles,
  DollarSign,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getSession, getClient, type Client } from '@/lib/storage';
import { formatCurrency } from '@/lib/plans';

interface SimulationParams {
  periodo: string;
  vendedores: number;
  ticketMedio: number;
  taxaConversao: number;
  leadsNovos: number;
  crescimentoMensal: number;
  churnRate: number;
  upsellRate: number;
}

interface MonthResult {
  mes: number;
  leads: number;
  vendas: number;
  receita: number;
  churn: number;
  upsell: number;
  receitaAcumulada: number;
}

interface Insight {
  tipo: 'positivo' | 'alerta' | 'critico' | 'oportunidade';
  titulo: string;
  descricao: string;
}

interface SimulationResult {
  parametros: SimulationParams;
  resultados: MonthResult[];
  resumo: {
    totalLeads: number;
    totalVendas: number;
    receitaTotal: number;
    ticketMedioReal: number;
    taxaConversaoMedia: number;
    crescimentoReceita: string;
  };
  insights: Insight[];
}

function gerarInsights(params: SimulationParams, resultados: MonthResult[]): Insight[] {
  const insights: Insight[] = [];

  const crescimento = parseFloat(
    ((resultados[resultados.length - 1].receita / resultados[0].receita - 1) * 100).toFixed(1)
  );

  if (crescimento > 50) {
    insights.push({
      tipo: 'positivo',
      titulo: 'Crescimento Acelerado',
      descricao: `Projeção de crescimento de ${crescimento}% indica trajetória muito positiva.`,
    });
  } else if (crescimento < 10) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Crescimento Moderado',
      descricao: `Crescimento de ${crescimento}% pode ser melhorado com mais investimento em aquisição.`,
    });
  }

  if (params.taxaConversao < 15) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Taxa de Conversão Baixa',
      descricao: 'Considere otimizar processo de vendas ou qualificação de leads.',
    });
  } else if (params.taxaConversao > 25) {
    insights.push({
      tipo: 'positivo',
      titulo: 'Excelente Conversão',
      descricao: 'Sua taxa de conversão está acima da média do mercado.',
    });
  }

  if (params.churnRate > 5) {
    insights.push({
      tipo: 'critico',
      titulo: 'Churn Alto',
      descricao: 'Churn acima de 5% pode comprometer crescimento sustentável. Priorize retenção.',
    });
  }

  if (params.upsellRate < 10) {
    insights.push({
      tipo: 'oportunidade',
      titulo: 'Oportunidade de Upsell',
      descricao: 'Há potencial para aumentar upsell/cross-sell e maximizar receita por cliente.',
    });
  }

  return insights;
}

function calcularComplexidade(params: SimulationParams): string {
  let score = 0;
  if (parseInt(params.periodo) > 180) score += 2;
  else if (parseInt(params.periodo) > 90) score += 1;
  if (params.vendedores > 10) score += 1;
  if (params.crescimentoMensal > 20) score += 1;
  if (score <= 2) return 'simples';
  if (score <= 4) return 'media';
  return 'complexa';
}

interface ForecastSimulatorProps {
  clientId: string;
}

export function ForecastSimulator({ clientId }: ForecastSimulatorProps) {
  const [client, setClient] = useState<Client | undefined>();
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState<SimulationResult | null>(null);
  const [simulacoesCount, setSimulacoesCount] = useState(0);

  const [params, setParams] = useState<SimulationParams>({
    periodo: '90',
    vendedores: 5,
    ticketMedio: 3000,
    taxaConversao: 18,
    leadsNovos: 300,
    crescimentoMensal: 10,
    churnRate: 3,
    upsellRate: 15,
  });

  useEffect(() => {
    const clientData = getClient(clientId);
    setClient(clientData);
  }, [clientId]);

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem('simulationLogs') || '[]');
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisMonthLogs = logs.filter((log: any) => log.timestamp.startsWith(thisMonth));
    setSimulacoesCount(thisMonthLogs.length);
  }, [resultado]);

  const canSimulate = client?.plan !== 'ESSENCIAL';

  const executarSimulacao = async () => {
    if (!canSimulate) return;
    setSimulando(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const meses = parseInt(params.periodo) / 30;
    const resultados: MonthResult[] = [];
    let leadsAcumulados = 0;
    let receitaTotal = 0;

    for (let mes = 1; mes <= meses; mes++) {
      const leadsDoMes = Math.round(
        params.leadsNovos * Math.pow(1 + params.crescimentoMensal / 100, mes - 1)
      );
      const vendasDoMes = Math.round(leadsDoMes * (params.taxaConversao / 100));
      const receitaDoMes = vendasDoMes * params.ticketMedio;
      const churnDoMes = mes > 1 ? Math.round(vendasDoMes * (params.churnRate / 100)) : 0;
      const upsellDoMes = Math.round(vendasDoMes * (params.upsellRate / 100));

      leadsAcumulados += leadsDoMes;
      receitaTotal += receitaDoMes;

      resultados.push({
        mes,
        leads: leadsDoMes,
        vendas: vendasDoMes,
        receita: receitaDoMes,
        churn: churnDoMes,
        upsell: upsellDoMes,
        receitaAcumulada: receitaTotal,
      });
    }

    const totalVendas = resultados.reduce((sum, r) => sum + r.vendas, 0);

    const sim: SimulationResult = {
      parametros: params,
      resultados,
      resumo: {
        totalLeads: leadsAcumulados,
        totalVendas,
        receitaTotal,
        ticketMedioReal: totalVendas > 0 ? receitaTotal / totalVendas : 0,
        taxaConversaoMedia: leadsAcumulados > 0 ? (totalVendas / leadsAcumulados) * 100 : 0,
        crescimentoReceita: (
          (resultados[resultados.length - 1].receita / resultados[0].receita - 1) *
          100
        ).toFixed(1),
      },
      insights: gerarInsights(params, resultados),
    };

    localStorage.setItem('lastSimulation', JSON.stringify(sim));

    const logs = JSON.parse(localStorage.getItem('simulationLogs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      plano: client?.plan,
      tipo: parseInt(params.periodo) <= 90 ? 'curto_prazo' : 'longo_prazo',
      complexidade: calcularComplexidade(params),
      poolsConsumidos: 0,
    });
    localStorage.setItem('simulationLogs', JSON.stringify(logs.slice(-100)));

    setResultado(sim);
    setSimulando(false);
  };

  const updateParam = (key: keyof SimulationParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Locked state for Essencial plan
  if (!canSimulate) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Simulações de Forecast</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Projete cenários, compare estratégias e tome decisões baseadas em dados com simulações
            ilimitadas.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-6 max-w-2xl mx-auto">
            <div className="p-4 bg-muted rounded-lg">
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Múltiplos Cenários</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <LineChartIcon className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Projeções 12 meses</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <Target className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Insights IA</p>
            </div>
          </div>

          <Button size="lg" className="text-lg px-8">
            Fazer Upgrade para Growth
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            A partir de R$ 1.299,00/mês • Simulações ilimitadas incluídas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
            <Sparkles className="w-3 h-3" />
            Simulações Ilimitadas
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {simulacoesCount} simulações este mês • 0 pools consumidos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Parâmetros da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Período de Projeção</Label>
                <Select value={params.periodo} onValueChange={(v) => updateParam('periodo', v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dias (1 mês)</SelectItem>
                    <SelectItem value="90">90 dias (3 meses)</SelectItem>
                    <SelectItem value="180">180 dias (6 meses)</SelectItem>
                    <SelectItem value="360">360 dias (12 meses)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Leads Novos/Mês
                </Label>
                <Input
                  type="number"
                  value={params.leadsNovos}
                  onChange={(e) => updateParam('leadsNovos', parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Taxa de Conversão (%)</Label>
                <Input
                  type="number"
                  value={params.taxaConversao}
                  onChange={(e) => updateParam('taxaConversao', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">Atual: {params.taxaConversao}%</p>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Ticket Médio (R$)
                </Label>
                <Input
                  type="number"
                  value={params.ticketMedio}
                  onChange={(e) => updateParam('ticketMedio', parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Crescimento Mensal (%)</Label>
                <Input
                  type="number"
                  value={params.crescimentoMensal}
                  onChange={(e) => updateParam('crescimentoMensal', parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Churn Rate (%)</Label>
                <Input
                  type="number"
                  value={params.churnRate}
                  onChange={(e) => updateParam('churnRate', parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Upsell Rate (%)</Label>
                <Input
                  type="number"
                  value={params.upsellRate}
                  onChange={(e) => updateParam('upsellRate', parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              <Button
                onClick={executarSimulacao}
                disabled={simulando}
                className="w-full mt-2"
                size="lg"
              >
                {simulando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Executar Simulação
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                ✨ Não consome pools • Ilimitado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {resultado ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {resultado.resumo.totalLeads.toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Vendas</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {resultado.resumo.totalVendas.toLocaleString('pt-BR')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {formatCurrency(resultado.resumo.receitaTotal)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Crescimento</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      +{resultado.resumo.crescimentoReceita}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Insights */}
              {resultado.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Insights da Simulação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {resultado.insights.map((insight, idx) => {
                      const styles = {
                        positivo: 'bg-green-50 border-l-green-500 dark:bg-green-950/20',
                        alerta: 'bg-yellow-50 border-l-yellow-500 dark:bg-yellow-950/20',
                        critico: 'bg-red-50 border-l-red-500 dark:bg-red-950/20',
                        oportunidade: 'bg-blue-50 border-l-blue-500 dark:bg-blue-950/20',
                      };
                      const textStyles = {
                        positivo: 'text-green-900 dark:text-green-300',
                        alerta: 'text-yellow-900 dark:text-yellow-300',
                        critico: 'text-red-900 dark:text-red-300',
                        oportunidade: 'text-blue-900 dark:text-blue-300',
                      };
                      const descStyles = {
                        positivo: 'text-green-700 dark:text-green-400',
                        alerta: 'text-yellow-700 dark:text-yellow-400',
                        critico: 'text-red-700 dark:text-red-400',
                        oportunidade: 'text-blue-700 dark:text-blue-400',
                      };
                      const icons = {
                        positivo: <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />,
                        alerta: <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />,
                        critico: <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />,
                        oportunidade: <Target className="w-5 h-5 text-blue-600 mt-0.5" />,
                      };

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border-l-4 ${styles[insight.tipo]}`}
                        >
                          <div className="flex items-start gap-3">
                            {icons[insight.tipo]}
                            <div className="flex-1">
                              <p className={`font-medium ${textStyles[insight.tipo]}`}>
                                {insight.titulo}
                              </p>
                              <p className={`text-sm mt-1 ${descStyles[insight.tipo]}`}>
                                {insight.descricao}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Results Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Projeção Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead className="text-right">Leads</TableHead>
                          <TableHead className="text-right">Vendas</TableHead>
                          <TableHead className="text-right">Receita</TableHead>
                          <TableHead className="text-right">Acumulado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.resultados.map((mes) => (
                          <TableRow key={mes.mes}>
                            <TableCell className="font-medium">Mês {mes.mes}</TableCell>
                            <TableCell className="text-right">
                              {mes.leads.toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {mes.vendas}
                            </TableCell>
                            <TableCell className="text-right text-primary font-medium">
                              {formatCurrency(mes.receita)}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(mes.receitaAcumulada)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Configure sua simulação</h3>
                <p className="text-muted-foreground">
                  Ajuste os parâmetros ao lado e clique em "Executar Simulação"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
