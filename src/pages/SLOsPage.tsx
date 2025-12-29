import { useState } from "react";
import { useSLOs } from "@/hooks/useSLOs";
import { useServices } from "@/hooks/useServices";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SLOCard } from "@/components/dashboard/SLOCard";
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
import { AlertTriangle, Plus, RefreshCw, Target } from "lucide-react";
import { toast } from "sonner";

export default function SLOsPage() {
  const { slos, loading, createSLO, refetch, breachingCount, budgetExhaustedCount } = useSLOs();
  const { services } = useServices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSLO, setNewSLO] = useState({
    name: "",
    service_id: "",
    target_availability: "99.9",
    latency_target: "200",
    error_budget_total: "0.1",
    period: "30d",
  });

  const handleCreateSLO = async () => {
    if (!newSLO.name) {
      toast.error("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSLO({
        name: newSLO.name,
        service_id: newSLO.service_id || undefined,
        target_availability: parseFloat(newSLO.target_availability),
        target_latency_p99: parseInt(newSLO.latency_target),
        error_budget: parseFloat(newSLO.error_budget_total),
        period: newSLO.period,
      });
      toast.success("SLO created successfully");
      setIsDialogOpen(false);
      setNewSLO({
        name: "",
        service_id: "",
        target_availability: "99.9",
        latency_target: "200",
        error_budget_total: "0.1",
        period: "30d",
      });
    } catch (error) {
      toast.error("Failed to create SLO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getServiceName = (serviceId: string | null | undefined) => {
    if (!serviceId) return undefined;
    const service = services.find((s) => s.id === serviceId);
    return service?.display_name;
  };

  const healthyCount = slos.filter((s) => !s.is_breaching && !s.is_budget_exhausted).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SLOs</h1>
            <p className="text-muted-foreground mt-1">
              Service Level Objectives and error budgets
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
                  Create SLO
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New SLO</DialogTitle>
                  <DialogDescription>
                    Define a new Service Level Objective
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">SLO Name</Label>
                    <Input
                      id="name"
                      placeholder="API Availability"
                      value={newSLO.name}
                      onChange={(e) => setNewSLO({ ...newSLO, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="service">Service (optional)</Label>
                    <Select
                      value={newSLO.service_id}
                      onValueChange={(value) => setNewSLO({ ...newSLO, service_id: value })}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="availability">Target Availability (%)</Label>
                      <Input
                        id="availability"
                        type="number"
                        step="0.01"
                        min="90"
                        max="100"
                        value={newSLO.target_availability}
                        onChange={(e) =>
                          setNewSLO({ ...newSLO, target_availability: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="latency">Latency Target (ms)</Label>
                      <Input
                        id="latency"
                        type="number"
                        min="1"
                        value={newSLO.latency_target}
                        onChange={(e) =>
                          setNewSLO({ ...newSLO, latency_target: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="budget">Error Budget (%)</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={newSLO.error_budget_total}
                        onChange={(e) =>
                          setNewSLO({ ...newSLO, error_budget_total: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="period">Period</Label>
                      <Select
                        value={newSLO.period}
                        onValueChange={(value) => setNewSLO({ ...newSLO, period: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">7 days</SelectItem>
                          <SelectItem value="30d">30 days</SelectItem>
                          <SelectItem value="90d">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSLO} disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create SLO"}
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
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total SLOs</span>
            </div>
            <p className="text-2xl font-bold mt-2">{slos.length}</p>
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
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Breaching</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{breachingCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Budget Exhausted</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{budgetExhaustedCount}</p>
          </div>
        </div>

        {/* SLOs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : slos.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SLOs configured</h3>
            <p className="text-muted-foreground mb-4">
              Create your first SLO to start tracking reliability
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create SLO
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slos.map((slo) => (
              <SLOCard
                key={slo.id}
                name={slo.name}
                targetAvailability={Number(slo.target_availability)}
                currentAvailability={Number(slo.current_availability)}
                errorBudgetTotal={Number(slo.error_budget_total)}
                errorBudgetConsumed={Number(slo.error_budget_consumed) || 0}
                isBreaching={slo.is_breaching || false}
                isBudgetExhausted={slo.is_budget_exhausted || false}
                latencyTarget={slo.latency_target}
                latencyCurrent={slo.latency_current || 0}
                serviceName={getServiceName(slo.service_id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
