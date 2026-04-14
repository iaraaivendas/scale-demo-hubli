import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface LineChartWidgetProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xAxisKey?: string;
  secondaryDataKey?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  className?: string;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => string;
}

export function LineChartWidget({
  data,
  dataKey,
  xAxisKey = 'name',
  secondaryDataKey,
  showGrid = true,
  showLegend = false,
  primaryColor = 'hsl(var(--primary))',
  secondaryColor = 'hsl(var(--info))',
  height = 200,
  className,
  formatValue,
  formatTooltip,
}: LineChartWidgetProps) {
  const defaultFormatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString('pt-BR');
  };

  const valueFormatter = formatValue || defaultFormatValue;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.5} 
            />
          )}
          <XAxis 
            dataKey={xAxisKey}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={valueFormatter}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
            formatter={(value: number, name: string) => 
              formatTooltip 
                ? formatTooltip(value, name) 
                : [valueFormatter(value), name]
            }
          />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={primaryColor}
            strokeWidth={2}
            dot={{ fill: primaryColor, strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          {secondaryDataKey && (
            <Line
              type="monotone"
              dataKey={secondaryDataKey}
              stroke={secondaryColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: secondaryColor, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
