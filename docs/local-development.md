# Local Development Guide

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with WSL2 backend on Windows)
- 16 GB RAM recommended
- Ports 3000, 5432, 6379, 8000, 8080, 8081, 8181, 9000, 9001, 9092, 9200 must be free

## Quick Start (All Docker)

```bash
make up
```

This runs `docker compose down -v` first (clean slate), then builds and starts every service. Wait 2-3 minutes for all containers to become healthy:

```bash
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

### Stopping

```bash
make down        # Stop containers, keep data
make reset       # Stop containers and delete all data volumes
```

Or directly:

```bash
docker compose down      # Stop, keep data
docker compose down -v   # Stop and wipe data
```

## Hybrid Mode (Infrastructure in Docker, Apps Native)

Use this when you want hot-reload and debugger support for the backend or frontend.

### Step 1: Start Infrastructure

```bash
make infra
```

Or manually:

```bash
cd backend
docker compose up -d
```

### Step 2: Start Backend

```bash
cd backend
mvn spring-boot:run
```

The backend reads defaults from `application.yml` which match the Docker ports. No `.env` editing needed.

### Step 3: Start Web Frontend

```bash
pnpm install
pnpm dev:web
```

The web app reads defaults from `apps/web/.env.example`. If you need custom values, copy it:

```bash
cp apps/web/.env.example apps/web/.env.local
```

### Step 4: Start AI Service (Optional)

```bash
cd apps/ai
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
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

```bash
# Find what's using a port (Windows)
netstat -ano | findstr :5432
# Kill the process
taskkill /PID <pid> /F

# macOS / Linux
lsof -i :5432
kill <pid>
```

### Backend Fails to Start

1. Check all infrastructure services are healthy: `docker compose ps`
2. Check backend logs: `docker compose logs backend`
3. Verify PostgreSQL is ready: `docker compose exec postgres pg_isready -U orionops`

### Kafka Not Connecting

Ensure no other Kafka instance is running on port 9092. The Docker Kafka advertises `localhost:9092` for host-side access and `kafka:29092` for inter-container traffic.

### Flyway Migration Errors

If migrations fail due to stale data, reset the database:

```bash
docker compose down -v
docker compose up -d
```

### Keycloak Realm Not Imported

The realm file is at `backend/src/main/resources/keycloak/orionops-realm.json`. Verify the Keycloak container's volume mount is correct in `docker compose config`.

### OPA Returns No Policies

OPA policies are loaded from `infra/opa/policies/`. Verify the volume mount in `backend/docker-compose.yml` points to `../infra/opa/policies:/policies`.
