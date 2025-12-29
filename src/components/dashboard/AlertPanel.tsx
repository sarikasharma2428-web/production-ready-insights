import { AlertCircle, Bell, BellOff, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  title: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string | null;
  firedAt: string | null;
  isActive: boolean;
  acknowledgedAt: string | null;
  serviceName?: string;
}

interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export function AlertPanel({ alerts, onAcknowledge, onResolve }: AlertPanelProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { color: "text-severity-critical", bg: "bg-severity-critical/10", border: "border-severity-critical/30" };
      case "WARNING":
        return { color: "text-severity-medium", bg: "bg-severity-medium/10", border: "border-severity-medium/30" };
      default:
        return { color: "text-severity-low", bg: "bg-severity-low/10", border: "border-severity-low/30" };
    }
  };

  const activeAlerts = alerts.filter((a) => a.isActive);
  const criticalCount = activeAlerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "WARNING").length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Active Alerts
          </CardTitle>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="gap-1 bg-status-warning/10 text-status-warning">
                <AlertCircle className="h-3 w-3" />
                {warningCount} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4 pt-0">
            {activeAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-3 text-status-healthy" />
                <p className="font-medium">All Clear</p>
                <p className="text-sm">No active alerts</p>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const config = getSeverityConfig(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "rounded-lg border p-4 space-y-3",
                      config.bg,
                      config.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(config.color, "border-current")}>
                            {alert.severity}
                          </Badge>
                          {alert.serviceName && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {alert.serviceName}
                            </span>
                          )}
                        </div>
                        <h4 className={cn("font-semibold", config.color)}>{alert.title}</h4>
                      </div>
                      {alert.acknowledgedAt && (
                        <Badge variant="secondary" className="gap-1 shrink-0">
                          <CheckCircle className="h-3 w-3" />
                          Acked
                        </Badge>
                      )}
                    </div>

                    {alert.message && (
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {alert.firedAt && formatDistanceToNow(new Date(alert.firedAt), { addSuffix: true })}
                      </div>
                      <div className="flex gap-2">
                        {!alert.acknowledgedAt && onAcknowledge && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAcknowledge(alert.id)}
                            className="h-7 text-xs"
                          >
                            Acknowledge
                          </Button>
                        )}
                        {onResolve && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onResolve(alert.id)}
                            className="h-7 text-xs"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
