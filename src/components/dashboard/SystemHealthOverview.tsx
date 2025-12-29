import { Activity, AlertTriangle, CheckCircle, Clock, Flame, Server, TrendingUp, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SystemHealthOverviewProps {
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  activeAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  averageUptime: number;
}

export function SystemHealthOverview({
  totalServices,
  healthyServices,
  degradedServices,
  downServices,
  activeAlerts,
  criticalAlerts,
  openIncidents,
  averageUptime,
}: SystemHealthOverviewProps) {
  const metrics = [
    {
      label: "Total Services",
      value: totalServices,
      icon: Server,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Healthy",
      value: healthyServices,
      icon: CheckCircle,
      color: "text-status-healthy",
      bgColor: "bg-status-healthy/10",
    },
    {
      label: "Degraded",
      value: degradedServices,
      icon: AlertTriangle,
      color: "text-status-warning",
      bgColor: "bg-status-warning/10",
    },
    {
      label: "Down",
      value: downServices,
      icon: XCircle,
      color: "text-status-critical",
      bgColor: "bg-status-critical/10",
    },
    {
      label: "Active Alerts",
      value: activeAlerts,
      subValue: criticalAlerts > 0 ? `${criticalAlerts} critical` : undefined,
      icon: Activity,
      color: criticalAlerts > 0 ? "text-status-critical" : "text-status-warning",
      bgColor: criticalAlerts > 0 ? "bg-status-critical/10" : "bg-status-warning/10",
    },
    {
      label: "Open Incidents",
      value: openIncidents,
      icon: Flame,
      color: openIncidents > 0 ? "text-status-critical" : "text-muted-foreground",
      bgColor: openIncidents > 0 ? "bg-status-critical/10" : "bg-muted",
    },
    {
      label: "Avg Uptime",
      value: `${averageUptime.toFixed(2)}%`,
      icon: TrendingUp,
      color: averageUptime >= 99.9 ? "text-status-healthy" : averageUptime >= 99 ? "text-status-warning" : "text-status-critical",
      bgColor: averageUptime >= 99.9 ? "bg-status-healthy/10" : averageUptime >= 99 ? "bg-status-warning/10" : "bg-status-critical/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", metric.bgColor)}>
                  <Icon className={cn("h-5 w-5", metric.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  {metric.subValue && (
                    <p className="text-xs text-status-critical">{metric.subValue}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
