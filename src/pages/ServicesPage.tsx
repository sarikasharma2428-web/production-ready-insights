import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Plus, RefreshCw, Server, Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { serviceSchema } from "@/lib/validations";

export default function ServicesPage() {
  const { services, loading, addService, updateService, deleteService, refetch } = useServices();
  const { canCreate, canDelete, loading: roleLoading } = useUserRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newService, setNewService] = useState({
    name: "",
    display_name: "",
    description: "",
    status: "healthy",
  });
  const [editService, setEditService] = useState<{
    id: string;
    name: string;
    display_name: string;
    description: string;
    status: string;
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
    error_rate: number;
    latency_p50: number;
    latency_p99: number;
    requests_per_second: number;
  } | null>(null);

  const validateForm = (): boolean => {
    setErrors({});
    const result = serviceSchema.safeParse(newService);
    
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

  const handleCreateService = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addService({
        name: newService.name.toLowerCase().replace(/\s+/g, "-"),
        display_name: newService.display_name,
        description: newService.description,
        status: newService.status,
      });
      toast.success("Service created successfully");
      setIsDialogOpen(false);
      setNewService({ name: "", display_name: "", description: "", status: "healthy" });
      setErrors({});
    } catch (error) {
      toast.error("Failed to create service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    setIsDeleting(true);
    try {
      await deleteService(deleteConfirm.id);
      toast.success("Service deleted");
      setDeleteConfirm({ open: false, id: "", name: "" });
    } catch (error) {
      toast.error("Failed to delete service");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirm = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name });
  };

  const openEditDialog = (service: typeof services[0]) => {
    setEditService({
      id: service.id,
      name: service.name,
      display_name: service.display_name,
      description: service.description || "",
      status: service.status || "healthy",
      uptime: Number(service.uptime) || 99.9,
      cpu_usage: Number(service.cpu_usage) || 0,
      memory_usage: Number(service.memory_usage) || 0,
      error_rate: Number(service.error_rate) || 0,
      latency_p50: service.latency_p50 || 0,
      latency_p99: service.latency_p99 || 0,
      requests_per_second: service.requests_per_second || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateService = async () => {
    if (!editService) return;
    setIsSubmitting(true);
    try {
      await updateService(editService.id, {
        display_name: editService.display_name,
        description: editService.description || null,
        status: editService.status,
        uptime: editService.uptime,
        cpu_usage: editService.cpu_usage,
        memory_usage: editService.memory_usage,
        error_rate: editService.error_rate,
        latency_p50: editService.latency_p50,
        latency_p99: editService.latency_p99,
        requests_per_second: editService.requests_per_second,
      });
      toast.success("Service updated successfully");
      setIsEditDialogOpen(false);
      setEditService(null);
    } catch (error) {
      toast.error("Failed to update service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;
  const downCount = services.filter((s) => s.status === "down").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your infrastructure services
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {canCreate && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={roleLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Service</DialogTitle>
                    <DialogDescription>
                      Register a new service for monitoring
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Service ID</Label>
                      <Input
                        id="name"
                        placeholder="api-gateway"
                        value={newService.name}
                        onChange={(e) =>
                          setNewService({ ...newService, name: e.target.value })
                        }
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        placeholder="API Gateway"
                        value={newService.display_name}
                        onChange={(e) =>
                          setNewService({ ...newService, display_name: e.target.value })
                        }
                        className={errors.display_name ? 'border-destructive' : ''}
                      />
                      {errors.display_name && <p className="text-sm text-destructive">{errors.display_name}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Main API gateway service"
                        value={newService.description}
                        onChange={(e) =>
                          setNewService({ ...newService, description: e.target.value })
                        }
                        className={errors.description ? 'border-destructive' : ''}
                      />
                      {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Initial Status</Label>
                      <Select
                        value={newService.status}
                        onValueChange={(value) =>
                          setNewService({ ...newService, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="degraded">Degraded</SelectItem>
                          <SelectItem value="down">Down</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateService} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Service"
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
              <Server className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Services</span>
            </div>
            <p className="text-2xl font-bold mt-2">{services.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">{healthyCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-muted-foreground">Degraded</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{degradedCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm text-muted-foreground">Down</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{downCount}</p>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first service to start monitoring
            </p>
            {canCreate && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((service) => (
              <div key={service.id} className="relative group">
                <ServiceCard
                  name={service.name}
                  displayName={service.display_name}
                  status={service.status || "healthy"}
                  uptime={Number(service.uptime) || 99.9}
                  latencyP50={service.latency_p50 || 0}
                  latencyP99={service.latency_p99 || 0}
                  errorRate={Number(service.error_rate) || 0}
                  cpuUsage={Number(service.cpu_usage) || 0}
                  memoryUsage={Number(service.memory_usage) || 0}
                  requestsPerSecond={service.requests_per_second || 0}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openDeleteConfirm(service.id, service.display_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service details and metrics
            </DialogDescription>
          </DialogHeader>
          {editService && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Service ID</Label>
                  <Input id="edit-name" value={editService.name} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-display-name">Display Name</Label>
                  <Input
                    id="edit-display-name"
                    value={editService.display_name}
                    onChange={(e) => setEditService({ ...editService, display_name: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editService.description}
                  onChange={(e) => setEditService({ ...editService, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editService.status}
                    onValueChange={(value) => setEditService({ ...editService, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="degraded">Degraded</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-uptime">Uptime (%)</Label>
                  <Input
                    id="edit-uptime"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editService.uptime}
                    onChange={(e) => setEditService({ ...editService, uptime: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-cpu">CPU Usage (%)</Label>
                  <Input
                    id="edit-cpu"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editService.cpu_usage}
                    onChange={(e) => setEditService({ ...editService, cpu_usage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-memory">Memory Usage (%)</Label>
                  <Input
                    id="edit-memory"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editService.memory_usage}
                    onChange={(e) => setEditService({ ...editService, memory_usage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-error-rate">Error Rate (%)</Label>
                  <Input
                    id="edit-error-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editService.error_rate}
                    onChange={(e) => setEditService({ ...editService, error_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-rps">Requests/Second</Label>
                  <Input
                    id="edit-rps"
                    type="number"
                    min="0"
                    value={editService.requests_per_second}
                    onChange={(e) => setEditService({ ...editService, requests_per_second: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-p50">Latency P50 (ms)</Label>
                  <Input
                    id="edit-p50"
                    type="number"
                    min="0"
                    value={editService.latency_p50}
                    onChange={(e) => setEditService({ ...editService, latency_p50: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-p99">Latency P99 (ms)</Label>
                  <Input
                    id="edit-p99"
                    type="number"
                    min="0"
                    value={editService.latency_p99}
                    onChange={(e) => setEditService({ ...editService, latency_p99: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateService} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Service"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={handleDeleteService}
        variant="destructive"
      />
    </DashboardLayout>
  );
}
