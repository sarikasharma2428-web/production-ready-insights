import { useState } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { useServices } from "@/hooks/useServices";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, CheckCircle, Flame, Plus, RefreshCw, XCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { incidentSchema } from "@/lib/validations";

export default function IncidentsPage() {
  const { incidents, loading, createIncident, acknowledgeIncident, resolveIncident, refetch } = useIncidents();
  const { services } = useServices();
  const { canCreate, canEdit } = useUserRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newIncident, setNewIncident] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    service_id: "",
  });

  const filteredIncidents = incidents.filter((incident) => {
    if (statusFilter !== "all" && incident.status !== statusFilter) return false;
    if (severityFilter !== "all" && incident.severity !== severityFilter) return false;
    return true;
  });

  const validateForm = (): boolean => {
    setErrors({});
    const result = incidentSchema.safeParse({
      title: newIncident.title,
      description: newIncident.description || undefined,
      severity: newIncident.severity,
      service_id: newIncident.service_id || undefined,
    });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    
    return true;
  };

  const handleCreateIncident = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createIncident({
        title: newIncident.title,
        description: newIncident.description,
        severity: newIncident.severity,
        service_id: newIncident.service_id || undefined,
      });
      toast.success("Incident created");
      setIsDialogOpen(false);
      setNewIncident({ title: "", description: "", severity: "MEDIUM", service_id: "" });
      setErrors({});
    } catch (error) {
      toast.error("Failed to create incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    setActionLoading(`ack-${id}`);
    try {
      await acknowledgeIncident(id);
      toast.success("Incident acknowledged");
    } catch (error) {
      toast.error("Failed to acknowledge incident");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActionLoading(`resolve-${id}`);
    try {
      await resolveIncident(id);
      toast.success("Incident resolved");
    } catch (error) {
      toast.error("Failed to resolve incident");
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "bg-red-500",
      HIGH: "bg-orange-500",
      MEDIUM: "bg-yellow-500",
      LOW: "bg-blue-500",
    };
    return (
      <Badge className={`${colors[severity]} text-white`}>
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "destructive" | "secondary" | "outline"> = {
      OPEN: "destructive",
      ONGOING: "secondary",
      RESOLVED: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getServiceName = (serviceId: string | null | undefined) => {
    if (!serviceId) return null;
    const service = services.find((s) => s.id === serviceId);
    return service?.display_name;
  };

  const openCount = incidents.filter((i) => i.status === "OPEN").length;
  const ongoingCount = incidents.filter((i) => i.status === "ONGOING").length;
  const resolvedCount = incidents.filter((i) => i.status === "RESOLVED").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage system incidents
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {canCreate && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Incident
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Incident</DialogTitle>
                    <DialogDescription>
                      Report a new incident for tracking
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Database connection failure"
                        value={newIncident.title}
                        onChange={(e) =>
                          setNewIncident({ ...newIncident, title: e.target.value })
                        }
                        className={errors.title ? 'border-destructive' : ''}
                      />
                      {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the incident..."
                        value={newIncident.description}
                        onChange={(e) =>
                          setNewIncident({ ...newIncident, description: e.target.value })
                        }
                        className={errors.description ? 'border-destructive' : ''}
                      />
                      {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="severity">Severity</Label>
                      <Select
                        value={newIncident.severity}
                        onValueChange={(value) =>
                          setNewIncident({ ...newIncident, severity: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="service">Affected Service (optional)</Label>
                      <Select
                        value={newIncident.service_id}
                        onValueChange={(value) =>
                          setNewIncident({ ...newIncident, service_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateIncident} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Incident"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Incidents</span>
            </div>
            <p className="text-2xl font-bold mt-2">{incidents.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Open</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{openCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Ongoing</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{ongoingCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Resolved</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">{resolvedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Incidents List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No incidents found</h3>
            <p className="text-muted-foreground">
              {incidents.length === 0
                ? "No incidents have been reported"
                : "No incidents match your filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-mono">
                        {incident.incident_number}
                      </span>
                      {getSeverityBadge(incident.severity)}
                      {getStatusBadge(incident.status)}
                    </div>
                    <div className="flex gap-2">
                      {canEdit && incident.status === "OPEN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(incident.id)}
                          disabled={actionLoading === `ack-${incident.id}`}
                        >
                          {actionLoading === `ack-${incident.id}` ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Acknowledge
                        </Button>
                      )}
                      {canEdit && incident.status !== "RESOLVED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(incident.id)}
                          disabled={actionLoading === `resolve-${incident.id}`}
                        >
                          {actionLoading === `resolve-${incident.id}` ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{incident.title}</CardTitle>
                  <CardDescription>
                    {incident.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    {getServiceName(incident.service_id) && (
                      <span>Service: {getServiceName(incident.service_id)}</span>
                    )}
                    <span>
                      Started:{" "}
                      {format(new Date(incident.started_at), "MMM d, yyyy HH:mm")}
                    </span>
                    {incident.resolved_at && (
                      <span>
                        Resolved:{" "}
                        {formatDistanceToNow(new Date(incident.resolved_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
