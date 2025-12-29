import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  passed: boolean;
  timestamp: string;
  environment: string;
  checks: {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    message: string;
    details?: Record<string, unknown>;
  }[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, environment = 'staging' } = await req.json();

    console.log(`[Release Validation] Action: ${action}, Environment: ${environment}`);

    if (action === 'run-validation') {
      const checks: ValidationResult['checks'] = [];

      // Check 1: Services Health
      console.log('[Validation] Checking services health...');
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*');

      if (servicesError) {
        checks.push({
          name: 'Services Health',
          status: 'failed',
          message: `Failed to fetch services: ${servicesError.message}`,
        });
      } else {
        const totalServices = services?.length || 0;
        const healthyServices = services?.filter(s => s.status === 'healthy').length || 0;
        const downServices = services?.filter(s => s.status === 'down').length || 0;

        if (totalServices === 0) {
          checks.push({
            name: 'Services Health',
            status: 'warning',
            message: 'No services configured',
            details: { total: 0 }
          });
        } else if (downServices > 0) {
          checks.push({
            name: 'Services Health',
            status: 'failed',
            message: `${downServices} service(s) are down`,
            details: { total: totalServices, healthy: healthyServices, down: downServices }
          });
        } else {
          checks.push({
            name: 'Services Health',
            status: 'passed',
            message: `All ${totalServices} services are operational`,
            details: { total: totalServices, healthy: healthyServices }
          });
        }
      }

      // Check 2: Critical Alerts
      console.log('[Validation] Checking critical alerts...');
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .eq('severity', 'CRITICAL');

      if (alertsError) {
        checks.push({
          name: 'Critical Alerts',
          status: 'failed',
          message: `Failed to fetch alerts: ${alertsError.message}`,
        });
      } else {
        const criticalCount = alerts?.length || 0;
        if (criticalCount > 0) {
          checks.push({
            name: 'Critical Alerts',
            status: 'failed',
            message: `${criticalCount} critical alert(s) active`,
            details: { count: criticalCount, alerts: alerts?.map(a => a.title) }
          });
        } else {
          checks.push({
            name: 'Critical Alerts',
            status: 'passed',
            message: 'No critical alerts active',
          });
        }
      }

      // Check 3: Open Incidents
      console.log('[Validation] Checking open incidents...');
      const { data: incidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .in('status', ['OPEN', 'ONGOING'])
        .in('severity', ['HIGH', 'CRITICAL']);

      if (incidentsError) {
        checks.push({
          name: 'Open Incidents',
          status: 'failed',
          message: `Failed to fetch incidents: ${incidentsError.message}`,
        });
      } else {
        const openCount = incidents?.length || 0;
        if (openCount > 0) {
          checks.push({
            name: 'Open Incidents',
            status: 'failed',
            message: `${openCount} high/critical incident(s) open`,
            details: { count: openCount, incidents: incidents?.map(i => i.title) }
          });
        } else {
          checks.push({
            name: 'Open Incidents',
            status: 'passed',
            message: 'No high-severity incidents open',
          });
        }
      }

      // Check 4: SLO Health
      console.log('[Validation] Checking SLO health...');
      const { data: slos, error: slosError } = await supabase
        .from('slos')
        .select('*');

      if (slosError) {
        checks.push({
          name: 'SLO Health',
          status: 'failed',
          message: `Failed to fetch SLOs: ${slosError.message}`,
        });
      } else {
        const totalSLOs = slos?.length || 0;
        const breachingSLOs = slos?.filter(s => s.is_breaching).length || 0;
        const exhaustedBudgets = slos?.filter(s => s.is_budget_exhausted).length || 0;

        if (totalSLOs === 0) {
          checks.push({
            name: 'SLO Health',
            status: 'warning',
            message: 'No SLOs configured',
            details: { total: 0 }
          });
        } else if (breachingSLOs > 0 || exhaustedBudgets > 0) {
          checks.push({
            name: 'SLO Health',
            status: 'failed',
            message: `${breachingSLOs} SLO(s) breaching, ${exhaustedBudgets} budget(s) exhausted`,
            details: { total: totalSLOs, breaching: breachingSLOs, exhausted: exhaustedBudgets }
          });
        } else {
          checks.push({
            name: 'SLO Health',
            status: 'passed',
            message: `All ${totalSLOs} SLOs within targets`,
            details: { total: totalSLOs }
          });
        }
      }

      // Check 5: Error Rates
      console.log('[Validation] Checking error rates...');
      const { data: highErrorServices } = await supabase
        .from('services')
        .select('name, display_name, error_rate')
        .gt('error_rate', 5);

      if (highErrorServices && highErrorServices.length > 0) {
        checks.push({
          name: 'Error Rates',
          status: 'failed',
          message: `${highErrorServices.length} service(s) with error rate > 5%`,
          details: { services: highErrorServices.map(s => ({ name: s.display_name, rate: s.error_rate })) }
        });
      } else {
        checks.push({
          name: 'Error Rates',
          status: 'passed',
          message: 'All services within acceptable error rates',
        });
      }

      // Check 6: Recent Logs (Error count)
      console.log('[Validation] Checking recent error logs...');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: errorLogs, count: errorCount } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('level', 'ERROR')
        .gte('created_at', oneHourAgo);

      if ((errorCount || 0) > 50) {
        checks.push({
          name: 'Error Logs',
          status: 'warning',
          message: `${errorCount} error logs in the last hour`,
          details: { count: errorCount }
        });
      } else {
        checks.push({
          name: 'Error Logs',
          status: 'passed',
          message: `Error log count within threshold (${errorCount || 0}/50)`,
        });
      }

      // Calculate summary
      const summary = {
        total: checks.length,
        passed: checks.filter(c => c.status === 'passed').length,
        failed: checks.filter(c => c.status === 'failed').length,
        warnings: checks.filter(c => c.status === 'warning').length,
      };

      const result: ValidationResult = {
        passed: summary.failed === 0,
        timestamp: new Date().toISOString(),
        environment,
        checks,
        summary,
      };

      console.log(`[Validation Complete] Passed: ${result.passed}, Summary:`, summary);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-test-activity') {
      console.log('[Test Activity] Generating production-like activity...');
      
      // Generate realistic test activity
      const results = {
        services: 0,
        metrics: 0,
        logs: 0,
        alerts: 0,
        incidents: 0,
      };

      // Create test services if none exist
      const { data: existingServices } = await supabase.from('services').select('id');
      if (!existingServices || existingServices.length === 0) {
        const testServices = [
          { name: 'api-gateway', display_name: 'API Gateway', status: 'healthy', uptime: 99.95 },
          { name: 'auth-service', display_name: 'Auth Service', status: 'healthy', uptime: 99.99 },
          { name: 'payment-service', display_name: 'Payment Service', status: 'healthy', uptime: 99.90 },
        ];
        
        const { error } = await supabase.from('services').insert(testServices);
        if (!error) results.services = testServices.length;
      }

      // Get service IDs for metrics/logs
      const { data: services } = await supabase.from('services').select('id').limit(3);
      const serviceIds = services?.map(s => s.id) || [];

      // Generate metrics
      if (serviceIds.length > 0) {
        const metrics = [];
        const now = new Date();
        for (let i = 0; i < 10; i++) {
          const serviceId = serviceIds[Math.floor(Math.random() * serviceIds.length)];
          metrics.push({
            service_id: serviceId,
            metric_name: ['cpu_usage', 'memory_usage', 'latency_p50'][Math.floor(Math.random() * 3)],
            value: Math.random() * 100,
            recorded_at: new Date(now.getTime() - i * 60000).toISOString(),
          });
        }
        const { error } = await supabase.from('metrics').insert(metrics);
        if (!error) results.metrics = metrics.length;
      }

      // Generate logs
      if (serviceIds.length > 0) {
        const logs = [];
        for (let i = 0; i < 5; i++) {
          logs.push({
            service_id: serviceIds[Math.floor(Math.random() * serviceIds.length)],
            level: ['INFO', 'INFO', 'INFO', 'WARN', 'DEBUG'][Math.floor(Math.random() * 5)],
            message: `Test activity generated at ${new Date().toISOString()}`,
          });
        }
        const { error } = await supabase.from('logs').insert(logs);
        if (!error) results.logs = logs.length;
      }

      console.log('[Test Activity Complete]', results);

      return new Response(JSON.stringify({ success: true, generated: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Release Validation Error]', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
