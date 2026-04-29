# OrionOps - Enterprise Service Orchestration Platform

## Project Overview
ISO 20000-aligned ITSM platform with ERP extensions. Multi-tenant SaaS with BPMN workflow orchestration.

## Architecture
- **Backend**: Java 21+ Spring Boot (modular monolith at `backend/`)
- **Web**: Next.js 14 App Router (at `apps/web/`)
- **Mobile**: React Native + Expo (at `apps/mobile/`)
- **AI**: Python FastAPI (at `apps/ai/`)

## Key Patterns
- CQRS + Event Sourcing on Incident, Change, SLA, Billing modules
- Other modules use standard Spring Data JPA CRUD
- Flyway SQL migrations in `backend/src/main/resources/db/migration/`
- Kafka for domain events
- Redis for caching
- OpenSearch for full-text search
- Keycloak for IAM/SSO
- OPA for fine-grained authorization

## Commands
- Backend: `cd backend && mvn spring-boot:run`
- Web: `pnpm dev:web`
- Mobile: `pnpm dev:mobile`
- Full stack dev: `cd backend && docker compose up -d` then start backend and web

## Database
PostgreSQL with Flyway migrations. Migrations are numbered V001, V002, etc.
JPA entities in `com.orionops.modules.*` packages.
