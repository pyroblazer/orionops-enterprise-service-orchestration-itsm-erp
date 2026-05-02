# Kubernetes Setup Guide

This guide walks new developers through setting up a local Kubernetes cluster, configuring kubeconfig, and enabling the CI/CD deploy pipeline.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with WSL 2 backend on Windows)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) CLI
- [helm](https://helm.sh/docs/intro/install/) (optional, for package management)

## 1. Create a Local Kubernetes Cluster

Choose one of the following options:

### Option A: Docker Desktop (Easiest)

1. Open Docker Desktop > Settings > Kubernetes
2. Check "Enable Kubernetes"
3. Click "Apply & Restart"
4. Wait for the indicator to turn green

```bash
# Verify
kubectl get nodes
# Should show: docker-desktop   Ready    control-plane
```

### Option B: Minikube

```bash
# Install (Windows)
choco install minikube

# Start with Docker driver
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=40g

# Verify
kubectl get nodes
# Should show: minikube   Ready    control-plane
```

### Option C: Kind (Kubernetes in Docker)

```bash
# Install (Windows)
choco install kind

# Create cluster
kind create cluster --name orionops --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
EOF

# Verify
kubectl get nodes
```

### Option D: Cloud (EKS, GKE, AKS)

For production deployments, use a managed Kubernetes service:

| Provider | Service | Quick Start |
|----------|---------|-------------|
| AWS | EKS | `eksctl create cluster --name orionops --region us-east-1` |
| Google | GKE | `gcloud container clusters create orionops --num-nodes=3` |
| Azure | AKS | `az aks create --resource-group orionops --name orionops --node-count 3` |

## 2. Locate Your Kubeconfig File

After creating a cluster, kubectl uses a config file to connect to it.

```bash
# Show current kubeconfig path
kubectl config view --minify --raw

# Default locations:
# Linux/WSL:   ~/.kube/config
# Windows:     %USERPROFILE%\.kube\config
# macOS:       ~/.kube/config
```

### For Cloud Clusters

Cloud providers require fetching credentials:

```bash
# AWS EKS
aws eks update-kubeconfig --region us-east-1 --name orionops

# Google GKE
gcloud container clusters get-credentials orionops --region us-east1

# Azure AKS
az aks get-credentials --resource-group orionops --name orionops
```

## 3. Verify Cluster Access

```bash
# Test connectivity
kubectl cluster-info

# List namespaces
kubectl get namespaces

# View current context
kubectl config current-context
```

If `kubectl cluster-info` returns a URL (not "connection refused"), your kubeconfig is working.

## 4. Set Up the KUBE_CONFIG GitHub Secret

The CD pipeline uses a `KUBE_CONFIG` secret to deploy to your cluster.

### Step 1: Encode your kubeconfig as base64

```bash
# Linux / macOS / WSL
cat ~/.kube/config | base64 -w 0

# macOS (different base64 flag)
cat ~/.kube/config | base64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.kube\config"))
```

Copy the entire base64 output to your clipboard.

### Step 2: Add the secret to your GitHub repository

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `KUBE_CONFIG`
5. Value: paste the base64-encoded kubeconfig
6. Click **Add secret**

### Step 3: Verify the secret works

Push a commit to `main` and check the CD workflow. The deploy job should now run instead of being skipped.

```bash
# Trigger a deploy
git commit --allow-empty -m "trigger deploy"
git push
```

## 5. First-Time Cluster Setup

Once your cluster is running and kubeconfig is configured, apply the infrastructure manifests:

```bash
# Create namespace
kubectl apply -f infra/k8s/namespace.yml

# Deploy infrastructure (databases, message queues, etc.)
kubectl apply -f infra/k8s/postgres.yml
kubectl apply -f infra/k8s/redis.yml
kubectl apply -f infra/k8s/kafka.yml
kubectl apply -f infra/k8s/opensearch.yml
kubectl apply -f infra/k8s/minio.yml
kubectl apply -f infra/k8s/keycloak.yml
kubectl apply -f infra/k8s/opa.yml

# Create required Secrets and ConfigMaps
kubectl create secret generic orionops-db-credentials \
  --namespace=orionops \
  --from-literal=username=orionops \
  --from-literal=password=changeme

kubectl create configmap orionops-config \
  --namespace=orionops \
  --from-literal=DATABASE_URL=jdbc:postgresql://postgres:5432/orionops \
  --from-literal=REDIS_HOST=redis \
  --from-literal=KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  --from-literal=KEYCLOAK_URL=http://keycloak:8080 \
  --from-literal=API_URL=http://orionops-backend:8080

# Deploy application services
kubectl apply -f infra/k8s/backend-deployment.yml
kubectl apply -f infra/k8s/web-deployment.yml
kubectl apply -f infra/k8s/ai-deployment.yml
```

## 6. Verify Deployments

```bash
# Check pod status
kubectl get pods -n orionops

# Check services
kubectl get services -n orionops

# Watch rollout
kubectl rollout status deployment/orionops-backend -n orionops --timeout=300s
kubectl rollout status deployment/orionops-web -n orionops --timeout=300s
kubectl rollout status deployment/orionops-ai -n orionops --timeout=300s

# View logs
kubectl logs -f deployment/orionops-backend -n orionops
kubectl logs -f deployment/orionops-web -n orionops
```

## 7. Access the Application Locally

```bash
# Port-forward the web service
kubectl port-forward svc/orionops-web 3000:3000 -n orionops

# Port-forward the backend API
kubectl port-forward svc/orionops-backend 8080:8080 -n orionops
```

Or use minikube/kind tunnel:

```bash
# Minikube
minikube tunnel

# Kind
kubectl port-forward -n orionops svc/orionops-web 3000:3000 --address 0.0.0.0
```

Then open http://localhost:3000 in your browser.

## 8. Useful Commands

```bash
# Scale a deployment
kubectl scale deployment/orionops-backend --replicas=3 -n orionops

# Restart a deployment (rolling restart)
kubectl rollout restart deployment/orionops-backend -n orionops

# Rollback a failed deployment
kubectl rollout undo deployment/orionops-backend -n orionops

# Delete everything (clean slate)
kubectl delete namespace orionops

# Check resource usage
kubectl top pods -n orionops
kubectl top nodes
```

## Troubleshooting

### "connection refused" from kubectl

- Docker Desktop: ensure Kubernetes is enabled in settings
- Minikube: run `minikube start`
- Kind: run `kind get clusters` to verify the cluster exists
- Cloud: re-run the `update-kubeconfig` / `get-credentials` command

### Pods stuck in `ImagePullBackOff`

The CD pipeline pushes images to GitHub Container Registry (ghcr.io). Ensure your cluster can pull from ghcr.io:

```bash
# Create an image pull secret (if the repo is private)
kubectl create secret docker-registry ghcr-secret \
  --namespace=orionops \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<github-pat-with-read-packages>
```

### Pods stuck in `CrashLoopBackOff`

```bash
# Check pod logs
kubectl logs <pod-name> -n orionops

# Check pod events
kubectl describe pod <pod-name> -n orionops
```

Common causes: missing ConfigMap/Secret, database not ready, incorrect environment variables.

### Deploy job skipped in CI

The `KUBE_CONFIG` secret is not set. Follow [Step 4](#4-set-up-the-kube_config-github-secret) to configure it.
