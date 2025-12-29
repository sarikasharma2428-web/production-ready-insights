import { AlertTriangle, CheckCircle2, Clock, Flame, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  description: string | null;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ONGOING" | "RESOLVED";
  startedAt: string;
  resolvedAt: string | null;
  serviceName?: string;
}

interface IncidentTimelineProps {
  incidents: Incident[];
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { color: "text-severity-critical", bg: "bg-severity-critical", icon: Flame };
      case "HIGH":
        return { color: "text-severity-high", bg: "bg-severity-high", icon: AlertTriangle };
      case "MEDIUM":
        return { color: "text-severity-medium", bg: "bg-severity-medium", icon: AlertTriangle };
      default:
        return { color: "text-severity-low", bg: "bg-severity-low", icon: AlertTriangle };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "OPEN":
        return { color: "text-status-critical", bg: "bg-status-critical/10", label: "Open" };
      case "ONGOING":
        return { color: "text-status-warning", bg: "bg-status-warning/10", label: "Ongoing" };
      case "RESOLVED":
        return { color: "text-status-healthy", bg: "bg-status-healthy/10", label: "Resolved" };
      default:
        return { color: "text-muted-foreground", bg: "bg-muted", label: status };
    }
  };

  const sortedIncidents = [...incidents].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const activeIncidents = sortedIncidents.filter((i) => i.status !== "RESOLVED");

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-primary" />
            Incidents
          </CardTitle>
          {activeIncidents.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              {activeIncidents.length} Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="relative p-4 pt-0">
            {sortedIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mb-3 text-status-healthy" />
                <p className="font-medium">No Incidents</p>
                <p className="text-sm">System is running smoothly</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedIncidents.map((incident, index) => {
                  const severityConfig = getSeverityConfig(incident.severity);
                  const statusConfig = getStatusConfig(incident.status);
                  const SeverityIcon = severityConfig.icon;

                  return (
                    <div key={incident.id} className="relative pl-6">
                      {/* Timeline line */}
                      {index < sortedIncidents.length - 1 && (
                        <div className="absolute left-[9px] top-6 h-full w-0.5 bg-border" />
                      )}
                      
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          "absolute left-0 top-1 h-[18px] w-[18px] rounded-full border-2 border-background flex items-center justify-center",
                          severityConfig.bg
                        )}
                      >
                        <SeverityIcon className="h-2.5 w-2.5 text-white" />
                      </div>

                      <div className="rounded-lg border bg-card p-4 space-y-2 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-muted-foreground">
                                #{incident.incidentNumber}
                              </span>
                              <Badge variant="outline" className={cn(severityConfig.color, "border-current text-xs")}>
                                {incident.severity}
                              </Badge>
                              <Badge variant="secondary" className={cn(statusConfig.bg, statusConfig.color, "text-xs")}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <h4 className="font-semibold">{incident.title}</h4>
                          </div>
                        </div>

                        {incident.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {incident.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })}
                          </div>
                          {incident.serviceName && (
                            <span className="font-mono">{incident.serviceName}</span>
                          )}
                          {incident.resolvedAt && (
                            <div className="flex items-center gap-1 text-status-healthy">
                              <CheckCircle2 className="h-3 w-3" />
                              Resolved
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
