import { useState } from "react";
import { useMetrics } from "@/hooks/useMetrics";
import { useServices } from "@/hooks/useServices";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, RefreshCw, Zap } from "lucide-react";

export default function MetricsPage() {
  const { metrics, metricsStatus, loading, refetch } = useMetrics();
  const { services } = useServices();
  const [selectedService, setSelectedService] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("1h");

  const filteredMetrics = selectedService === "all"
    ? metrics
    : metrics.filter((m) => m.service_id === selectedService);

  const metricsData = filteredMetrics.map((m) => ({
    timestamp: m.recorded_at,
    value: Number(m.value),
    metricName: m.metric_name,
  }));

  const metricNames = [...new Set(filteredMetrics.map((m) => m.metric_name))];

  // Group metrics by name for status cards
  const latestMetrics: Record<string, number> = {};
  metricNames.forEach((name) => {
    const metric = filteredMetrics.find((m) => m.metric_name === name);
    if (metric) {
      latestMetrics[name] = Number(metric.value);
    }
  });

  const getMetricIcon = (name: string) => {
    if (name.includes("cpu")) return <Cpu className="h-5 w-5" />;
    if (name.includes("memory")) return <HardDrive className="h-5 w-5" />;
    if (name.includes("latency")) return <Zap className="h-5 w-5" />;
    return <Activity className="h-5 w-5" />;
  };

  const formatMetricValue = (name: string, value: number) => {
    if (name.includes("cpu") || name.includes("memory") || name.includes("error")) {
      return `${value.toFixed(1)}%`;
    }
    if (name.includes("latency")) {
      return `${value.toFixed(0)}ms`;
    }
    if (name.includes("requests") || name.includes("rps")) {
      return `${value.toFixed(0)}/s`;
    }
    return value.toFixed(2);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
            <p className="text-muted-foreground mt-1">
              Real-time system performance metrics
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">15 minutes</SelectItem>
              <SelectItem value="1h">1 hour</SelectItem>
              <SelectItem value="6h">6 hours</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-lg" />
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            {metricNames.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metricNames.slice(0, 8).map((name) => (
                  <Card key={name}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        {getMetricIcon(name)}
                        {name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {latestMetrics[name] !== undefined
                          ? formatMetricValue(name, latestMetrics[name])
                          : "—"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Metrics Chart */}
            {metricsData.length === 0 ? (
              <div className="text-center py-16 border rounded-lg">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No metrics data</h3>
                <p className="text-muted-foreground">
                  Metrics will appear here once data is ingested
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {metricNames.map((metricName) => {
                  const chartData = metricsData
                    .filter((m) => m.metricName === metricName)
                    .slice(0, 50);
                  return (
                    <MetricsChart
                      key={metricName}
                      data={chartData}
                      title={metricName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      metricNames={[metricName]}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
