import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Server, 
  Activity, 
  FileText, 
  Bell, 
  AlertTriangle,
  Zap,
  Loader2,
  CheckCircle,
  RefreshCw,
  Trash2
} from "lucide-react";

const TEST_SERVICES = [
  { name: "api-gateway", display_name: "API Gateway", description: "Main API gateway service" },
  { name: "auth-service", display_name: "Auth Service", description: "Authentication and authorization" },
  { name: "payment-service", display_name: "Payment Service", description: "Payment processing service" },
  { name: "notification-service", display_name: "Notification Service", description: "Email and push notifications" },
  { name: "analytics-service", display_name: "Analytics Service", description: "User analytics and tracking" },
];

const METRIC_TYPES = ["cpu_usage", "memory_usage", "request_count", "error_rate", "latency_p50", "latency_p99"];
const LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;
const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
const INCIDENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export default function TestPanelPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  // Service form state
  const [serviceName, setServiceName] = useState("");
  const [serviceDisplayName, setServiceDisplayName] = useState("");

  // Metrics form state
  const [metricService, setMetricService] = useState("");
  const [metricName, setMetricName] = useState("cpu_usage");
  const [metricValue, setMetricValue] = useState("50");
  const [metricCount, setMetricCount] = useState("10");

  // Logs form state
  const [logService, setLogService] = useState("");
  const [logLevel, setLogLevel] = useState<typeof LOG_LEVELS[number]>("INFO");
  const [logMessage, setLogMessage] = useState("");
  const [logCount, setLogCount] = useState("5");

  // Alert form state
  const [alertService, setAlertService] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<typeof ALERT_SEVERITIES[number]>("WARNING");
  const [alertName, setAlertName] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Incident form state
  const [incidentService, setIncidentService] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState<typeof INCIDENT_SEVERITIES[number]>("MEDIUM");
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");

  const setResult = (key: string, value: string) => {
    setResults(prev => ({ ...prev, [key]: value }));
  };

  // Create test services
  const createTestServices = async () => {
    setLoading("services-bulk");
    try {
      const promises = TEST_SERVICES.map(service =>
        supabase.from("services").insert({
          name: service.name,
          display_name: service.display_name,
          description: service.description,
          status: ["healthy", "degraded", "down"][Math.floor(Math.random() * 3)],
          uptime: 95 + Math.random() * 5,
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 100,
          error_rate: Math.random() * 5,
          latency_p50: Math.floor(Math.random() * 200),
          latency_p99: Math.floor(Math.random() * 500) + 200,
          requests_per_second: Math.floor(Math.random() * 1000),
        })
      );
      await Promise.all(promises);
      setResult("services", `Created ${TEST_SERVICES.length} test services`);
      toast({ title: "Success", description: `Created ${TEST_SERVICES.length} test services` });
    } catch (error) {
      console.error("Error creating services:", error);
      toast({ title: "Error", description: "Failed to create services", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const createSingleService = async () => {
    if (!serviceName || !serviceDisplayName) {
      toast({ title: "Error", description: "Name and display name required", variant: "destructive" });
      return;
    }
    setLoading("service-single");
    try {
      const { error } = await supabase.from("services").insert({
        name: serviceName,
        display_name: serviceDisplayName,
        status: "healthy",
        uptime: 99.9,
      });
      if (error) throw error;
      setResult("service-single", `Created service: ${serviceDisplayName}`);
      toast({ title: "Success", description: `Created service: ${serviceDisplayName}` });
      setServiceName("");
      setServiceDisplayName("");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create service", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Generate test metrics
  const generateTestMetrics = async () => {
    setLoading("metrics-bulk");
    try {
      const { data: services } = await supabase.from("services").select("id");
      if (!services?.length) {
        toast({ title: "Error", description: "No services found. Create services first.", variant: "destructive" });
        setLoading(null);
        return;
      }

      const metrics = [];
      const now = new Date();
      for (let i = 0; i < 100; i++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const metricType = METRIC_TYPES[Math.floor(Math.random() * METRIC_TYPES.length)];
        metrics.push({
          service_id: service.id,
          metric_name: metricType,
          value: Math.random() * 100,
          unit: metricType.includes("latency") ? "ms" : metricType.includes("rate") ? "%" : "count",
          recorded_at: new Date(now.getTime() - Math.random() * 3600000).toISOString(),
        });
      }

      const { error } = await supabase.from("metrics").insert(metrics);
      if (error) throw error;
      setResult("metrics", `Generated 100 test metrics`);
      toast({ title: "Success", description: "Generated 100 test metrics" });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to generate metrics", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const createSingleMetric = async () => {
    if (!metricService) {
      toast({ title: "Error", description: "Select a service", variant: "destructive" });
      return;
    }
    setLoading("metric-single");
    try {
      const count = parseInt(metricCount) || 1;
      const baseValue = parseFloat(metricValue) || 50;
      const metrics = [];
      const now = new Date();

      for (let i = 0; i < count; i++) {
        metrics.push({
          service_id: metricService,
          metric_name: metricName,
          value: baseValue + (Math.random() - 0.5) * 20,
          recorded_at: new Date(now.getTime() - i * 60000).toISOString(),
        });
      }

      const { error } = await supabase.from("metrics").insert(metrics);
      if (error) throw error;
      setResult("metric-single", `Created ${count} ${metricName} metrics`);
      toast({ title: "Success", description: `Created ${count} metrics` });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create metrics", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Generate test logs
  const generateTestLogs = async () => {
    setLoading("logs-bulk");
    try {
      const { data: services } = await supabase.from("services").select("id");
      if (!services?.length) {
        toast({ title: "Error", description: "No services found", variant: "destructive" });
        setLoading(null);
        return;
      }

      const logMessages = [
        "Request processed successfully",
        "Connection established",
        "Cache miss, fetching from database",
        "Rate limit exceeded",
        "Authentication failed for user",
        "Database query took longer than expected",
        "Service health check passed",
        "Memory usage above threshold",
        "Failed to connect to upstream service",
        "Retrying failed request",
      ];

      const logs = [];
      for (let i = 0; i < 50; i++) {
        const service = services[Math.floor(Math.random() * services.length)];
        logs.push({
          service_id: service.id,
          level: LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)],
          message: logMessages[Math.floor(Math.random() * logMessages.length)],
          trace_id: `trace-${Math.random().toString(36).substring(7)}`,
          metadata: { requestId: `req-${Math.random().toString(36).substring(7)}` },
        });
      }

      const { error } = await supabase.from("logs").insert(logs);
      if (error) throw error;
      setResult("logs", `Generated 50 test logs`);
      toast({ title: "Success", description: "Generated 50 test logs" });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to generate logs", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const createSingleLog = async () => {
    if (!logService || !logMessage) {
      toast({ title: "Error", description: "Service and message required", variant: "destructive" });
      return;
    }
    setLoading("log-single");
    try {
      const count = parseInt(logCount) || 1;
      const logs = [];
      for (let i = 0; i < count; i++) {
        logs.push({
          service_id: logService,
          level: logLevel,
          message: logMessage,
          trace_id: `trace-${Math.random().toString(36).substring(7)}`,
        });
      }

      const { error } = await supabase.from("logs").insert(logs);
      if (error) throw error;
      setResult("log-single", `Created ${count} ${logLevel} logs`);
      toast({ title: "Success", description: `Created ${count} logs` });
      setLogMessage("");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create logs", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Create test alerts
  const generateTestAlerts = async () => {
    setLoading("alerts-bulk");
    try {
      const { data: services } = await supabase.from("services").select("id, display_name");
      if (!services?.length) {
        toast({ title: "Error", description: "No services found", variant: "destructive" });
        setLoading(null);
        return;
      }

      const alertTemplates = [
        { name: "High CPU Usage", metric: "cpu_usage", threshold: 80 },
        { name: "Memory Pressure", metric: "memory_usage", threshold: 90 },
        { name: "High Error Rate", metric: "error_rate", threshold: 5 },
        { name: "High Latency", metric: "latency_p99", threshold: 500 },
        { name: "Low Uptime", metric: "uptime", threshold: 99 },
      ];

      const alerts = [];
      for (const service of services.slice(0, 3)) {
        const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
        alerts.push({
          title: `${template.name} on ${service.display_name}`,
          name: template.name,
          service_id: service.id,
          severity: ALERT_SEVERITIES[Math.floor(Math.random() * ALERT_SEVERITIES.length)],
          message: `${template.metric} exceeded threshold of ${template.threshold}`,
          metric_name: template.metric,
          threshold: template.threshold,
          current_value: template.threshold + Math.random() * 20,
          is_active: true,
          fired_at: new Date().toISOString(),
        });
      }

      const { error } = await supabase.from("alerts").insert(alerts);
      if (error) throw error;
      setResult("alerts", `Created ${alerts.length} test alerts`);
      toast({ title: "Success", description: `Created ${alerts.length} test alerts` });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create alerts", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const createSingleAlert = async () => {
    if (!alertName) {
      toast({ title: "Error", description: "Alert name required", variant: "destructive" });
      return;
    }
    setLoading("alert-single");
    try {
      const { error } = await supabase.from("alerts").insert({
        title: alertName,
        name: alertName,
        service_id: alertService || null,
        severity: alertSeverity,
        message: alertMessage || `Alert: ${alertName}`,
        metric_name: "custom",
        threshold: 100,
        current_value: 120,
        is_active: true,
        fired_at: new Date().toISOString(),
      });
      if (error) throw error;
      setResult("alert-single", `Created alert: ${alertName}`);
      toast({ title: "Success", description: `Created alert: ${alertName}` });
      setAlertName("");
      setAlertMessage("");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create alert", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Create test incidents
  const generateTestIncidents = async () => {
    setLoading("incidents-bulk");
    try {
      const { data: services } = await supabase.from("services").select("id, display_name");
      if (!services?.length) {
        toast({ title: "Error", description: "No services found", variant: "destructive" });
        setLoading(null);
        return;
      }

      const incidentTemplates = [
        { title: "Service Outage", description: "Complete service unavailability" },
        { title: "Degraded Performance", description: "Significantly increased latency" },
        { title: "Partial Failure", description: "Some endpoints returning errors" },
        { title: "Database Connection Issues", description: "Intermittent database connectivity" },
      ];

      const incidents = [];
      for (let i = 0; i < 3; i++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const template = incidentTemplates[Math.floor(Math.random() * incidentTemplates.length)];
        incidents.push({
          incident_number: `INC-${Date.now()}-${i}`,
          title: `${template.title} - ${service.display_name}`,
          description: template.description,
          service_id: service.id,
          severity: INCIDENT_SEVERITIES[Math.floor(Math.random() * INCIDENT_SEVERITIES.length)],
          status: "OPEN",
          started_at: new Date().toISOString(),
        });
      }

      const { error } = await supabase.from("incidents").insert(incidents);
      if (error) throw error;
      setResult("incidents", `Created ${incidents.length} test incidents`);
      toast({ title: "Success", description: `Created ${incidents.length} test incidents` });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create incidents", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const createSingleIncident = async () => {
    if (!incidentTitle) {
      toast({ title: "Error", description: "Incident title required", variant: "destructive" });
      return;
    }
    setLoading("incident-single");
    try {
      const { error } = await supabase.from("incidents").insert({
        incident_number: `INC-${Date.now()}`,
        title: incidentTitle,
        description: incidentDescription || null,
        service_id: incidentService || null,
        severity: incidentSeverity,
        status: "OPEN",
        started_at: new Date().toISOString(),
      });
      if (error) throw error;
      setResult("incident-single", `Created incident: ${incidentTitle}`);
      toast({ title: "Success", description: `Created incident: ${incidentTitle}` });
      setIncidentTitle("");
      setIncidentDescription("");
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create incident", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Create test SLOs
  const generateTestSLOs = async () => {
    setLoading("slos-bulk");
    try {
      const { data: services } = await supabase.from("services").select("id, display_name");
      if (!services?.length) {
        toast({ title: "Error", description: "No services found", variant: "destructive" });
        setLoading(null);
        return;
      }

      const slos = services.slice(0, 4).map(service => ({
        name: `${service.display_name} Availability SLO`,
        service_id: service.id,
        target_availability: 99.9,
        current_availability: 99.5 + Math.random() * 0.5,
        latency_target: 200,
        latency_current: Math.floor(100 + Math.random() * 150),
        error_budget_total: 0.1,
        error_budget_consumed: Math.random() * 0.08,
        is_breaching: Math.random() > 0.7,
        is_budget_exhausted: Math.random() > 0.9,
        period: "30d",
      }));

      const { error } = await supabase.from("slos").insert(slos);
      if (error) throw error;
      setResult("slos", `Created ${slos.length} test SLOs`);
      toast({ title: "Success", description: `Created ${slos.length} test SLOs` });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to create SLOs", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Generate all test data
  const generateAllTestData = async () => {
    setLoading("all");
    try {
      await createTestServices();
      await new Promise(r => setTimeout(r, 500));
      await generateTestMetrics();
      await generateTestLogs();
      await generateTestAlerts();
      await generateTestIncidents();
      await generateTestSLOs();
      setResult("all", "All test data generated successfully");
      toast({ title: "Success", description: "All test data generated!" });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to generate all data", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Clear all data
  const clearAllData = async () => {
    setLoading("clear");
    try {
      await supabase.from("incident_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("slos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("metrics").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("services").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setResults({});
      toast({ title: "Success", description: "All data cleared" });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to clear data", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  // Services list for dropdowns
  const [servicesList, setServicesList] = useState<Array<{ id: string; display_name: string }>>([]);
  const refreshServices = async () => {
    const { data } = await supabase.from("services").select("id, display_name");
    setServicesList(data || []);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Test Panel</h1>
            <p className="text-muted-foreground">Generate test data using real production code paths</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshServices} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Services
            </Button>
            <Button onClick={generateAllTestData} disabled={loading !== null}>
              {loading === "all" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Generate All Data
            </Button>
            <Button onClick={clearAllData} variant="destructive" disabled={loading !== null}>
              {loading === "clear" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Clear All
            </Button>
          </div>
        </div>

        <Tabs defaultValue="services" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="services"><Server className="h-4 w-4 mr-2" />Services</TabsTrigger>
            <TabsTrigger value="metrics"><Activity className="h-4 w-4 mr-2" />Metrics</TabsTrigger>
            <TabsTrigger value="logs"><FileText className="h-4 w-4 mr-2" />Logs</TabsTrigger>
            <TabsTrigger value="alerts"><Bell className="h-4 w-4 mr-2" />Alerts</TabsTrigger>
            <TabsTrigger value="incidents"><AlertTriangle className="h-4 w-4 mr-2" />Incidents</TabsTrigger>
            <TabsTrigger value="slos"><CheckCircle className="h-4 w-4 mr-2" />SLOs</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Create</CardTitle>
                  <CardDescription>Create predefined test services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Creates: {TEST_SERVICES.map(s => s.display_name).join(", ")}
                  </div>
                  <Button onClick={createTestServices} disabled={loading !== null} className="w-full">
                    {loading === "services-bulk" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Server className="h-4 w-4 mr-2" />}
                    Create Test Services
                  </Button>
                  {results.services && <Badge variant="outline">{results.services}</Badge>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Single Service</CardTitle>
                  <CardDescription>Create a custom service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service Name (slug)</Label>
                    <Input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="my-service" />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={serviceDisplayName} onChange={e => setServiceDisplayName(e.target.value)} placeholder="My Service" />
                  </div>
                  <Button onClick={createSingleService} disabled={loading !== null} className="w-full">
                    {loading === "service-single" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Service
                  </Button>
                  {results["service-single"] && <Badge variant="outline">{results["service-single"]}</Badge>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Generate</CardTitle>
                  <CardDescription>Generate 100 random metrics across all services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateTestMetrics} disabled={loading !== null} className="w-full">
                    {loading === "metrics-bulk" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                    Generate 100 Metrics
                  </Button>
                  {results.metrics && <Badge variant="outline">{results.metrics}</Badge>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Metrics</CardTitle>
                  <CardDescription>Create specific metrics for a service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select value={metricService} onValueChange={setMetricService}>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {servicesList.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Metric Type</Label>
                      <Select value={metricName} onValueChange={setMetricName}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {METRIC_TYPES.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Base Value</Label>
                      <Input type="number" value={metricValue} onChange={e => setMetricValue(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Count</Label>
                    <Input type="number" value={metricCount} onChange={e => setMetricCount(e.target.value)} />
                  </div>
                  <Button onClick={createSingleMetric} disabled={loading !== null} className="w-full">
                    {loading === "metric-single" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Metrics
                  </Button>
                  {results["metric-single"] && <Badge variant="outline">{results["metric-single"]}</Badge>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Generate</CardTitle>
                  <CardDescription>Generate 50 random logs across all services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateTestLogs} disabled={loading !== null} className="w-full">
                    {loading === "logs-bulk" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                    Generate 50 Logs
                  </Button>
                  {results.logs && <Badge variant="outline">{results.logs}</Badge>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Log</CardTitle>
                  <CardDescription>Create specific log entries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select value={logService} onValueChange={setLogService}>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {servicesList.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select value={logLevel} onValueChange={v => setLogLevel(v as typeof LOG_LEVELS[number])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LOG_LEVELS.map(l => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Count</Label>
                      <Input type="number" value={logCount} onChange={e => setLogCount(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Input value={logMessage} onChange={e => setLogMessage(e.target.value)} placeholder="Log message..." />
                  </div>
                  <Button onClick={createSingleLog} disabled={loading !== null} className="w-full">
                    {loading === "log-single" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Logs
                  </Button>
                  {results["log-single"] && <Badge variant="outline">{results["log-single"]}</Badge>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Generate</CardTitle>
                  <CardDescription>Create sample alerts for services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateTestAlerts} disabled={loading !== null} className="w-full">
                    {loading === "alerts-bulk" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
                    Generate Alerts
                  </Button>
                  {results.alerts && <Badge variant="outline">{results.alerts}</Badge>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Alert</CardTitle>
                  <CardDescription>Create a specific alert</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alert Name</Label>
                    <Input value={alertName} onChange={e => setAlertName(e.target.value)} placeholder="High CPU Usage" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Service (optional)</Label>
                      <Select value={alertService} onValueChange={setAlertService}>
                        <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                        <SelectContent>
                          {servicesList.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select value={alertSeverity} onValueChange={v => setAlertSeverity(v as typeof ALERT_SEVERITIES[number])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ALERT_SEVERITIES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Input value={alertMessage} onChange={e => setAlertMessage(e.target.value)} placeholder="Alert message..." />
                  </div>
                  <Button onClick={createSingleAlert} disabled={loading !== null} className="w-full">
                    {loading === "alert-single" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Alert
                  </Button>
                  {results["alert-single"] && <Badge variant="outline">{results["alert-single"]}</Badge>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Generate</CardTitle>
                  <CardDescription>Create sample incidents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateTestIncidents} disabled={loading !== null} className="w-full">
                    {loading === "incidents-bulk" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                    Generate Incidents
                  </Button>
                  {results.incidents && <Badge variant="outline">{results.incidents}</Badge>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Incident</CardTitle>
                  <CardDescription>Create a specific incident</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={incidentTitle} onChange={e => setIncidentTitle(e.target.value)} placeholder="Service Outage" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Service (optional)</Label>
                      <Select value={incidentService} onValueChange={setIncidentService}>
                        <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                        <SelectContent>
                          {servicesList.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.display_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select value={incidentSeverity} onValueChange={v => setIncidentSeverity(v as typeof INCIDENT_SEVERITIES[number])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INCIDENT_SEVERITIES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} placeholder="Incident description..." />
                  </div>
                  <Button onClick={createSingleIncident} disabled={loading !== null} className="w-full">
                    {loading === "incident-single" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Incident
                  </Button>
                  {results["incident-single"] && <Badge variant="outline">{results["incident-single"]}</Badge>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SLOs Tab */}
          <TabsContent value="slos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate SLOs</CardTitle>
                <CardDescription>Create SLOs for existing services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Creates availability SLOs (99.9% target) for up to 4 services with random current values and error budget consumption.
                </div>
                <Button onClick={generateTestSLOs} disabled={loading !== null} className="w-full">
                  {loading === "slos-bulk" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Generate SLOs
                </Button>
                {results.slos && <Badge variant="outline">{results.slos}</Badge>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
