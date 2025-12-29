import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { backendApi } from '@/lib/backendApi';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Incident {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  service_id: string | null;
  triggered_by: string | null;
  started_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  services?: {
    name: string;
  } | null;
}

interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: string;
  message: string;
  author_id: string | null;
  created_at: string;
}

export function useIncidents(options?: {
  status?: string;
  severity?: string;
  serviceId?: string;
}) {
  const { status, severity, serviceId } = options || {};

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(false);

  const fetchFromBackend = useCallback(async () => {
    try {
      const data = await backendApi.getIncidents({
        status,
        severity,
        service_id: serviceId
      });

      setIncidents(data as Incident[]);
      setError(null);
      return true;
    } catch (err) {
      console.warn('Backend incidents fetch failed:', err);
      return false;
    }
  }, [status, severity, serviceId]);

  const fetchFromSupabase = useCallback(async () => {
    try {
      let query = supabase
        .from('incidents')
        .select('*, services(name)')
        .order('started_at', { ascending: false });

      if (status) {
        query = query.eq('status', status.toUpperCase() as 'OPEN' | 'ONGOING' | 'RESOLVED');
      }

      if (severity) {
        query = query.eq('severity', severity.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW');
      }

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error: supaError } = await query;

      if (supaError) throw supaError;
      
      // Map to lowercase for frontend
      const mappedIncidents = (data || []).map(i => ({
        ...i,
        severity: i.severity?.toLowerCase() || 'medium',
        status: i.status?.toLowerCase() || 'open',
      }));
      
      setIncidents(mappedIncidents);
      setError(null);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents');
    }
  }, [status, severity, serviceId]);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);

    await backendApi.waitForCheck();

    if (backendApi.isBackendAvailable()) {
      const success = await fetchFromBackend();
      if (success) {
        setUseBackend(true);
        setLoading(false);
        return;
      }
    }

    setUseBackend(false);
    await fetchFromSupabase();
    setLoading(false);
  }, [fetchFromBackend, fetchFromSupabase]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    fetchIncidents();

    channel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchIncidents]);

  const generateIncidentNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INC-${year}${month}${day}-${random}`;
  };

  const createIncident = async (incident: {
    title: string;
    description?: string;
    severity: string;
    service_id?: string;
  }) => {
    if (useBackend && backendApi.isBackendAvailable()) {
      const data = await backendApi.createIncident(incident);
      await fetchIncidents();
      return data;
    }

    const incidentNumber = generateIncidentNumber();
    const { data, error } = await supabase
      .from('incidents')
      .insert([{
        incident_number: incidentNumber,
        title: incident.title,
        description: incident.description,
        severity: incident.severity.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        status: 'OPEN' as const,
        service_id: incident.service_id || null,
        started_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Create initial event
    await supabase.from('incident_events').insert([{
      incident_id: data.id,
      event_type: 'triggered',
      message: `Incident created: ${incident.title}`
    }]);

    return data;
  };

  const acknowledgeIncident = async (id: string) => {
    if (useBackend && backendApi.isBackendAvailable()) {
      await backendApi.acknowledgeIncident(id);
      await fetchIncidents();
      return;
    }

    const { error } = await supabase
      .from('incidents')
      .update({
        status: 'ONGOING',
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Add event
    await supabase.from('incident_events').insert([{
      incident_id: id,
      event_type: 'acknowledged',
      message: 'Incident acknowledged'
    }]);
  };

  const resolveIncident = async (id: string) => {
    if (useBackend && backendApi.isBackendAvailable()) {
      await backendApi.resolveIncident(id);
      await fetchIncidents();
      return;
    }

    const { error } = await supabase
      .from('incidents')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Add event
    await supabase.from('incident_events').insert([{
      incident_id: id,
      event_type: 'resolved',
      message: 'Incident resolved'
    }]);
  };

  const getIncidentEvents = async (incidentId: string): Promise<IncidentEvent[]> => {
    const { data, error } = await supabase
      .from('incident_events')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const addIncidentEvent = async (incidentId: string, eventType: string, message: string) => {
    const { error } = await supabase
      .from('incident_events')
      .insert([{
        incident_id: incidentId,
        event_type: eventType,
        message
      }]);

    if (error) throw error;
  };

  return {
    incidents,
    loading,
    error,
    createIncident,
    acknowledgeIncident,
    resolveIncident,
    getIncidentEvents,
    addIncidentEvent,
    refetch: fetchIncidents,
    isUsingBackend: useBackend
  };
}
