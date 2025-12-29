import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { backendApi } from '@/lib/backendApi';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Service {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  status: string;
  uptime: number;
  latency_p50: number;
  latency_p99: number;
  error_rate: number;
  requests_per_second: number;
  cpu_usage: number;
  memory_usage: number;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AddServiceParams {
  name: string;
  display_name?: string;
  description?: string;
  status?: string;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchFromBackend = useCallback(async () => {
    try {
      const data = await backendApi.getServices();
      setServices(data as Service[]);
      setError(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchFromSupabase = useCallback(async () => {
    try {
      const { data, error: supaError } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (supaError) throw supaError;
      setServices((data || []).map(s => ({
        ...s,
        uptime: Number(s.uptime) || 99.9,
        latency_p50: Number(s.latency_p50) || 0,
        latency_p99: Number(s.latency_p99) || 0,
        error_rate: Number(s.error_rate) || 0,
        requests_per_second: Number(s.requests_per_second) || 0,
        cpu_usage: Number(s.cpu_usage) || 0,
        memory_usage: Number(s.memory_usage) || 0,
      })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    }
  }, []);

  const fetchServices = useCallback(async () => {
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
    fetchServices();

    // Set up real-time subscription (Supabase)
    channelRef.current = supabase
      .channel('services-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setServices(prev => [...prev, payload.new as Service]);
          } else if (payload.eventType === 'UPDATE') {
            setServices(prev => prev.map(s =>
              s.id === (payload.new as Service).id ? payload.new as Service : s
            ));
          } else if (payload.eventType === 'DELETE') {
            setServices(prev => prev.filter(s => s.id !== (payload.old as Service).id));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fetchServices]);

  // Separate effect for polling when backend is used
  useEffect(() => {
    if (useBackend) {
      pollIntervalRef.current = setInterval(fetchServices, 30000);
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [useBackend, fetchServices]);

  const addService = async (service: AddServiceParams) => {
    if (useBackend && backendApi.isBackendAvailable()) {
      const data = await backendApi.createService(service);
      await fetchServices();
      return data;
    }

    const { data, error } = await supabase
      .from('services')
      .insert([{ 
        name: service.name,
        display_name: service.display_name || service.name,
        description: service.description || null,
        status: service.status || 'unknown',
        uptime: 99.9,
        latency_p50: 0,
        latency_p99: 0,
        error_rate: 0,
        requests_per_second: 0,
        cpu_usage: 0,
        memory_usage: 0
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    if (useBackend && backendApi.isBackendAvailable()) {
      const data = await backendApi.updateService(id, updates);
      await fetchServices();
      return data;
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const deleteService = async (id: string) => {
    if (useBackend && backendApi.isBackendAvailable()) {
      await backendApi.deleteService(id);
      await fetchServices();
      return;
    }

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  };

  return {
    services,
    loading,
    error,
    addService,
    updateService,
    deleteService,
    refetch: fetchServices,
    isUsingBackend: useBackend
  };
}
