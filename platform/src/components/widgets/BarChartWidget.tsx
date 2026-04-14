import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface BarChartWidgetProps {
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
  highlightIndex?: number;
  barRadius?: number;
}

export function BarChartWidget({
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
  highlightIndex,
  barRadius = 4,
}: BarChartWidgetProps) {
  const defaultFormatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString('pt-BR');
  };

  const valueFormatter = formatValue || defaultFormatValue;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.5}
              vertical={false}
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
            cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
          />
          {showLegend && <Legend />}
          <Bar 
            dataKey={dataKey}
            radius={[barRadius, barRadius, 0, 0]}
          >
            {data.map((_, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={highlightIndex !== undefined && index === highlightIndex 
                  ? 'hsl(var(--primary))' 
                  : primaryColor
                }
                opacity={highlightIndex !== undefined && index !== highlightIndex ? 0.6 : 1}
              />
            ))}
          </Bar>
          {secondaryDataKey && (
            <Bar 
              dataKey={secondaryDataKey}
              fill={secondaryColor}
              radius={[barRadius, barRadius, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
