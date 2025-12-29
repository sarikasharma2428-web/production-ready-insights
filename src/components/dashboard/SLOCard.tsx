import { AlertTriangle, CheckCircle, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SLOCardProps {
  name: string;
  targetAvailability: number;
  currentAvailability: number;
  errorBudgetTotal: number;
  errorBudgetConsumed: number;
  isBreaching: boolean;
  isBudgetExhausted: boolean;
  latencyTarget: number;
  latencyCurrent: number;
  serviceName?: string;
}

export function SLOCard({
  name,
  targetAvailability,
  currentAvailability,
  errorBudgetTotal,
  errorBudgetConsumed,
  isBreaching,
  isBudgetExhausted,
  latencyTarget,
  latencyCurrent,
  serviceName,
}: SLOCardProps) {
  const errorBudgetRemaining = Math.max(0, errorBudgetTotal - errorBudgetConsumed);
  const errorBudgetPercentUsed = (errorBudgetConsumed / errorBudgetTotal) * 100;

  const getHealthStatus = () => {
    if (isBudgetExhausted) return "critical";
    if (isBreaching) return "warning";
    if (errorBudgetPercentUsed > 80) return "warning";
    return "healthy";
  };

  const status = getHealthStatus();

  const statusConfig = {
    healthy: { color: "text-status-healthy", bg: "bg-status-healthy/10", icon: CheckCircle },
    warning: { color: "text-status-warning", bg: "bg-status-warning/10", icon: AlertTriangle },
    critical: { color: "text-status-critical", bg: "bg-status-critical/10", icon: TrendingDown },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-300", isBreaching && "border-status-warning/50")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{name}</CardTitle>
            {serviceName && (
              <p className="text-xs text-muted-foreground font-mono">{serviceName}</p>
            )}
          </div>
          <Badge variant="secondary" className={cn("gap-1", config.bg, config.color)}>
            <StatusIcon className="h-3 w-3" />
            {status === "healthy" ? "On Track" : status === "warning" ? "At Risk" : "Breaching"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Availability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("font-semibold", currentAvailability < targetAvailability && "text-status-critical")}>
                {currentAvailability.toFixed(3)}%
              </span>
              <span className="text-muted-foreground">/ {targetAvailability}%</span>
            </div>
          </div>
          <Progress
            value={(currentAvailability / targetAvailability) * 100}
            className={cn("h-2", currentAvailability < targetAvailability && "[&>div]:bg-status-critical")}
          />
        </div>

        {/* Error Budget */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Error Budget</span>
            <span className={cn("font-medium", isBudgetExhausted && "text-status-critical")}>
              {errorBudgetRemaining.toFixed(3)}% remaining
            </span>
          </div>
          <div className="relative">
            <Progress
              value={errorBudgetPercentUsed}
              className={cn(
                "h-2",
                errorBudgetPercentUsed > 80 && "[&>div]:bg-status-warning",
                errorBudgetPercentUsed >= 100 && "[&>div]:bg-status-critical"
              )}
            />
            <div
              className="absolute top-0 h-2 w-0.5 bg-foreground/50"
              style={{ left: "80%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {errorBudgetPercentUsed.toFixed(1)}% consumed ({errorBudgetConsumed.toFixed(4)}%)
          </p>
        </div>

        {/* Latency */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Latency (p99)</span>
          <div className="flex items-center gap-2">
            {latencyCurrent > latencyTarget ? (
              <TrendingUp className="h-4 w-4 text-status-critical" />
            ) : (
              <TrendingDown className="h-4 w-4 text-status-healthy" />
            )}
            <span className={cn("font-medium", latencyCurrent > latencyTarget && "text-status-critical")}>
              {latencyCurrent}ms
            </span>
            <span className="text-muted-foreground">/ {latencyTarget}ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
