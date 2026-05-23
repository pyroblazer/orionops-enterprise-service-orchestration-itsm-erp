# OrionOps Setup Without Docker — Hybrid Local + Render

This guide helps you run the entire OrionOps stack without Docker. Services that are lightweight run as native binaries on `localhost`; resource-heavy services deploy to **Render free tier** (kept alive with a GitHub Actions heartbeat every 14 minutes).

## Architecture Overview

### Local Native Services (Your Machine)
- **PostgreSQL 16** — database engine (auto-starts as Windows service after install)
- **Redis 7** — cache and session store
- **OPA 0.68.0** — Open Policy Agent for fine-grained authorization
- **Spring Boot Backend** — `./mvnw spring-boot:run` from `backend/` directory
- **Next.js Web** — `pnpm dev:web` from repo root
- **Expo Mobile** — `pnpm dev:mobile` from repo root

### Cloud Services on Render (Free Tier)
- **Keycloak 24** — IAM/SSO (Java app, slow startup, complex config)
- **AI Service** — FastAPI (stateless, trivial to deploy)
- **MinIO** — S3-compatible object storage with persistent disk
- **OpenSearch 2** — Full-text search (recommend Bonsai.io instead for free tier)
- **Kafka** — Message broker (recommend Upstash free tier instead)

## Phase 1: Install Local Prerequisites

### Windows Package Manager (Recommended)

```powershell
# Install PostgreSQL 16
winget install PostgreSQL.PostgreSQL.16

# Install Java 21 (for Spring Boot backend)
winget install Microsoft.OpenJDK.21

# Install Node.js LTS
winget install OpenJS.NodeJS.LTS

# Install Python 3.12 (for local testing/AI service dev)
winget install Python.Python.3.12

# Install pnpm globally (package manager)
npm install -g pnpm
```

### Download & Install Redis

Option 1: Using MSI installer
```
1. Download from: https://github.com/tporadowski/redis/releases
2. Run the MSI installer
3. After install: redis-server (starts on port 6379, no password)
```

Option 2: Using Chocolatey
```powershell
choco install redis -y
redis-server
```

### Download OPA Binary

```
1. Download from: https://www.openpolicyagent.org/docs/latest/#running-opa
2. Download: opa_windows_amd64.exe
3. Rename to: opa.exe
4. Add to PATH or place in repo root
```

## Phase 2: Set Up PostgreSQL Database

After PostgreSQL installs, it auto-starts as a Windows service. Configure it:

```powershell
# Open psql as postgres superuser
psql -U postgres

# In psql:
CREATE USER orionops WITH PASSWORD 'orionops_dev';
CREATE DATABASE orionops OWNER orionops;
GRANT ALL PRIVILEGES ON DATABASE orionops TO orionops;
\q

# Verify connection
psql -U orionops -d orionops -c "SELECT 1;"
```

## Phase 3: Start Local Services

### Terminal 1: Redis
```bash
redis-server
```

### Terminal 2: OPA (Open Policy Agent)
```bash
# From repo root:
opa run --server --addr=0.0.0.0:8181 infra/opa/policies/

# Verify:
curl http://localhost:8181/v1/data/orionops
```

### Terminal 3: Spring Boot Backend
```bash
cd backend
./mvnw spring-boot:run

# Verify at: http://localhost:8080/api/actuator/health
```

### Terminal 4: Next.js Web Frontend
```bash
pnpm dev:web

# Web loads at: http://localhost:3000
```

### Terminal 5: Expo Mobile (Optional)
```bash
pnpm dev:mobile

# Expo dev server and QR code appear in terminal
```

## Phase 4: Deploy Services to Render

### Create Render Account
1. Sign up at https://render.com (free tier sufficient)
2. Connect your GitHub account

### 4.0 Deploy Backend (Optional - Production Deployment)

**The backend can run locally during development.** For production deployment to Render:

1. Click **New +** → **Web Service**
2. Connect GitHub repo
3. Set deployment:
   - **Root directory:** `backend`
   - **Build command:** `./mvnw clean package -DskipTests`
   - **Start command:** `java -jar target/*.jar`
