import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import type { CampaignPerformance } from '@/lib/dashboardData';

interface LeadsByCampaignChartProps {
  data: CampaignPerformance[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{data.name}</p>
        <p className="text-xs text-muted-foreground">{data.channel}</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm font-mono-data text-primary">
            {data.leads} leads
          </p>
          <p className="text-sm font-mono-data text-info">
            {data.conversions} conversões
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function LeadsByCampaignChart({ data, title = "Leads por Campanha" }: LeadsByCampaignChartProps) {
  // Sort by leads descending and take top 6
  const sortedData = [...data].sort((a, b) => b.leads - a.leads).slice(0, 6);
  
  return (
    <Card className="iara-card-glow">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={sortedData} 
            layout="vertical"
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <XAxis 
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(142, 50%, 15%, 0.3)' }} />
            <Bar 
              dataKey="leads" 
              fill="hsl(142, 76%, 45%)"
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
