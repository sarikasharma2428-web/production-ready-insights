import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  name: string;
  displayName: string;
  status: string;
  uptime: number;
  latencyP50: number;
  latencyP99: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
}

export function ServiceCard({
  name,
  displayName,
  status,
  uptime,
  latencyP50,
  latencyP99,
  errorRate,
  cpuUsage,
  memoryUsage,
  requestsPerSecond,
}: ServiceCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "healthy":
        return { icon: CheckCircle, color: "text-status-healthy", bg: "bg-status-healthy/10", label: "Healthy" };
      case "degraded":
        return { icon: AlertTriangle, color: "text-status-warning", bg: "bg-status-warning/10", label: "Degraded" };
      case "down":
        return { icon: Activity, color: "text-status-critical", bg: "bg-status-critical/10", label: "Down" };
      default:
        return { icon: Activity, color: "text-status-info", bg: "bg-status-info/10", label: "Unknown" };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{displayName}</CardTitle>
          <Badge 
            variant="secondary" 
            className={cn("gap-1.5", statusConfig.bg, statusConfig.color)}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground font-mono">{name}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Uptime</span>
            </div>
            <p className="text-lg font-semibold">{uptime.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>RPS</span>
            </div>
            <p className="text-lg font-semibold">{requestsPerSecond.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              <span>Errors</span>
            </div>
            <p className={cn("text-lg font-semibold", errorRate > 1 && "text-status-critical")}>
              {errorRate.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Latency */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-medium">p50: {latencyP50}ms | p99: {latencyP99}ms</span>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Cpu className="h-3 w-3" />
              <span>CPU</span>
            </div>
            <span className="font-medium">{cpuUsage.toFixed(1)}%</span>
          </div>
          <Progress value={cpuUsage} className="h-1.5" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              <span>Memory</span>
            </div>
            <span className="font-medium">{memoryUsage.toFixed(1)}%</span>
          </div>
          <Progress value={memoryUsage} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
