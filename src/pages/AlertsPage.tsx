import { useState } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { useServices } from "@/hooks/useServices";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Bell, BellOff, Check, RefreshCw, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function AlertsPage() {
  const { alerts, loading, acknowledgeAlert, silenceAlert, refetch, activeAlerts, criticalCount, warningCount } = useAlerts();
  const { services } = useServices();
  const { canEdit } = useUserRole();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    // Normalize severity for comparison (handle both cases)
    const alertSeverity = alert.severity?.toUpperCase();
    if (severityFilter !== "all" && alertSeverity !== severityFilter.toUpperCase()) return false;
    if (statusFilter === "active" && !alert.is_active) return false;
    if (statusFilter === "acknowledged" && !alert.acknowledged_at) return false;
    if (statusFilter === "silenced" && !alert.silenced_until) return false;
    return true;
  });

  const handleAcknowledge = async (id: string) => {
    setActionLoading(id);
    try {
      await acknowledgeAlert(id);
      toast.success("Alert acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSilence = async (id: string) => {
    setActionLoading(`silence-${id}`);
    try {
      await silenceAlert(id, 60);
      toast.success("Alert silenced for 1 hour");
    } catch (error) {
      toast.error("Failed to silence alert");
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityBadge = (severity: string) => {
    // Normalize to uppercase for consistent display
    const normalizedSeverity = severity?.toUpperCase() || 'INFO';
    const variants: Record<string, "destructive" | "secondary" | "outline"> = {
      CRITICAL: "destructive",
      WARNING: "secondary",
      INFO: "outline",
    };
    return <Badge variant={variants[normalizedSeverity] || "outline"}>{normalizedSeverity}</Badge>;
  };

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return "—";
    const service = services.find((s) => s.id === serviceId);
    return service?.display_name || serviceId;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage system alerts
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Alerts</span>
            </div>
            <p className="text-2xl font-bold mt-2">{alerts.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Critical</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{criticalCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Warning</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{warningCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-2">{activeAlerts.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="silenced">Silenced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
            <p className="text-muted-foreground">
              {alerts.length === 0 ? "No alerts have been triggered" : "No alerts match your filters"}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Fired</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell className="font-medium">{alert.title}</TableCell>
                    <TableCell>{getServiceName(alert.service_id)}</TableCell>
                    <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
                    <TableCell>
                      {alert.fired_at
                        ? formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {alert.silenced_until && new Date(alert.silenced_until) > new Date() ? (
                        <Badge variant="outline">Silenced</Badge>
                      ) : alert.acknowledged_at ? (
                        <Badge variant="secondary">Acknowledged</Badge>
                      ) : alert.is_active ? (
                        <Badge variant="destructive">Active</Badge>
                      ) : (
                        <Badge variant="outline">Resolved</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEdit && !alert.acknowledged_at && alert.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={actionLoading === alert.id}
                          >
                            {actionLoading === alert.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {canEdit && alert.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSilence(alert.id)}
                            disabled={actionLoading === `silence-${alert.id}`}
                          >
                            {actionLoading === `silence-${alert.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <BellOff className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
