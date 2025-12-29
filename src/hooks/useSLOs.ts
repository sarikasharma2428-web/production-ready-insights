import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SLO {
  id: string;
  name: string;
  service_id: string | null;
  target_availability: number;
  current_availability: number;
  target_latency_p99: number | null;
  current_latency_p99: number | null;
  error_budget: number | null;
  error_budget_total: number;
  error_budget_consumed: number | null;
  period: string | null;
  is_breaching: boolean | null;
  is_budget_exhausted: boolean | null;
  latency_target: number;
  latency_current: number | null;
  created_at: string;
  updated_at: string;
  services?: {
    name: string;
  } | null;
}

export function useSLOs() {
  const [slos, setSLOs] = useState<SLO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSLOs = useCallback(async () => {
    try {
      const { data, error: supaError } = await supabase
        .from('slos')
        .select('*, services(name)')
        .order('name');

      if (supaError) throw supaError;
      setSLOs(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching SLOs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch SLOs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    fetchSLOs();

    channel = supabase
      .channel('slos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'slos' },
        () => {
          fetchSLOs();
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchSLOs]);

  const createSLO = async (slo: {
    name: string;
    service_id?: string;
    target_availability: number;
    target_latency_p99: number;
    error_budget: number;
    period?: string;
  }) => {
    const { data, error } = await supabase
      .from('slos')
      .insert([{
        name: slo.name,
        service_id: slo.service_id || null,
        target_availability: slo.target_availability,
        current_availability: 100,
        latency_target: slo.target_latency_p99,
        target_latency_p99: slo.target_latency_p99,
        latency_current: 0,
        current_latency_p99: 0,
        error_budget_total: slo.error_budget,
        error_budget: slo.error_budget,
        error_budget_consumed: 0,
        period: slo.period || '30d',
        is_breaching: false,
        is_budget_exhausted: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateSLO = async (id: string, updates: Partial<SLO>) => {
    // Calculate derived fields
    const is_breaching = updates.current_availability !== undefined && 
      updates.target_availability !== undefined &&
      updates.current_availability < updates.target_availability;

    const is_budget_exhausted = updates.error_budget_consumed !== undefined &&
      updates.error_budget_total !== undefined &&
      updates.error_budget_consumed >= updates.error_budget_total;

    const { data, error } = await supabase
      .from('slos')
      .update({
        ...updates,
        is_breaching,
        is_budget_exhausted
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const breachingCount = slos.filter(s => s.is_breaching).length;
  const budgetExhaustedCount = slos.filter(s => s.is_budget_exhausted).length;

  return {
    slos,
    loading,
    error,
    createSLO,
    updateSLO,
    breachingCount,
    budgetExhaustedCount,
    refetch: fetchSLOs
  };
}
