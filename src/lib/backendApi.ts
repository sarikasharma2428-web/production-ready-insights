/**
 * Backend API Client
 * Handles communication with FastAPI backend for Docker deployment
 * Falls back to Supabase when backend is not available
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface BackendStatus {
  available: boolean;
  prometheus: boolean;
  loki: boolean;
  database: boolean;
  lastChecked: Date;
}

class BackendApiClient {
  private baseUrl: string;
  private _status: BackendStatus = {
    available: false,
    prometheus: false,
    loki: false,
    database: false,
    lastChecked: new Date()
  };
  private checkPromise: Promise<void> | null = null;

  constructor() {
    this.baseUrl = BACKEND_URL;
    this.checkPromise = this.checkBackendAvailability();
  }

  async waitForCheck(): Promise<void> {
    if (this.checkPromise) {
      await this.checkPromise;
    }
  }

  private async checkBackendAvailability(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        this._status = {
          available: true,
          prometheus: data.prometheus || false,
          loki: data.loki || false,
          database: data.database || false,
          lastChecked: new Date()
        };
        console.log('Backend API connected:', this._status);
      } else {
        this._status.available = false;
      }
    } catch {
      this._status = {
        available: false,
        prometheus: false,
        loki: false,
        database: false,
        lastChecked: new Date()
      };
      console.log('Backend API not available, using Supabase fallback');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        this._status = {
          available: true,
          prometheus: data.prometheus || false,
          loki: data.loki || false,
          database: data.database || false,
          lastChecked: new Date()
        };
        return true;
      }
      return false;
    } catch {
      this._status.available = false;
      return false;
    }
  }

  isBackendAvailable(): boolean {
    return this._status.available;
  }

  get status(): BackendStatus {
    return this._status;
  }

  async healthCheck(): Promise<{ available: boolean; prometheus: boolean; loki: boolean; database: boolean }> {
    await this.checkHealth();
    return {
      available: this._status.available,
      prometheus: this._status.prometheus,
      loki: this._status.loki,
      database: this._status.database
    };
  }

  // Services
  async getServices(): Promise<unknown[]> {
    const response = await fetch(`${this.baseUrl}/api/services`);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  }

  async createService(service: { name: string; description?: string }): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    if (!response.ok) throw new Error('Failed to create service');
    return response.json();
  }

  async updateService(id: string, updates: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update service');
    return response.json();
  }

  async deleteService(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/services/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete service');
  }

  // Alerts
  async getAlerts(options?: { severity?: string; acknowledged?: boolean; service_id?: string }): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (options?.severity) params.set('severity', options.severity);
    if (options?.acknowledged !== undefined) params.set('acknowledged', String(options.acknowledged));
    if (options?.service_id) params.set('service_id', options.service_id);

    const response = await fetch(`${this.baseUrl}/api/alerts?${params}`);
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return response.json();
  }

  async acknowledgeAlert(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/alerts/${id}/acknowledge`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to acknowledge alert');
  }

  async silenceAlert(id: string, durationMinutes: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/alerts/${id}/silence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_minutes: durationMinutes })
    });
    if (!response.ok) throw new Error('Failed to silence alert');
  }

  // Incidents
  async getIncidents(options?: { status?: string; severity?: string; service_id?: string }): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.severity) params.set('severity', options.severity);
    if (options?.service_id) params.set('service_id', options.service_id);

    const response = await fetch(`${this.baseUrl}/api/incidents?${params}`);
    if (!response.ok) throw new Error('Failed to fetch incidents');
    return response.json();
  }

  async createIncident(incident: {
    title: string;
    description?: string;
    severity: string;
    service_id?: string;
  }): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    if (!response.ok) throw new Error('Failed to create incident');
    return response.json();
  }

  async acknowledgeIncident(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/incidents/${id}/acknowledge`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to acknowledge incident');
  }

  async resolveIncident(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/incidents/${id}/resolve`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to resolve incident');
  }

  async getIncidentCorrelation(id: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/incidents/${id}/correlate`);
    if (!response.ok) throw new Error('Failed to get incident correlation');
    return response.json();
  }

  // Logs
  async getLogs(options?: { service_id?: string; level?: string; limit?: number }): Promise<unknown[]> {
    const params = new URLSearchParams();
    if (options?.service_id) params.set('service_id', options.service_id);
    if (options?.level) params.set('level', options.level);
    if (options?.limit) params.set('limit', String(options.limit));

    const response = await fetch(`${this.baseUrl}/api/logs?${params}`);
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  }

  // Metrics
  async getMetricsStatus(serviceId?: string): Promise<{ services: unknown[] }> {
    const params = serviceId ? `?service_id=${serviceId}` : '';
    const response = await fetch(`${this.baseUrl}/api/metrics/status${params}`);
    if (!response.ok) throw new Error('Failed to fetch metrics status');
    return response.json();
  }

  async getMetrics(metricName: string, serviceId?: string, hours = 24): Promise<unknown> {
    const params = new URLSearchParams({ name: metricName, hours: String(hours) });
    if (serviceId) params.set('service_id', serviceId);

    const response = await fetch(`${this.baseUrl}/api/metrics?${params}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  }
}

export const backendApi = new BackendApiClient();
