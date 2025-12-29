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

    const url = new URL(req.url);

    if (req.method === 'GET') {
      const serviceId = url.searchParams.get('service_id');
      const metricName = url.searchParams.get('metric_name');
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const since = url.searchParams.get('since');

      let query = supabase
        .from('metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (serviceId) query = query.eq('service_id', serviceId);
      if (metricName) query = query.eq('metric_name', metricName);
      if (since) query = query.gte('recorded_at', since);

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} metrics`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Support both single metric and batch ingestion
      const metrics = Array.isArray(body) ? body : [body];
      
      const metricsData = metrics.map(m => ({
        service_id: m.service_id || null,
        metric_name: m.metric_name,
        value: m.value,
        unit: m.unit || null,
        recorded_at: m.recorded_at || new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('metrics')
        .insert(metricsData)
        .select();

      if (error) throw error;

      console.log(`Ingested ${data?.length || 0} metrics`);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