4. Configure environment variables (same as Phase 5 below)
5. Deploy → Backend URL: `https://orionops-enterprise-service.onrender.com`

**For local development:** Use `cd backend && ./mvnw spring-boot:run` instead.

---

### 4a. Deploy AI Service

**Using Render dashboard:**
1. Click **New +** → **Web Service**
2. Connect GitHub repo
3. Set deployment:
   - **Root directory:** `apps/ai`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
4. Environment variables: (leave empty, all optional)
5. Set `HTTP_TIMEOUT` to `120` seconds (large models take time)
6. Deploy

After successful deploy, note the URL (e.g., `https://orionops-ai.onrender.com`).

---

### 4b. Deploy Keycloak

**Create Dockerfile in repo root:**
```dockerfile
# keycloak/Dockerfile is already created for you
FROM quay.io/keycloak/keycloak:24.0.1
COPY backend/src/main/resources/keycloak/ /opt/keycloak/data/import/
RUN /opt/keycloak/bin/kc.sh build
CMD ["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm", "--http-port=8080"]
```

**Create PostgreSQL database for Keycloak (Render add-on):**
1. In Render dashboard, add a PostgreSQL add-on (free for 90 days)
2. Note the connection string

**Deploy Keycloak:**
1. Click **New +** → **Web Service**
2. Connect GitHub repo
3. Set deployment:
   - **Root directory:** (repo root)
   - **Dockerfile path:** `keycloak/Dockerfile`
4. Environment variables:
   ```
   KC_DB=postgres
   KC_DB_URL=<your-render-postgres-connection-url>
   KC_DB_USERNAME=<username>
   KC_DB_PASSWORD=<password>
   KEYCLOAK_ADMIN=admin
   KEYCLOAK_ADMIN_PASSWORD=<secure-password>
   KC_HOSTNAME=<your-keycloak-service-name>.onrender.com
   KC_HTTP_ENABLED=true
   KC_PROXY=edge
   ```
5. Deploy

After successful deploy, note the URL (e.g., `https://orionops-keycloak.onrender.com`).

---

### 4c. Deploy MinIO (Object Storage)

**Option 1: Render Web Service with Disk**
1. Click **New +** → **Web Service**
2. Docker image: `minio/minio`
3. Start command: `server /data --console-address :9001`
4. Add Render **Disk** at `/data` (1GB free)
5. Environment variables:
   ```
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin
   ```
6. Deploy

After deploy, create bucket:
```bash
# Install MinIO client: https://min.io/docs/minio/linux/reference/minio-mc.html
mc alias set render https://your-minio.onrender.com minioadmin minioadmin
mc mb --ignore-existing render/orionops
```

**Option 2: Use Cloudflare R2 (Recommended for Free Tier)**
- Free tier: 10GB storage, 10M requests/month
- S3-compatible, no server management
- Sign up at https://www.cloudflare.com/products/r2/

---

### 4d. Deploy OpenSearch (Full-Text Search)

**⚠️ Render Free Tier is Tight**  
OpenSearch requires 512MB RAM minimum, but Render free tier has limited resources.

**Option 1: Use Bonsai.io (Recommended)**
- Free tier Elasticsearch/OpenSearch cluster
- Cloud-managed, no setup
- Sign up at https://bonsai.io
- Create cluster, copy connection URL

Update `backend/src/main/resources/application.yml` or set env vars:
```yaml
opensearch:
  host: <your-cluster>.bonsai.io
  port: 443
  protocol: https
```

**Option 2: Self-host on Render (Advanced)**
1. Click **New +** → **Web Service**
2. Docker image: `opensearchproject/opensearch:2`
3. Environment variables:
   ```
   discovery.type=single-node
   DISABLE_SECURITY_PLUGIN=true
   OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m
   ```
4. Deploy (or upgrade to Render Starter tier $7/mo)

---

### 4e. Deploy Kafka (Message Broker)

