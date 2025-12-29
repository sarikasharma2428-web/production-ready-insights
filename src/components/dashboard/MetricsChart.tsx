import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, TrendingUp } from "lucide-react";
import { useState } from "react";

interface MetricDataPoint {
  timestamp: string;
  value: number;
  metricName: string;
}

interface MetricsChartProps {
  data: MetricDataPoint[];
  title: string;
  metricNames: string[];
}

// Color palette for different metrics
const METRIC_COLORS: Record<string, string> = {
  cpu_usage: "hsl(var(--chart-1))",
  memory_usage: "hsl(var(--chart-2))",
  latency_p99: "hsl(var(--chart-3))",
  error_rate: "hsl(var(--severity-critical))",
  requests_per_second: "hsl(var(--chart-4))",
  default: "hsl(var(--chart-5))",
};

export function MetricsChart({ data, title, metricNames }: MetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>(metricNames[0] || "cpu_usage");

  // Transform data for the chart
  const chartData = data
    .filter((d) => d.metricName === selectedMetric)
    .map((d) => ({
      time: new Date(d.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: d.value,
    }))
    .slice(-30); // Last 30 data points

  const metricColor = METRIC_COLORS[selectedMetric] || METRIC_COLORS.default;

  const formatMetricName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {metricNames.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {formatMetricName(metric)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Activity className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">No Data Available</p>
            <p className="text-sm">Metrics will appear here once collected</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={metricColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={metricColor}
                strokeWidth={2}
                fill={`url(#gradient-${selectedMetric})`}
                name={formatMetricName(selectedMetric)}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
