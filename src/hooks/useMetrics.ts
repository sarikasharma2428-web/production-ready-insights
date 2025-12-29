import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { backendApi } from '@/lib/backendApi';

interface Metric {
  id: string;
  service_id: string | null;
  metric_name: string;
  value: number;
  unit: string | null;
  recorded_at: string;
}

interface MetricDataPoint {
  timestamp: Date;
  value: number;
}

interface MetricSeries {
  name: string;
  data: MetricDataPoint[];
  unit?: string;
}

interface MetricsStatusItem {
  service_id: string;
  service_name: string;
  status: string;
  latency: string;
  error_rate: string;
  saturation: string;
}

export function useMetrics(serviceId?: string, hours = 24) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [metricsStatus, setMetricsStatus] = useState<MetricsStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(false);

  const fetchFromBackend = useCallback(async () => {
    try {
      const statusData = await backendApi.getMetricsStatus(serviceId);
      setMetricsStatus((statusData.services || []) as MetricsStatusItem[]);
      setError(null);
      return true;
    } catch (err) {
      console.warn('Backend metrics fetch failed:', err);
      return false;
    }
  }, [serviceId]);

  const fetchFromSupabase = useCallback(async () => {
    try {
      const fromTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('metrics')
        .select('*')
        .gte('recorded_at', fromTime)
        .order('recorded_at', { ascending: true });

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      const { data, error: supaError } = await query;

      if (supaError) throw supaError;
      setMetrics(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    }
  }, [serviceId, hours]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);

    await backendApi.waitForCheck();

    if (backendApi.isBackendAvailable()) {
      const success = await fetchFromBackend();
      if (success) {
        setUseBackend(true);
      }
    }

    // Always also fetch from Supabase for historical data
    await fetchFromSupabase();
    setLoading(false);
  }, [fetchFromBackend, fetchFromSupabase]);

  useEffect(() => {
    fetchMetrics();

    // Poll every 30 seconds
    const pollInterval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(pollInterval);
  }, [fetchMetrics]);

  // Helper to get a time series for a specific metric
  const getMetricSeries = useCallback((metricName: string): MetricSeries => {
    const filteredMetrics = metrics.filter(m => m.metric_name === metricName);
    return {
      name: metricName,
      data: filteredMetrics.map(m => ({
        timestamp: new Date(m.recorded_at),
        value: Number(m.value)
      })),
      unit: filteredMetrics[0]?.unit || undefined
    };
  }, [metrics]);

  const insertMetric = async (metric: {
    service_id?: string;
    metric_name: string;
    value: number;
    unit?: string;
  }) => {
    const { error } = await supabase
      .from('metrics')
      .insert([{
        service_id: metric.service_id || null,
        metric_name: metric.metric_name,
        value: metric.value,
        unit: metric.unit || null,
        recorded_at: new Date().toISOString()
      }]);

    if (error) throw error;
  };

  return {
    metrics,
    metricsStatus,
    loading,
    error,
    getMetricSeries,
    insertMetric,
    refetch: fetchMetrics,
    isUsingBackend: useBackend
  };
}