**Recommended: Use Upstash Kafka (Free Tier)**
- 10,000 messages/day free
- REST + Kafka API compatible
- No self-hosting complexity

**Setup:**
1. Sign up at https://upstash.com
2. Create Kafka cluster
3. Create topics in Upstash console:
   ```
   orionops.incident.events
   orionops.change_request.events
   orionops.sla_instance.events
   orionops.billing_record.events
   orionops.service_usage.events
   ```
4. Copy bootstrap server and credentials

Update `backend/src/main/resources/application.yml` or set env vars:
```yaml
spring:
  kafka:
    bootstrap-servers: <your-upstash-endpoint>:9092
    properties:
      sasl.mechanism: SCRAM-SHA-256
      security.protocol: SASL_SSL
      sasl.jaas.config: org.apache.kafka.common.security.scram.ScramLoginModule required username="<user>" password="<pass>";
```

---

## Phase 5: Configure Backend for Render Services

Update environment variables or `application.yml`:

```bash
# Export as shell environment variables before running Spring Boot:
export KEYCLOAK_AUTH_SERVER_URL=https://your-keycloak.onrender.com
export MINIO_ENDPOINT=https://your-minio.onrender.com  # or Cloudflare R2 URL
export OPENSEARCH_HOST=<your-cluster>.bonsai.io
export OPENSEARCH_PORT=443
export OPENSEARCH_PROTOCOL=https
export KAFKA_BOOTSTRAP_SERVERS=<your-upstash-endpoint>:9092
export SPRING_KAFKA_PROPERTIES_SASL_MECHANISM=SCRAM-SHA-256
export SPRING_KAFKA_PROPERTIES_SECURITY_PROTOCOL=SASL_SSL
export SPRING_KAFKA_PROPERTIES_SASL_JAAS_CONFIG='org.apache.kafka.common.security.scram.ScramLoginModule required username="<user>" password="<pass>";'
export AI_SERVICE_URL=https://your-ai.onrender.com
```

Or update `backend/src/main/resources/application.yml` directly (for development):
```yaml
keycloak:
  auth-server-url: https://your-keycloak.onrender.com
  
minio:
  endpoint: https://your-minio.onrender.com

opensearch:
  host: <your-cluster>.bonsai.io
  port: 443
  protocol: https

spring:
  kafka:
    bootstrap-servers: <your-upstash-endpoint>:9092
```

---

## Phase 6: Configure Web Frontend for Render Services

### For Local Backend Development

Create or update `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.onrender.com
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web
```

### For Render Backend Deployment

If backend is deployed to Render, update to:
```
NEXT_PUBLIC_API_URL=https://orionops-enterprise-service.onrender.com/api/v1
NEXT_PUBLIC_KEYCLOAK_URL=https://your-keycloak.onrender.com
NEXT_PUBLIC_KEYCLOAK_REALM=orionops
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=orionops-web
```

**Choose one:** Use `localhost:8080` for local development, or Render URL for production.

---

## Phase 7: Set Up GitHub Actions Heartbeat

The heartbeat prevents Render free tier services from spinning down after 15 minutes.

**Already created:** `.github/workflows/render-heartbeat.yml`

**Configure GitHub Secrets:**
1. Go to repo settings → **Secrets and variables** → **Actions**
2. Add these secrets (values from Render dashboard):
   ```
   RENDER_AI_URL=https://your-ai.onrender.com
   RENDER_KEYCLOAK_URL=https://your-keycloak.onrender.com
   RENDER_MINIO_URL=https://your-minio.onrender.com
   RENDER_OPENSEARCH_URL=https://your-opensearch-or-bonsai.io
   ```

The workflow runs every 14 minutes automatically. Check status in **Actions** tab.

---

## Phase 8: Verification Checklist

### Local Services

```bash
# PostgreSQL
psql -U orionops -d orionops -c "SELECT 1;"
# Expected: 1

# Redis
redis-cli ping
# Expected: PONG

# OPA
curl http://localhost:8181/v1/data/orionops
# Expected: {"result":{...}}

# Backend
curl http://localhost:8080/api/actuator/health
# Expected: {"status":"UP"}

# Web
# Open http://localhost:3000 in browser
# Should see login page
```

