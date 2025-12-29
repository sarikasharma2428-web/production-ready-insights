import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, RefreshCw, Server } from "lucide-react";
import { toast } from "sonner";

export default function ServicesPage() {
  const { services, loading, addService, deleteService, refetch } = useServices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    display_name: "",
    description: "",
    status: "healthy",
  });

  const handleCreateService = async () => {
    if (!newService.name || !newService.display_name) {
      toast.error("Name and display name are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await addService({
        name: newService.name.toLowerCase().replace(/\s+/g, "-"),
        description: newService.description,
      } as any);
      toast.success("Service created successfully");
      setIsDialogOpen(false);
      setNewService({ name: "", display_name: "", description: "", status: "healthy" });
    } catch (error) {
      toast.error("Failed to create service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService(id);
      toast.success("Service deleted");
    } catch (error) {
      toast.error("Failed to delete service");
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
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
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
                    />
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
                    />
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
                    />
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
                    {isSubmitting ? "Creating..." : "Create Service"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
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
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
