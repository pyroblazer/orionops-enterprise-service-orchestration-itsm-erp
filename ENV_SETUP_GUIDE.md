# OrionOps Environment Variables (.env) Setup Guide

Complete guide to configuring all `.env` files for local development and Render deployments.

---

## Quick Reference: Where Each .env File Goes

| File | Location | Purpose | Git Tracked |
|------|----------|---------|-------------|
| `.env` (optional) | repo root | Backend environment variables | ❌ NO (add to .gitignore) |
| `apps/web/.env.local` | apps/web/ | Web frontend config | ❌ NO (already in .gitignore) |
| `apps/mobile/.env` | apps/mobile/ | Mobile app config | ❌ NO (already in .gitignore) |
| `.env.example` | repo root | Template for reference | ✅ YES |

---

## 1. Backend `.env` File (Optional - For Local Development)

**Location:** `/.env` in repo root

**When to use:**
- Local development with `./mvnw spring-boot:run`
- Override default values in `application.yml`
- NOT committed to git (add to `.gitignore`)

**Create file:**
```bash
# .env (in repo root)
# PostgreSQL Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=orionops
POSTGRES_USER=orionops
POSTGRES_PASSWORD=orionops_dev

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Keycloak IAM
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8081
KEYCLOAK_REALM=orionops
KEYCLOAK_CLIENT_ID=orionops-backend
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin

# OPA Authorization
OPA_ENDPOINT=http://localhost:8181

# Kafka Message Broker
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# OpenSearch Full-Text Search
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=http
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin

# MinIO Object Storage
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=orionops

# Stripe Payment Processing
STRIPE_API_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# OpenTelemetry (Optional)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp

# Email Integration (Optional)
MAIL_HOST=localhost
MAIL_PORT=3025
MAIL_USERNAME=test
MAIL_PASSWORD=test
ORIONOPS_MAIL_FROM_ADDRESS=noreply@orionops.io
ORIONOPS_MAIL_FROM_NAME=OrionOps Platform
ORIONOPS_MAIL_ENABLED=false

# AI Service Integration
AI_SERVICE_URL=http://localhost:8000
```

**Load .env in Spring Boot:**
```bash
# Spring Boot automatically loads .env files in this order:
# 1. application.yml (checked in)
# 2. application-{profile}.yml (checked in)
# 3. .env file (local, not checked in)

# Or manually source it before running:
export $(cat .env | xargs)
./mvnw spring-boot:run
```

---

## 2. Web Frontend `.env.local` (Required)

**Location:** `apps/web/.env.local`

**When to use:**
- Always needed for Next.js frontend
- Points to backend and Keycloak URLs
- NOT committed to git (add to .gitignore)

### 2a. Local Development Setup

```bash
# apps/web/.env.local
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Keycloak OAuth
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web

# Optional: Logging
NEXT_PUBLIC_LOG_LEVEL=debug

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_BULK_ACTIONS=true
NEXT_PUBLIC_ENABLE_AI_CLASSIFY=true
```

**Start web:**
```bash
cd apps/web
pnpm dev
# Web loads at http://localhost:3000
```

### 2b. Render Backend Deployment Setup

**If backend is deployed on Render:**

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=https://orionops-enterprise-service.onrender.com/api/v1
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.onrender.com
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web
```

### 2c. Vercel Deployment Setup

**If deploying web to Vercel:**

```bash
# apps/web/.env.local (for local dev)
NEXT_PUBLIC_API_URL=https://orionops-enterprise-service.onrender.com/api/v1
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.onrender.com
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web

# Then in Vercel dashboard → Settings → Environment Variables:
# Add the same variables without NEXT_PUBLIC_ for server-side:
# API_SECRET=<if needed>
```

---

## 3. Mobile App `.env` (Required for Expo)

**Location:** `apps/mobile/.env`

**When to use:**
- Required for Expo mobile app
- Uses `EXPO_PUBLIC_` prefix for client-side exposure
- NOT committed to git

### 3a. Local Development Setup

```bash
# apps/mobile/.env
# Backend API
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1

