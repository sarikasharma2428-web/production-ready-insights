.PHONY: help install dev build test lint docker-build docker-push k8s-dev k8s-staging k8s-prod clean

# Default target
help:
	@echo "SRE Dashboard - Available Commands"
	@echo "=================================="
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make test         - Run tests"
	@echo "  make lint         - Run linter"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-push  - Push Docker image"
	@echo "  make docker-up    - Start all containers"
	@echo "  make docker-down  - Stop all containers"
	@echo "  make docker-logs  - View container logs"
	@echo ""
	@echo "Kubernetes:"
	@echo "  make k8s-dev      - Deploy to dev environment"
	@echo "  make k8s-staging  - Deploy to staging environment"
	@echo "  make k8s-prod     - Deploy to production environment"
	@echo ""
	@echo "Monitoring:"
	@echo "  make monitoring   - Start monitoring stack"
	@echo "  make grafana      - Open Grafana dashboard"
	@echo "  make prometheus   - Open Prometheus dashboard"
	@echo ""

# Variables
IMAGE_NAME ?= sre-dashboard/frontend
IMAGE_TAG ?= latest
REGISTRY ?= ghcr.io

# Development
install:
	npm ci --legacy-peer-deps

dev:
	npm run dev

build:
	npm run build

test:
	npm test

lint:
	npm run lint

# Docker Commands
docker-build:
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) -f devops/docker/frontend.Dockerfile .

docker-push:
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
	docker push $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

docker-up:
	cd devops && docker-compose up -d

docker-down:
	cd devops && docker-compose down

docker-logs:
	cd devops && docker-compose logs -f

docker-clean:
	cd devops && docker-compose down -v --rmi all

# Kubernetes Commands
k8s-dev:
	kubectl apply -k devops/k8s/overlays/dev

k8s-staging:
	kubectl apply -k devops/k8s/overlays/staging

k8s-prod:
	kubectl apply -k devops/k8s/overlays/prod

k8s-delete-dev:
	kubectl delete -k devops/k8s/overlays/dev

k8s-delete-staging:
	kubectl delete -k devops/k8s/overlays/staging

k8s-delete-prod:
	kubectl delete -k devops/k8s/overlays/prod

k8s-status:
	kubectl get all -n sre-dashboard

# Monitoring Commands
monitoring:
	cd devops && docker-compose up -d prometheus grafana loki alertmanager

grafana:
	open http://localhost:3001

prometheus:
	open http://localhost:9090

alertmanager:
	open http://localhost:9093

# Cleanup
clean:
	rm -rf dist node_modules
