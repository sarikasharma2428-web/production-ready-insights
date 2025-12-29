import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const serviceId = pathParts[pathParts.length - 1];

    if (req.method === 'GET') {
      // List all services or get one by ID
      if (serviceId && serviceId !== 'services') {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .single();
        
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} services`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      const serviceData = {
        name: body.name,
        display_name: body.display_name || body.name,
        description: body.description || null,
        status: body.status || 'healthy',
        uptime: body.uptime || 99.9,
        latency_p50: body.latency_p50 || 0,
        latency_p99: body.latency_p99 || 0,
        error_rate: body.error_rate || 0,
        cpu_usage: body.cpu_usage || 0,
        memory_usage: body.memory_usage || 0,
        requests_per_second: body.requests_per_second || 0,
        request_count: body.request_count || 0,
      };

      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`Created service: ${data.name}`);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await req.json();
      const { data, error } = await supabase
        .from('services')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`Updated service: ${serviceId}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      
      console.log(`Deleted service: ${serviceId}`);
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