# Keycloak OAuth
EXPO_PUBLIC_KEYCLOAK_URL=http://localhost:8081
EXPO_PUBLIC_KEYCLOAK_REALM=orionops
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-mobile

# Logging
EXPO_PUBLIC_LOG_LEVEL=debug

# Optional: Feature Flags
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=false
```

**Start mobile:**
```bash
pnpm dev:mobile
# Scan QR code with Expo Go app
```

### 3b. Render Backend Setup

**If backend is on Render:**

```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=https://orionops-enterprise-service.onrender.com/api/v1
EXPO_PUBLIC_KEYCLOAK_URL=https://your-keycloak.onrender.com
EXPO_PUBLIC_KEYCLOAK_REALM=orionops
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-mobile
```

---

## 4. Render Environment Variables (For Deployed Services)

### 4a. Backend Service on Render

**Service:** Spring Boot Backend  
**Root directory:** `backend`  
**Build command:** `./mvnw clean package -DskipTests`  
**Start command:** `java -jar target/*.jar`

**Environment Variables in Render Dashboard:**

```
# PostgreSQL Connection (use Render add-on or Supabase)
POSTGRES_HOST=<your-render-postgres-host>
POSTGRES_PORT=5432
POSTGRES_DB=orionops
POSTGRES_USER=orionops
POSTGRES_PASSWORD=<secure-password>

# Redis (use Render add-on or Upstash)
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=

# Keycloak (deployed on Render)
KEYCLOAK_AUTH_SERVER_URL=https://your-keycloak.onrender.com
KEYCLOAK_REALM=orionops
KEYCLOAK_CLIENT_ID=orionops-backend
KEYCLOAK_CLIENT_SECRET=<from-keycloak-console>
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=<secure-password>

# OPA (local or deployed)
OPA_ENDPOINT=http://localhost:8181

# Kafka (use Upstash)
KAFKA_BOOTSTRAP_SERVERS=<your-upstash-endpoint>:9092
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="<user>" password="<pass>";

# OpenSearch (use Bonsai.io)
OPENSEARCH_HOST=<your-cluster>.bonsai.io
OPENSEARCH_PORT=443
OPENSEARCH_PROTOCOL=https
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=<bonsai-password>

# MinIO (Render or R2)
MINIO_ENDPOINT=https://your-minio.onrender.com
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=orionops

# Stripe
STRIPE_API_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<secret>

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=<if-using-external-collector>
```

### 4b. Keycloak Service on Render

**Image:** `quay.io/keycloak/keycloak:24.0.1`  
**Dockerfile:** `keycloak/Dockerfile` (already created)

**Environment Variables:**

```
# Database (Render PostgreSQL add-on or Supabase)
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://<host>:5432/keycloak
KC_DB_USERNAME=postgres
KC_DB_PASSWORD=<password>

# Admin User
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<secure-password>

# Network Configuration
KC_HOSTNAME=your-keycloak.onrender.com
KC_HTTP_ENABLED=true
KC_PROXY=edge

# Realm Import
# (realm file is copied in Dockerfile)
```

### 4c. AI Service on Render

**Root directory:** `apps/ai`  
**Dockerfile:** `apps/ai/Dockerfile`

**Environment Variables:**

```
# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Logging
LOG_LEVEL=info

# Model Configuration (if using external LLM)
OPENAI_API_KEY=<if-using-openai>
ANTHROPIC_API_KEY=<if-using-claude>
```

### 4d. MinIO on Render

**Image:** `minio/minio`  
**Start command:** `server /data --console-address :9001`  
**Port:** 9000 (minio API), 9001 (console)  
**Disk:** Add 1GB disk at `/data`

**Environment Variables:**

```
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

---

## 5. GitHub Actions Secrets (For Heartbeat Workflow)

**Location:** GitHub repo → Settings → Secrets and variables → Actions

**Secrets needed for `.github/workflows/render-heartbeat.yml`:**

```
RENDER_AI_URL=https://your-ai.onrender.com
RENDER_KEYCLOAK_URL=https://your-keycloak.onrender.com
RENDER_MINIO_URL=https://your-minio.onrender.com
RENDER_OPENSEARCH_URL=https://your-cluster.bonsai.io
RENDER_BACKEND_URL=https://orionops-enterprise-service.onrender.com (optional)
```

**How to add:**
1. Go to repo → **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret

---

## 6. Complete Setup Checklist

### Step 1: Local `.env` (Backend)
```bash
# Create .env in repo root
cat > .env << 'EOF'
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=orionops
POSTGRES_USER=orionops
POSTGRES_PASSWORD=orionops_dev
REDIS_HOST=localhost
REDIS_PORT=6379
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8081
KEYCLOAK_REALM=orionops
KEYCLOAK_CLIENT_ID=orionops-backend
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=http
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=orionops
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
OPA_ENDPOINT=http://localhost:8181
AI_SERVICE_URL=http://localhost:8000
STRIPE_API_KEY=sk_test_placeholder
EOF

# Load and run backend
source .env
cd backend && ./mvnw spring-boot:run
```

### Step 2: Web Frontend `.env.local`
```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web

# Start web
cd apps/web && pnpm dev
```

### Step 3: Mobile `.env`
```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_KEYCLOAK_URL=http://localhost:8081
EXPO_PUBLIC_KEYCLOAK_REALM=orionops
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-mobile

# Start mobile
pnpm dev:mobile
```

### Step 4: Deploy to Render
1. Set environment variables in Render dashboard for each service
2. Use values from your cloud services (Bonsai, Upstash, etc.)

### Step 5: GitHub Actions Secrets
1. Add Render service URLs as GitHub secrets
2. Workflow automatically runs every 14 minutes

---

## 7. Variable Reference by Service

### PostgreSQL Database
```
POSTGRES_HOST         localhost (local) or <host> (cloud)
POSTGRES_PORT         5432
POSTGRES_DB           orionops
POSTGRES_USER         orionops
POSTGRES_PASSWORD     orionops_dev (local) or <secure> (production)
```

### Redis Cache
```
REDIS_HOST            localhost
REDIS_PORT            6379
REDIS_PASSWORD        (empty for local, set for production)
```

### Keycloak OAuth/SSO
```
KEYCLOAK_AUTH_SERVER_URL          http://localhost:8081 (local) or https://your-keycloak.onrender.com
KEYCLOAK_REALM                    orionops
KEYCLOAK_CLIENT_ID                orionops-backend (backend) or orionops-web (web) or orionops-mobile (mobile)
KEYCLOAK_CLIENT_SECRET            (from Keycloak client setup)
KEYCLOAK_ADMIN_USER               admin
KEYCLOAK_ADMIN_PASSWORD           admin (local) or <secure> (production)
```

### OPA Authorization
```
OPA_ENDPOINT         http://localhost:8181
OPA_POLICY_PATH      /v1/data/orionops/allow
```

### Kafka Message Broker (Upstash)
```
KAFKA_BOOTSTRAP_SERVERS                               <your-upstash-endpoint>:9092
SPRING_KAFKA_PROPERTIES_SASL_MECHANISM                SCRAM-SHA-256
SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL             SASL_SSL
SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG              org.apache.kafka.common.security.scram.ScramLoginModule required username="<user>" password="<pass>";
```

### OpenSearch (Bonsai)
```
OPENSEARCH_HOST                   localhost (local) or <cluster>.bonsai.io (cloud)
OPENSEARCH_PORT                   9200 (local) or 443 (cloud)
OPENSEARCH_PROTOCOL               http (local) or https (cloud)
OPENSEARCH_USERNAME               admin
OPENSEARCH_PASSWORD               admin (local) or <bonsai-password> (cloud)
```

### MinIO Object Storage
```
MINIO_ENDPOINT                    http://localhost:9000 (local) or https://your-minio.onrender.com
MINIO_ACCESS_KEY                  minioadmin
MINIO_SECRET_KEY                  minioadmin
MINIO_BUCKET                      orionops
```

### Stripe Payment
```
STRIPE_API_KEY                    sk_test_placeholder (local) or sk_test_<real-key> (production)
STRIPE_WEBHOOK_SECRET             whsec_placeholder (local) or whsec_<real-secret> (production)
```

### OpenTelemetry (Optional)
```
OTEL_EXPORTER_OTLP_ENDPOINT       http://localhost:4317 (local)
OTEL_TRACES_EXPORTER              otlp
OTEL_METRICS_EXPORTER             otlp
OTEL_LOGS_EXPORTER                otlp
```

### Email Integration (Optional)
```
ORIONOPS_MAIL_ENABLED             false (local) or true (production)
ORIONOPS_MAIL_FROM_ADDRESS        noreply@orionops.io
ORIONOPS_MAIL_FROM_NAME           OrionOps Platform
MAIL_HOST                         localhost (local)
MAIL_PORT                         3025 (local)
MAIL_USERNAME                     test
MAIL_PASSWORD                     test
```

### AI Service
```
AI_SERVICE_URL                    http://localhost:8000 (local) or https://your-ai.onrender.com (cloud)
```

---

## 8. Security Best Practices

⚠️ **NEVER commit .env files to git**

1. **Development:**
   - Use weak passwords (orionops_dev)
   - .env stays local only
   - Add to .gitignore

2. **Production (Render):**
   - Use strong passwords (30+ chars, mix of chars/nums/symbols)
   - Store in Render dashboard environment variables
   - Never paste in code or commit

3. **GitHub Actions:**
   - Use repository secrets for sensitive URLs
   - Reference as `${{ secrets.SECRET_NAME }}`
   - Rotate secrets periodically

4. **Credentials Never in:**
   - Code comments
   - GitHub issues
   - Slack messages
   - Email

---

## 9. Example: Complete Local Setup

```bash
# 1. Create backend .env
cat > .env << 'EOF'
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=orionops
POSTGRES_USER=orionops
POSTGRES_PASSWORD=orionops_dev
REDIS_HOST=localhost
REDIS_PORT=6379
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8081
KEYCLOAK_REALM=orionops
KEYCLOAK_CLIENT_ID=orionops-backend
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
OPENSEARCH_PROTOCOL=http
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=orionops
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
OPA_ENDPOINT=http://localhost:8181
AI_SERVICE_URL=http://localhost:8000
STRIPE_API_KEY=sk_test_placeholder
EOF

# 2. Create web .env
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8081
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web
EOF

# 3. Create mobile .env
cat > apps/mobile/.env << 'EOF'
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_KEYCLOAK_URL=http://localhost:8081
EXPO_PUBLIC_KEYCLOAK_REALM=orionops
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-mobile
EOF

# 4. Terminal 1: Redis
redis-server

# 5. Terminal 2: OPA
opa run --server --addr=0.0.0.0:8181 infra/opa/policies/

# 6. Terminal 3: Backend (loads .env automatically)
cd backend && ./mvnw spring-boot:run

# 7. Terminal 4: Web
cd apps/web && pnpm dev

# Web loads at http://localhost:3000
```

---

## 10. Example: Render Deployment Setup

**For backend on Render, update configs:**

```bash
# apps/web/.env.local (for web to connect to Render backend)
NEXT_PUBLIC_API_URL=https://orionops-enterprise-service.onrender.com/api/v1
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.onrender.com
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web

# apps/mobile/.env (for mobile to connect to Render backend)
EXPO_PUBLIC_API_URL=https://orionops-enterprise-service.onrender.com/api/v1
EXPO_PUBLIC_KEYCLOAK_URL=https://your-keycloak.onrender.com
EXPO_PUBLIC_KEYCLOAK_REALM=orionops
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-mobile

# GitHub secrets for heartbeat
RENDER_BACKEND_URL=https://orionops-enterprise-service.onrender.com
RENDER_KEYCLOAK_URL=https://your-keycloak.onrender.com
RENDER_AI_URL=https://your-ai.onrender.com
RENDER_MINIO_URL=https://your-minio.onrender.com
RENDER_OPENSEARCH_URL=https://your-cluster.bonsai.io
```

---

See **SETUP_NO_DOCKER.md** and **QUICK_START.md** for step-by-step instructions on using these .env files.
