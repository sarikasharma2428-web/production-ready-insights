import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check database connectivity
    let dbHealthy = false;
    try {
      const { error } = await supabase.from('services').select('id').limit(1);
      dbHealthy = !error;
    } catch {
      dbHealthy = false;
    }

    // Get system statistics
    const [servicesResult, alertsResult, incidentsResult, slosResult] = await Promise.all([
      supabase.from('services').select('id, status'),
      supabase.from('alerts').select('id, is_active, severity'),
      supabase.from('incidents').select('id, status, severity'),
      supabase.from('slos').select('id, is_breaching, is_budget_exhausted'),
    ]);

    const services = servicesResult.data || [];
    const alerts = alertsResult.data || [];
    const incidents = incidentsResult.data || [];
    const slos = slosResult.data || [];

    // Compute health score
    const totalServices = services.length;
    const healthyServices = services.filter((s: { status: string }) => s.status === 'healthy').length;
    const degradedServices = services.filter((s: { status: string }) => s.status === 'degraded').length;
    const downServices = services.filter((s: { status: string }) => s.status === 'down').length;

    const activeAlerts = alerts.filter((a: { is_active: boolean }) => a.is_active);
    const criticalAlerts = activeAlerts.filter((a: { severity: string }) => a.severity === 'CRITICAL').length;
    const warningAlerts = activeAlerts.filter((a: { severity: string }) => a.severity === 'WARNING').length;

    const openIncidents = incidents.filter((i: { status: string }) => i.status !== 'RESOLVED');
    const criticalIncidents = openIncidents.filter((i: { severity: string }) => i.severity === 'CRITICAL').length;

    const breachingSLOs = slos.filter((s: { is_breaching: boolean }) => s.is_breaching).length;
    const exhaustedBudgets = slos.filter((s: { is_budget_exhausted: boolean }) => s.is_budget_exhausted).length;

    // Calculate overall health score (0-100)
    let healthScore = 100;
    
    // Deduct for down/degraded services
    if (totalServices > 0) {
      healthScore -= (downServices / totalServices) * 40;
      healthScore -= (degradedServices / totalServices) * 15;
    }
    
    // Deduct for alerts
    healthScore -= criticalAlerts * 10;
    healthScore -= warningAlerts * 3;
    
    // Deduct for incidents
    healthScore -= criticalIncidents * 15;
    healthScore -= (openIncidents.length - criticalIncidents) * 5;
    
    // Deduct for SLO issues
    healthScore -= breachingSLOs * 8;
    healthScore -= exhaustedBudgets * 12;
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Determine overall status
    let overallStatus = 'healthy';
    if (healthScore < 50 || criticalIncidents > 0 || downServices > 0) {
      overallStatus = 'unhealthy';
    } else if (healthScore < 80 || criticalAlerts > 0 || breachingSLOs > 0) {
      overallStatus = 'degraded';
    }

    const healthData = {
      status: overallStatus,
      score: Math.round(healthScore),
      timestamp: new Date().toISOString(),
      components: {
        database: dbHealthy,
        api: true,
        prometheus: true, // Placeholder for external monitoring
        loki: true, // Placeholder for external logging
      },
      stats: {
        services: {
          total: totalServices,
          healthy: healthyServices,
          degraded: degradedServices,
          down: downServices,
        },
        alerts: {
          total: alerts.length,
          active: activeAlerts.length,
          critical: criticalAlerts,
          warning: warningAlerts,
        },
        incidents: {
          total: incidents.length,
          open: openIncidents.length,
          critical: criticalIncidents,
        },
        slos: {
          total: slos.length,
          breaching: breachingSLOs,
          budget_exhausted: exhaustedBudgets,
        },
      },
    };

    console.log(`Health check: ${overallStatus} (score: ${healthScore})`);
    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Health check error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      status: 'unhealthy',
      score: 0,
      error: message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
