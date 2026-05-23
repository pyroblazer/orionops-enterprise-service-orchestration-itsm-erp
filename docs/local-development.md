# Local Development Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with WSL2 backend on Windows)
- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/) 9+
- 16 GB RAM recommended
- Ports 3000, 5432, 6379, 8000, 8080, 8081, 8181, 9000, 9001, 9092, 9200 must be free

## Quick Start (All Docker)

Run this from the repo root — works on Windows, Linux, and macOS:

```sh
pnpm docker:up
```

This tears down any existing stack first (avoiding port conflicts), then builds and starts every service. Wait 2-3 minutes for all containers to become healthy:

```sh
docker compose ps
```

All services healthy? Open these URLs:

| Service | URL | Credentials |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Log in with test users below |
| Backend API | http://localhost:8080/api | - |
| Swagger UI | http://localhost:8080/api/swagger-ui.html | - |
| AI Service | http://localhost:8000 | - |
| Keycloak Admin | http://localhost:8081 | admin / admin |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| OpenSearch | http://localhost:9200 | admin / admin |

Run `pnpm docker:up` again at any time — all init steps are idempotent (Kafka topics use `--if-not-exists`, MinIO bucket uses `--ignore-existing`, Flyway tracks applied migrations).

### Stopping

```sh
pnpm docker:down        # Stop, keep data
pnpm docker:reset       # Stop and wipe all data (fresh start)
```

## Hybrid Mode (Infrastructure in Docker, Apps Native)

Use this when you want hot-reload and debugger support for the backend or frontend.

### Step 1: Start Infrastructure

```sh
pnpm docker:infra
```

This tears down any running infra containers first, then starts the infrastructure stack in the background.

### Step 2: Start Backend

```sh
cd backend
mvn spring-boot:run
```

The backend reads defaults from `application.yml` which match the Docker ports. No `.env` editing needed.

### Step 3: Start Web Frontend

```sh
pnpm install
pnpm dev:web
```

The web app reads defaults from `apps/web/.env.example`. If you need custom values, copy it:

- **Windows (PowerShell):** `Copy-Item apps/web/.env.example apps/web/.env.local`
- **Linux / macOS:** `cp apps/web/.env.example apps/web/.env.local`

### Step 4: Start AI Service (Optional)

```sh
cd apps/ai
python -m venv .venv
```

Activate the virtual environment:

- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
- **Windows (cmd):** `.venv\Scripts\activate.bat`
- **Linux / macOS:** `source .venv/bin/activate`

Then install and run:

```sh
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Test Users

Keycloak is pre-configured with these test users (password matches username):

| Username | Password | Role |
|----------|----------|------|
| admin | admin | Full administrator |
| agent | agent | Service desk agent |
| engineer | engineer | Resolver engineer |
| changemgr | changemgr | Change manager |
| sandbox | sandbox | Admin + Agent + Engineer + Change Manager |

For a feature walkthrough with pre-loaded demo data, see the [Sandbox Guide](sandbox-guide.md).

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | `localhost:5432` (db: `orionops`, user: `orionops`, pass: `orionops_dev`) |
| Redis | 6379 | `localhost:6379` |
| Zookeeper | 2181 | `localhost:2181` |
| Kafka | 9092 | `localhost:9092` |
| OpenSearch | 9200 | http://localhost:9200 |
| MinIO API | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| Keycloak | 8081 | http://localhost:8081 |
| OPA | 8181 | http://localhost:8181 |
| Backend | 8080 | http://localhost:8080/api |
| Web | 3000 | http://localhost:3000 |
| AI Service | 8000 | http://localhost:8000 |

## Troubleshooting

### Port Already in Use

Find what is using a port and stop it before running Docker:

- **Windows (PowerShell):** `netstat -ano | findstr :5432` then `taskkill /PID <pid> /F`
- **Linux / macOS:** `lsof -i :5432` then `kill <pid>`

Or just run `pnpm docker:up` — it calls `docker compose down` first, which releases all Docker-held ports automatically.

### Backend Fails to Start

1. Check all infrastructure services are healthy: `docker compose ps`
2. Check backend logs: `docker compose logs backend`
3. Verify PostgreSQL is ready: `docker compose exec postgres pg_isready -U orionops`

### Kafka Not Connecting

Ensure no other Kafka instance is running on port 9092. The Docker Kafka advertises `localhost:9092` for host-side access and `kafka:29092` for inter-container traffic.

### Flyway Migration Errors

If migrations fail due to stale data, wipe and restart:

```sh
pnpm docker:reset
```

### Keycloak Realm Not Imported

The realm file is at `backend/src/main/resources/keycloak/orionops-realm.json`. Verify the Keycloak container's volume mount is correct in `docker compose config`.

### OPA Returns No Policies

OPA policies are loaded from `infra/opa/policies/`. Verify the volume mount in `backend/docker-compose.yml` points to `../infra/opa/policies:/policies`.
