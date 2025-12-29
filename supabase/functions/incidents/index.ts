import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateIncidentNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INC-${year}${month}${day}-${random}`;
}

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
    const incidentId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const severity = url.searchParams.get('severity');
      const serviceId = url.searchParams.get('service_id');

      // Check if requesting events for a specific incident
      if (incidentId && pathParts.includes('events')) {
        const { data, error } = await supabase
          .from('incident_events')
          .select('*')
          .eq('incident_id', incidentId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let query = supabase
        .from('incidents')
        .select('*, services(name, display_name)')
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);
      if (severity) query = query.eq('severity', severity);
      if (serviceId) query = query.eq('service_id', serviceId);

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} incidents`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Check if adding an event to an incident
      if (incidentId && pathParts.includes('events')) {
        const eventData = {
          incident_id: incidentId,
          event_type: body.event_type || 'comment',
          message: body.message,
          author_id: body.author_id || null,
        };

        const { data, error } = await supabase
          .from('incident_events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;
        console.log(`Added event to incident: ${incidentId}`);
        return new Response(JSON.stringify(data), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const incidentData = {
        incident_number: generateIncidentNumber(),
        title: body.title,
        description: body.description || null,
        service_id: body.service_id || null,
        severity: body.severity || 'MEDIUM',
        status: 'OPEN',
        started_at: new Date().toISOString(),
        triggered_by: body.triggered_by || null,
      };

      const { data, error } = await supabase
        .from('incidents')
        .insert(incidentData)
        .select()
        .single();

      if (error) throw error;

      // Add initial event
      await supabase.from('incident_events').insert({
        incident_id: data.id,
        event_type: 'triggered',
        message: `Incident created: ${incidentData.title}`,
      });

      console.log(`Created incident: ${data.incident_number}`);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!incidentId) {
        return new Response(JSON.stringify({ error: 'Incident ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle special actions
      if (action === 'acknowledge') {
        const { data, error } = await supabase
          .from('incidents')
          .update({ 
            status: 'ONGOING',
            acknowledged_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', incidentId)
          .select()
          .single();

        if (error) throw error;

        // Add event
        await supabase.from('incident_events').insert({
          incident_id: incidentId,
          event_type: 'acknowledged',
          message: 'Incident acknowledged',
        });

        console.log(`Acknowledged incident: ${incidentId}`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'resolve') {
        const { data, error } = await supabase
          .from('incidents')
          .update({ 
            status: 'RESOLVED',
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', incidentId)
          .select()
          .single();

        if (error) throw error;

        // Add event
        await supabase.from('incident_events').insert({
          incident_id: incidentId,
          event_type: 'resolved',
          message: 'Incident resolved',
        });

        console.log(`Resolved incident: ${incidentId}`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // General update
      const body = await req.json();
      const { data, error } = await supabase
        .from('incidents')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidentId)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      // Delete associated events first
      await supabase
        .from('incident_events')
        .delete()
        .eq('incident_id', incidentId);

      const { error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', incidentId);

      if (error) throw error;
      
      console.log(`Deleted incident: ${incidentId}`);
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
