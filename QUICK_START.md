# OrionOps Quick Start — No Docker

**Goal:** Run OrionOps locally without Docker. Local services on `localhost`, heavy services on Render free tier.

## TL;DR — 5 Minutes to Running

### 1. Install Prerequisites (Windows)
```powershell
# Install once
winget install PostgreSQL.PostgreSQL.16
winget install Microsoft.OpenJDK.21
winget install OpenJS.NodeJS.LTS
npm install -g pnpm

# Download and install Redis + OPA from:
# Redis: https://github.com/tporadowski/redis/releases (MSI or zip)
# OPA: https://www.openpolicyagent.org/docs/latest/#running-opa (opa.exe)
```

### 2. Create Database (One-Time)
```powershell
# Open psql and run:
psql -U postgres

CREATE USER orionops WITH PASSWORD 'orionops_dev';
CREATE DATABASE orionops OWNER orionops;
GRANT ALL PRIVILEGES ON DATABASE orionops TO orionops;
\q
```

### 3. Start 4 Terminals (Local Services)
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: OPA
opa run --server --addr=0.0.0.0:8181 infra/opa/policies/

# Terminal 3: Backend
cd backend && ./mvnw spring-boot:run

# Terminal 4: Web Frontend
pnpm dev:web
```

That's it! Web loads at `http://localhost:3000`.

---

## For Cloud Services (Render)

If you want to deploy heavy services to Render instead of running them locally:

### 1. Create Render Account
- Sign up at https://render.com (free tier)
- Connect GitHub

### 2. Deploy Each Service
| Service | Deploy To | Notes |
|---------|-----------|-------|
| **Keycloak** | Render | Uses `keycloak/Dockerfile` + Keycloak DB |
| **AI Service** | Render | Simple FastAPI, from `apps/ai` folder |
| **MinIO** | Render + Disk | Or use Cloudflare R2 free tier |
| **OpenSearch** | Bonsai.io | Free managed cluster (recommended) |
| **Kafka** | Upstash | Free serverless Kafka |

### 3. Update Backend Environment Variables
Set these before running `./mvnw spring-boot:run`:
```bash
export KEYCLOAK_AUTH_SERVER_URL=https://your-keycloak.onrender.com
export OPENSEARCH_HOST=<your-cluster>.bonsai.io
export OPENSEARCH_PORT=443
export MINIO_ENDPOINT=https://your-minio.onrender.com  # or R2 URL
export KAFKA_BOOTSTRAP_SERVERS=<your-upstash-endpoint>:9092
```

### 4. Keep Services Alive
- GitHub Actions heartbeat (`.github/workflows/render-heartbeat.yml`) pings Render every 14 minutes
- Add Render service URLs as GitHub secrets:
  ```
  RENDER_AI_URL
  RENDER_KEYCLOAK_URL
  RENDER_MINIO_URL
  RENDER_OPENSEARCH_URL
  ```

---

## Service Health Checks

```bash
# PostgreSQL (auto-running on Windows)
psql -U orionops -d orionops -c "SELECT 1;"

# Redis
redis-cli ping

# OPA
curl http://localhost:8181/v1/data/orionops

# Backend
curl http://localhost:8080/api/actuator/health

# Web
# Open http://localhost:3000
```

---

## Files Created for This Setup

| File | Purpose |
|------|---------|
| `keycloak/Dockerfile` | Build Keycloak with realm pre-loaded |
| `.github/workflows/render-heartbeat.yml` | Keep Render services alive (GitHub Actions) |
| `apps/web/.env.local` | Web config (Keycloak URL, API URL) |
| `apps/mobile/.env` | Mobile app config |
| `infra/debezium/orionops-connector.json` | Updated to use `localhost` |
| `SETUP_NO_DOCKER.md` | Full setup guide with troubleshooting |

---

## Full Docs

See **`SETUP_NO_DOCKER.md`** for:
- Detailed step-by-step installation
- Render deployment instructions (all services)
- Upstash Kafka setup
- Bonsai OpenSearch setup
- Troubleshooting
- Cost breakdown

---

## Typical Local-Only Development Setup

**Fastest for quick iterations:**

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: OPA
opa run --server --addr=0.0.0.0:8181 infra/opa/policies/

# Terminal 3: Backend (PostgreSQL auto-running)
cd backend && ./mvnw spring-boot:run

# Terminal 4: Web
pnpm dev:web

# Optional Terminal 5: Mobile
pnpm dev:mobile
```

All services run locally on `localhost`. Database, Redis, OPA, Backend, Web all on one machine. No cloud, no Docker. Perfect for offline development or testing.

---

## Need Help?

1. **Services not starting?**
   - Check prerequisites installed: `java -version`, `redis-cli`, `psql --version`
   - Verify PostgreSQL running: `psql -U orionops -d orionops -c "SELECT 1;"`

2. **Backend won't connect to Keycloak?**
   - Running local Keycloak? Set `KEYCLOAK_AUTH_SERVER_URL=http://localhost:8081`
   - Running Render Keycloak? Set `KEYCLOAK_AUTH_SERVER_URL=https://your-keycloak.onrender.com`

3. **Web app shows "Unauthorized"?**
   - Check `apps/web/.env.local` has correct `NEXT_PUBLIC_KEYCLOAK_URL`
   - Verify Keycloak realm "orionops" exists

4. **Want to run everything locally without Render?**
   - Just run Backend + Web locally
   - Skip Keycloak, MinIO, OpenSearch, Kafka for simplest dev setup
   - Or install those as Docker containers separately

---

See **`SETUP_NO_DOCKER.md`** for complete troubleshooting and advanced configuration.
