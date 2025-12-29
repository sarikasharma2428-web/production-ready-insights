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
    const alertId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      const severity = url.searchParams.get('severity');
      const isActive = url.searchParams.get('is_active');
      const serviceId = url.searchParams.get('service_id');

      let query = supabase
        .from('alerts')
        .select('*, services(name, display_name)')
        .order('created_at', { ascending: false });

      if (severity) query = query.eq('severity', severity);
      if (isActive !== null) query = query.eq('is_active', isActive === 'true');
      if (serviceId) query = query.eq('service_id', serviceId);

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} alerts`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      const alertData = {
        title: body.title || body.name,
        name: body.name,
        service_id: body.service_id || null,
        severity: body.severity || 'INFO',
        message: body.message,
        metric_name: body.metric_name || null,
        threshold: body.threshold || null,
        current_value: body.current_value || null,
        is_active: true,
        fired_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('alerts')
        .insert(alertData)
        .select()
        .single();

      if (error) throw error;

      console.log(`Created alert: ${data.title}`);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!alertId) {
        return new Response(JSON.stringify({ error: 'Alert ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle special actions
      if (action === 'acknowledge') {
        const { data, error } = await supabase
          .from('alerts')
          .update({ acknowledged_at: new Date().toISOString() })
          .eq('id', alertId)
          .select()
          .single();

        if (error) throw error;
        console.log(`Acknowledged alert: ${alertId}`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'silence') {
        const body = await req.json();
        const silenceMinutes = body.duration_minutes || 60;
        const silencedUntil = new Date(Date.now() + silenceMinutes * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from('alerts')
          .update({ silenced_until: silencedUntil })
          .eq('id', alertId)
          .select()
          .single();

        if (error) throw error;
        console.log(`Silenced alert: ${alertId} until ${silencedUntil}`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'resolve') {
        const { data, error } = await supabase
          .from('alerts')
          .update({ 
            is_active: false,
            resolved_at: new Date().toISOString() 
          })
          .eq('id', alertId)
          .select()
          .single();

        if (error) throw error;
        console.log(`Resolved alert: ${alertId}`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // General update
      const body = await req.json();
      const { data, error } = await supabase
        .from('alerts')
        .update(body)
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      
      console.log(`Deleted alert: ${alertId}`);
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
