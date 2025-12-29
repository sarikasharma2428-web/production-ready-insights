# SRE Dashboard - DevOps Guide

## Overview

This directory contains all the infrastructure-as-code for deploying the SRE Dashboard to production environments.

## Directory Structure

```
devops/
├── docker/
│   └── frontend.Dockerfile       # Multi-stage Docker build
├── docker-compose.yml            # Local development stack
├── nginx/
│   ├── nginx.conf               # Nginx main config
│   └── default.conf             # Site configuration
├── k8s/
│   ├── base/                    # Base Kubernetes manifests
│   │   ├── namespace.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── frontend-service.yaml
│   │   ├── ingress.yaml
│   │   ├── hpa.yaml
│   │   ├── pdb.yaml
│   │   ├── configmap.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       ├── dev/                 # Development overrides
│       ├── staging/             # Staging overrides
│       └── prod/                # Production overrides
└── monitoring/
    ├── prometheus/
    │   ├── prometheus.yml       # Prometheus config
    │   └── alerts.yml           # Alert rules
    ├── grafana/
    │   └── provisioning/        # Grafana datasources & dashboards
    ├── loki/
    │   └── loki-config.yml      # Loki log aggregation
    ├── promtail/
    │   └── promtail-config.yml  # Log collection agent
    └── alertmanager/
        └── alertmanager.yml     # Alert routing
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- kubectl
- kustomize
- Node.js 20+

### Local Development with Docker

```bash
# Copy environment template
cp devops/.env.example devops/.env

# Edit .env with your values
vim devops/.env

# Start all services
make docker-up

# View logs
make docker-logs

# Access the dashboard
open http://localhost:3000

# Access Grafana
open http://localhost:3001

# Access Prometheus
open http://localhost:9090
```

### Kubernetes Deployment

```bash
# Development
make k8s-dev

# Staging
make k8s-staging

# Production
make k8s-prod

# Check status
kubectl get all -n sre-dashboard
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) includes:

1. **Lint & Type Check** - ESLint and TypeScript validation
2. **Unit Tests** - Jest with coverage reporting
3. **Security Scan** - Trivy vulnerability scanning
4. **Build** - Production build with Vite
5. **Docker Build** - Multi-stage container build
6. **Deploy Staging** - Auto-deploy on `develop` branch
7. **Deploy Production** - Auto-deploy on `main` branch
8. **Notifications** - Slack notifications for deployment status

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `KUBE_CONFIG_STAGING` | Base64-encoded kubeconfig for staging |
| `KUBE_CONFIG_PROD` | Base64-encoded kubeconfig for production |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications |

## Monitoring

### Prometheus Metrics

- HTTP request rate & latency
- Error rates by status code
- Container resource usage
- Custom application metrics

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | Error rate > 5% for 5m | Critical |
| ServiceDown | Target unreachable for 1m | Critical |
| HighLatency | P99 latency > 1s for 5m | Warning |
| HighCPUUsage | CPU > 80% for 5m | Warning |
| HighMemoryUsage | Memory > 85% for 5m | Warning |
| SLOAvailabilityBreach | Availability < 99.9% | Critical |

### Grafana Dashboards

Pre-configured dashboards for:
- System Overview
- SLO Tracking
- Error Budget Burn Rate
- Infrastructure Metrics

## Scaling

### Horizontal Pod Autoscaler

The HPA is configured to:
- Min replicas: 2 (dev: 1, prod: 3)
- Max replicas: 10 (prod: 20)
- Target CPU: 70%
- Target Memory: 80%

### Resource Limits

| Environment | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|-------------|-----------|----------------|--------------|
| Dev | 50m | 200m | 64Mi | 256Mi |
| Staging | 50m | 200m | 64Mi | 256Mi |
| Production | 100m | 500m | 128Mi | 512Mi |

## Security

- Non-root container user
- Read-only root filesystem
- Dropped capabilities
- Network policies (add as needed)
- TLS termination at ingress
- Security headers in nginx

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod -n sre-dashboard -l app=frontend
kubectl logs -n sre-dashboard -l app=frontend
```

**Ingress not working:**
```bash
kubectl describe ingress -n sre-dashboard
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

**Prometheus not scraping:**
```bash
curl http://localhost:9090/api/v1/targets
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test locally with Docker
4. Submit PR to `develop`
5. After approval, merge to `develop`
6. Test in staging
7. Merge to `main` for production
