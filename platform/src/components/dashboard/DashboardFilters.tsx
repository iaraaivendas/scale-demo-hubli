import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type TimePeriod } from "@/lib/dashboardData";

interface DashboardFiltersProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  channel?: string;
  onChannelChange?: (channel: string) => void;
  channels?: string[];
  campaign?: string;
  onCampaignChange?: (campaign: string) => void;
  campaigns?: { id: string; name: string }[];
}

export function DashboardFilters({
  period,
  onPeriodChange,
  channel,
  onChannelChange,
  channels = [],
  campaign,
  onCampaignChange,
  campaigns = [],
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Period Filter */}
      <Select value={period} onValueChange={(value) => onPeriodChange(value as TimePeriod)}>
        <SelectTrigger className="w-[140px] bg-card border-border">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Último Mês</SelectItem>
          <SelectItem value="quarter">Trimestre</SelectItem>
          <SelectItem value="year">Ano</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Channel Filter */}
      {onChannelChange && channels.length > 0 && (
        <Select value={channel || 'all'} onValueChange={onChannelChange}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Canais</SelectItem>
            {channels.map(ch => (
              <SelectItem key={ch} value={ch}>{ch}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Campaign Filter */}
      {onCampaignChange && campaigns.length > 0 && (
        <Select value={campaign || 'all'} onValueChange={onCampaignChange}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Campanha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Campanhas</SelectItem>
            {campaigns.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