### Render Services

```bash
# Backend (if deployed to Render)
curl https://orionops-enterprise-service.onrender.com/api/actuator/health

# AI Service
curl https://your-ai.onrender.com/health

# Keycloak
# Open https://your-keycloak.onrender.com/auth in browser
# Realm "orionops" should be present

# MinIO
curl https://your-minio.onrender.com/minio/health/live

# OpenSearch / Bonsai
curl https://your-cluster.bonsai.io/_cluster/health

# Kafka / Upstash
# Check Upstash console: Topics should show messages flowing

# GitHub Actions Heartbeat
# Check repo Actions tab: Workflow runs every 14 minutes
```

---

## Troubleshooting

### PostgreSQL connection refused
```bash
# Check if running
pg_isready -h localhost -p 5432

# Start manually (if not auto-starting)
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" -l logfile start
```

### Redis connection refused
```bash
# Start Redis
redis-server

# Check listening on port 6379
netstat -an | findstr 6379
```

### OPA policy errors
```bash
# Verify policy syntax
opa test infra/opa/policies/

# Check policy file exists
ls infra/opa/policies/
```

### Backend fails to connect to Keycloak
- Ensure Keycloak is deployed on Render and URL is correct in `KEYCLOAK_AUTH_SERVER_URL`
- For local dev: use `http://localhost:8081` (if running Keycloak locally)

### Web app shows "Unauthorized"
- Check `NEXT_PUBLIC_KEYCLOAK_URL` and `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` in `apps/web/.env.local`
- Verify Keycloak realm "orionops" and client "orionops-web" exist

### Render services keep spinning down
- Ensure GitHub Actions heartbeat is enabled (`.github/workflows/render-heartbeat.yml`)
- Add service URLs as GitHub secrets
- Check Actions tab to see if workflow runs every 14 minutes

---

## Cost Analysis

| Service | Local | Render | Monthly Cost |
|---------|-------|--------|--------------|
| PostgreSQL | ✅ (local) | Optional | Free / $15 (managed) |
| Redis | ✅ (local) | — | Free |
| OPA | ✅ (local) | — | Free |
| Backend | ✅ (local) | — | Free |
| Web | ✅ (local) | ✅ (optional) | Free / $7+ (Vercel) |
| Keycloak | — | ✅ Render | Free (90 days) / $7 |
| AI Service | — | ✅ Render | Free |
| MinIO | — | ✅ Render + Disk | Free / $10 (disk) |
| OpenSearch | — | ✅ Bonsai.io | Free |
| Kafka | — | ✅ Upstash | Free (10K msgs/day) |
| **Total** | **Free** | **Free** | **Free – $35+** |

All services use **free and open-source software**. Only Stripe is commercial (placeholder keys work in dev).

---

## Next Steps

1. Install PostgreSQL, Redis, OPA locally
2. Create `orionops` database and user
3. Deploy Keycloak, AI Service, MinIO to Render
4. Configure Upstash Kafka and Bonsai OpenSearch
5. Update backend env vars to point to Render/cloud services
6. Add GitHub Actions secrets for heartbeat
7. Run backend locally with `./mvnw spring-boot:run`
8. Run web locally with `pnpm dev:web`
9. Verify all services health checks pass

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `keycloak/Dockerfile` | Build Keycloak image with pre-loaded realm |
| `.github/workflows/render-heartbeat.yml` | Keep Render services alive every 14 mins |
| `apps/web/.env.local` | Web frontend config (created by user) |
| `apps/mobile/.env` | Mobile app config (created by user) |
| `infra/debezium/orionops-connector.json` | Updated to use `localhost` for dev |
| `backend/src/main/resources/application.yml` | Already has env var support |

---

## Support

For issues or questions:
1. Check GitHub Issues for similar problems
2. Verify all Prerequisites in Phase 1 are installed
3. Check service health endpoints in Verification Checklist
4. Review troubleshooting section above
5. Check backend/web logs for detailed errors
