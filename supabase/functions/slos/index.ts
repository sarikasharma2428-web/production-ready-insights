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
    const pathParts = url.pathname.split('/').filter(Boolean);
    const sloId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    if (req.method === 'GET') {
      const serviceId = url.searchParams.get('service_id');
      const breaching = url.searchParams.get('breaching');

      let query = supabase
        .from('slos')
        .select('*, services(name, display_name)')
        .order('created_at', { ascending: false });

      if (serviceId) query = query.eq('service_id', serviceId);
      if (breaching === 'true') query = query.eq('is_breaching', true);

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} SLOs`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      const sloData = {
        name: body.name,
        service_id: body.service_id || null,
        target_availability: body.target_availability || 99.9,
        current_availability: body.current_availability || 100,
        latency_target: body.latency_target || 200,
        latency_current: body.latency_current || 0,
        error_budget_total: body.error_budget_total || 0.1,
        error_budget_consumed: body.error_budget_consumed || 0,
        is_breaching: false,
        is_budget_exhausted: false,
        period: body.period || '30d',
      };

      const { data, error } = await supabase
        .from('slos')
        .insert(sloData)
        .select()
        .single();

      if (error) throw error;

      console.log(`Created SLO: ${data.name}`);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!sloId) {
        return new Response(JSON.stringify({ error: 'SLO ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await req.json();
      
      // Compute derived fields
      const updates: Record<string, unknown> = {
        ...body,
        updated_at: new Date().toISOString(),
      };

      // If current values are provided, compute breach status
      if (body.current_availability !== undefined) {
        const targetAvailability = body.target_availability || 99.9;
        updates.is_breaching = body.current_availability < targetAvailability;
      }

      if (body.error_budget_consumed !== undefined) {
        const errorBudgetTotal = body.error_budget_total || 0.1;
        updates.is_budget_exhausted = body.error_budget_consumed >= errorBudgetTotal;
      }

      const { data, error } = await supabase
        .from('slos')
        .update(updates)
        .eq('id', sloId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Updated SLO: ${sloId}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('slos')
        .delete()
        .eq('id', sloId);

      if (error) throw error;
      
      console.log(`Deleted SLO: ${sloId}`);
      return new Response(JSON.stringify({ success: true }), {
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
