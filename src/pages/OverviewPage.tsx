import { useServices } from "@/hooks/useServices";
import { useAlerts } from "@/hooks/useAlerts";
import { useIncidents } from "@/hooks/useIncidents";
import { useSLOs } from "@/hooks/useSLOs";
import { useMetrics } from "@/hooks/useMetrics";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SystemHealthOverview } from "@/components/dashboard/SystemHealthOverview";
import { ServiceCard } from "@/components/dashboard/ServiceCard";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { IncidentTimeline } from "@/components/dashboard/IncidentTimeline";
import { SLOCard } from "@/components/dashboard/SLOCard";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewPage() {
  const { services, loading: servicesLoading } = useServices();
  const { alerts, acknowledgeAlert, activeAlerts, criticalCount, loading: alertsLoading } = useAlerts();
  const { incidents, loading: incidentsLoading } = useIncidents();
  const { slos, loading: slosLoading } = useSLOs();
  const { metrics, loading: metricsLoading } = useMetrics();

  const isLoading = servicesLoading || alertsLoading || incidentsLoading || slosLoading;

  // Compute health stats from data
  const healthyServices = services.filter(s => s.status === "healthy").length;
  const degradedServices = services.filter(s => s.status === "degraded").length;
  const downServices = services.filter(s => s.status === "down").length;
  const openIncidents = incidents.filter(i => i.status !== "RESOLVED").length;
  const avgUptime = services.length > 0 
    ? services.reduce((sum, s) => sum + (Number(s.uptime) || 99.9), 0) / services.length 
    : 99.9;

  // Transform data for components
  const alertsForPanel = alerts.map((a) => ({
    id: a.id,
    title: a.title,
    severity: a.severity.toUpperCase() as "INFO" | "WARNING" | "CRITICAL",
    message: a.message,
    firedAt: a.fired_at,
    isActive: a.is_active ?? true,
    acknowledgedAt: a.acknowledged_at,
    serviceName: services.find((s) => s.id === a.service_id)?.display_name,
  }));

  const incidentsForTimeline = incidents.map((i) => ({
    id: i.id,
    incidentNumber: i.incident_number,
    title: i.title,
    description: i.description,
    severity: i.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    status: i.status as "OPEN" | "ONGOING" | "RESOLVED",
    startedAt: i.started_at,
    resolvedAt: i.resolved_at,
    serviceName: services.find((s) => s.id === i.service_id)?.display_name,
  }));

  const metricsForChart = metrics.map((m) => ({
    timestamp: m.recorded_at,
    value: Number(m.value),
    metricName: m.metric_name,
  }));

  const metricNames = [...new Set(metrics.map((m) => m.metric_name))];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your infrastructure health</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <SystemHealthOverview
            totalServices={services.length}
            healthyServices={healthyServices}
            degradedServices={degradedServices}
            downServices={downServices}
            activeAlerts={activeAlerts.length}
            criticalAlerts={criticalCount}
            openIncidents={openIncidents}
            averageUptime={avgUptime}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AlertPanel alerts={alertsForPanel} onAcknowledge={acknowledgeAlert} />
          <IncidentTimeline incidents={incidentsForTimeline} />
          <MetricsChart data={metricsForChart} title="System Metrics" metricNames={metricNames.length > 0 ? metricNames : ["cpu_usage"]} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          {services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">No services configured.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {services.map((service) => (
                <ServiceCard key={service.id} name={service.name} displayName={service.display_name} status={service.status || "healthy"} uptime={Number(service.uptime) || 99.9} latencyP50={service.latency_p50 || 0} latencyP99={service.latency_p99 || 0} errorRate={Number(service.error_rate) || 0} cpuUsage={Number(service.cpu_usage) || 0} memoryUsage={Number(service.memory_usage) || 0} requestsPerSecond={service.requests_per_second || 0} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">SLOs</h2>
          {slos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">No SLOs configured.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slos.map((slo) => (
                <SLOCard key={slo.id} name={slo.name} targetAvailability={Number(slo.target_availability)} currentAvailability={Number(slo.current_availability)} errorBudgetTotal={Number(slo.error_budget_total)} errorBudgetConsumed={Number(slo.error_budget_consumed) || 0} isBreaching={slo.is_breaching || false} isBudgetExhausted={slo.is_budget_exhausted || false} latencyTarget={slo.latency_target} latencyCurrent={slo.latency_current || 0} serviceName={services.find((s) => s.id === slo.service_id)?.display_name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
