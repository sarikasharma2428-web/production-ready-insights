import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { backendApi } from '@/lib/backendApi';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Json } from '@/integrations/supabase/types';

interface LogEntry {
  id: string;
  service_id: string | null;
  level: string;
  message: string;
  metadata: Json | null;
  trace_id: string | null;
  created_at: string;
  services?: {
    name: string;
  } | null;
}

interface BackendLogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  service_id: string | null;
  metadata: Record<string, unknown> | null;
}

export function useLogs(options?: {
  limit?: number;
  serviceId?: string;
  level?: string;
}) {
  const { limit = 100, serviceId, level } = options || {};

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(false);

  const fetchFromBackend = useCallback(async () => {
    try {
      const data = await backendApi.getLogs({
        service_id: serviceId,
        level,
        limit
      });

      // Transform backend response to match LogEntry interface
      const transformedLogs: LogEntry[] = (data as BackendLogEntry[]).map((log) => ({
        id: log.id,
        service_id: log.service_id,
        level: log.level,
        message: log.message,
        metadata: log.metadata as Json,
        trace_id: null,
        created_at: log.timestamp,
        services: null
      }));

      setLogs(transformedLogs);
      setError(null);
      return true;
    } catch (err) {
      console.warn('Backend logs fetch failed:', err);
      return false;
    }
  }, [serviceId, level, limit]);

  const fetchFromSupabase = useCallback(async () => {
    try {
      let query = supabase
        .from('logs')
        .select('*, services(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }

      if (level) {
        query = query.eq('level', level.toUpperCase() as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR');
      }

      const { data, error: supaError } = await query;

      if (supaError) throw supaError;
      
      // Map to lowercase for frontend
      const mappedLogs = (data || []).map(l => ({
        ...l,
        level: l.level?.toLowerCase() || 'info',
      }));
      
      setLogs(mappedLogs);
      setError(null);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    }
  }, [serviceId, level, limit]);

  const fetchLogs = useCallback(async () => {
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

    fetchLogs();

    channel = supabase
      .channel('logs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs' },
        (payload) => {
          setLogs(prev => [payload.new as LogEntry, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchLogs, limit]);

  const insertLog = async (log: {
    level: string;
    message: string;
    service_id?: string;
    metadata?: Record<string, unknown>;
    trace_id?: string;
  }) => {
    const { error } = await supabase
      .from('logs')
      .insert([{
        level: log.level.toUpperCase() as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
        message: log.message,
        service_id: log.service_id || null,
        metadata: (log.metadata || {}) as Json,
        trace_id: log.trace_id || null
      }]);

    if (error) throw error;
  };

  return {
    logs,
    loading,
    error,
    insertLog,
    refetch: fetchLogs,
    isUsingBackend: useBackend
  };
}
