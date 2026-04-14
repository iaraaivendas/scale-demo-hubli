import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CampaignPerformance } from '@/lib/dashboardData';
import { formatROI, getROIColorClass } from '@/lib/financialData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CampaignPerformanceTableProps {
  data: CampaignPerformance[];
  title?: string;
}

export function CampaignPerformanceTable({ data, title = "Performance de Campanhas" }: CampaignPerformanceTableProps) {
  // Sort by ROI descending
  const sortedData = [...data].sort((a, b) => b.roi - a.roi);
  
  return (
    <Card className="iara-card-glow overflow-hidden">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 p-6 pb-0">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Campanha</TableHead>
              <TableHead className="text-muted-foreground">Canal</TableHead>
              <TableHead className="text-right text-muted-foreground">Leads</TableHead>
              <TableHead className="text-right text-muted-foreground">Conversões</TableHead>
              <TableHead className="text-right text-muted-foreground">Receita</TableHead>
              <TableHead className="text-right text-muted-foreground">ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((campaign) => (
              <TableRow 
                key={campaign.id} 
                className="border-border/50 hover:bg-accent/30 transition-colors"
              >
                <TableCell className="font-medium text-foreground">
                  {campaign.name}
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                    {campaign.channel}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono-data">
                  {campaign.leads}
                </TableCell>
                <TableCell className="text-right font-mono-data text-primary">
                  {campaign.conversions}
                </TableCell>
                <TableCell className="text-right font-mono-data">
                  R$ {campaign.revenue.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className={cn(
                    "flex items-center justify-end gap-1 font-mono-data font-semibold",
                    getROIColorClass(campaign.roi)
                  )}>
                    {campaign.roi > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : campaign.roi < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : null}
                    {formatROI(campaign.roi)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
