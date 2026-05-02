# IntelliJ IDEA Setup Guide

This guide helps new developers set up IntelliJ IDEA for contributing to OrionOps. It covers project import, run configurations, debugging, and development workflows for all four services.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Import](#project-import)
- [Backend (Java / Spring Boot)](#backend-java--spring-boot)
- [Web (Next.js)](#web-nextjs)
- [Mobile (React Native / Expo)](#mobile-react-native--expo)
- [AI Service (Python / FastAPI)](#ai-service-python--fastapi)
- [Docker Compose](#docker-compose)
- [Database Access](#database-access)
- [Debugging](#debugging)
- [Run Configurations](#run-configurations)
- [Recommended Plugins](#recommended-plugins)
- [Code Style & Formatting](#code-style--formatting)
- [Common Workflows](#common-workflows)

## Prerequisites

Before opening the project, install the following:

| Tool | Version | Install |
|------|---------|---------|
| IntelliJ IDEA | Ultimate 2024.x+ | [jetbrains.com/idea](https://www.jetbrains.com/idea/download/) |
| JDK | 21+ (Temurin or GraalVM) | [adoptium.net](https://adoptium.net/) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9.15+ | `npm install -g pnpm@9` |
| Python | 3.12+ | [python.org](https://www.python.org/downloads/) |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |

IntelliJ Ultimate is recommended because it supports Java, TypeScript, Python, and database tools in one IDE. Community Edition works for the backend only.

## Project Import

### Step 1: Open the project

1. **File > Open**
2. Select the repository root folder (the one containing `backend/`, `apps/`, `infra/`)
3. When prompted "Trust and Open Project?", click **Trust Project**

### Step 2: Let IntelliJ index

IntelliJ will automatically:
- Detect the Maven project in `backend/` and import it
- Index all Java sources
- Download Maven dependencies

Wait for the bottom-right progress bar to finish indexing. This may take 2-5 minutes on first open.

### Step 3: Set the Project SDK

1. **File > Project Structure > Project**
2. Set **SDK** to JDK 21 (add one if not listed: click "Add SDK > JDK" and point to your JDK 21 install path)
3. Set **Language level** to 21
4. Click **OK**

## Backend (Java / Spring Boot)

### Enable Lombok Annotation Processing

The backend uses Lombok for boilerplate reduction. IntelliJ must be configured to process Lombok annotations.

1. Install the Lombok plugin: **File > Settings > Plugins > search "Lombok" > Install**
2. Enable annotation processing: **File > Settings > Build, Execution, Deployment > Compiler > Annotation Processors**
3. Check **Enable annotation processing**
4. Click **OK**

Without this, you will see compilation errors on `@Data`, `@Builder`, `@RequiredArgsConstructor`, etc.

### Maven Import

IntelliJ should auto-detect `backend/pom.xml`. If not:

1. Right-click `backend/pom.xml` > **Add as Maven Project**
2. Open the **Maven** tool window (right sidebar) and click the **Reload All Maven Projects** button (circular arrows icon)

### Backend Run Configuration

1. **Run > Edit Configurations > + > Spring Boot**
2. Configure:

| Field | Value |
|-------|-------|
| Name | `OrionOps Backend` |
| Main class | `com.orionops.OrionOpsApplication` |
| Module | `orionops-backend` |
| Active profiles | `test` (for local dev without all infrastructure) |
| JRE | 21 |
| Working directory | `backend` |

3. In **Environment variables** (optional, for connecting to real services):

```
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/orionops;SPRING_DATASOURCE_USERNAME=orionops;SPRING_DATASOURCE_PASSWORD=orionops;SPRING_REDIS_HOST=localhost;SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

4. Click **Apply** > **OK**

### Running Backend Tests

#### All unit tests (no Docker required)

```
Run > Edit Configurations > + > JUnit
```

| Field | Value |
|-------|-------|
| Name | `Backend Unit Tests` |
| Test kind | Tags |
| Tag expression | `!docker` |
| Module | `orionops-backend` |
| VM options | `-Dspring.profiles.active=test` |

Or from the terminal in IntelliJ:

```bash
cd backend && mvn test -B -Dtest.excludedGroups=docker -Dspring.profiles.active=test
```

#### Integration tests (requires Docker)

```bash
cd backend && mvn test -B -Dtest.includedGroups=docker -Dspring.profiles.active=test
```

### Backend Module Structure

The backend is a modular monolith under `com.orionops.modules`:

```
backend/src/main/java/com/orionops/
  OrionOpsApplication.java     <-- Spring Boot entry point
  common/                      <-- Shared code (events, exceptions, config)
  config/                      <-- Spring configuration classes
  modules/
    audit/                     <-- Audit trail
    auth/                      <-- Authentication & IAM
    billing/                   <-- Billing & invoicing
    change/                    <-- Change management
    cmdb/                      <-- Configuration management database
    finance/                   <-- Finance & budgeting
    incident/                  <-- Incident management
    integration/               <-- External integrations (Entra ID, etc.)
    inventory/                 <-- Inventory management
    knowledge/                 <-- Knowledge base
    notification/              <-- Notifications
    problem/                   <-- Problem management
    procurement/               <-- Procurement & vendors
    request/                   <-- Service requests
    search/                    <-- Full-text search (OpenSearch)
    sla/                       <-- SLA management
    tenant/                    <-- Multi-tenancy
    vendor/                    <-- Vendor management
    workflow/                  <-- BPMN workflow (Flowable)
    workforce/                 <-- Workforce management
```

Each module typically contains:

```
module/
  controller/     <-- REST API endpoints
  service/        <-- Business logic
  repository/     <-- Data access (JPA)
  entity/         <-- JPA entities
  dto/            <-- Data transfer objects
  event/          <-- Domain events
```

### Adding a New Module

To add a new feature module (e.g., `reports`):

1. Create the package: `backend/src/main/java/com/orionops/modules/reports/`
2. Add sub-packages: `controller/`, `service/`, `repository/`, `entity/`, `dto/`
3. Create the entity with `@Entity`, `@Table`, tenant fields, and soft delete
4. Create a Flyway migration: `backend/src/main/resources/db/migration/V006__create_reports_tables.sql`
5. Create the repository interface extending `JpaRepository` or a custom interface
6. Create the service with `@Service` and `@Transactional`
7. Create the DTO with `@Data` and `@Builder`
8. Create the controller with `@RestController` and `@RequestMapping`
9. Write tests under `backend/src/test/java/com/orionops/modules/reports/`

## Web (Next.js)

### Setup

1. Install dependencies (from the terminal in IntelliJ):

```bash
pnpm install
```

2. IntelliJ will auto-detect the TypeScript configuration. Ensure the JavaScript language service is enabled:

**File > Settings > Languages & Frameworks > TypeScript**
- Set **TypeScript** to the bundled version or point to `node_modules/typescript/bin/tsc`

### Running the Web Dev Server

From the terminal in IntelliJ:

```bash
pnpm dev:web
```

Or create a run configuration:

1. **Run > Edit Configurations > + > npm**
2. Configure:

| Field | Value |
|-------|-------|
| Name | `Web Dev Server` |
| Package manager | pnpm |
| Command | run |
| Scripts | dev:web |
| Working directory | project root |

The web app runs at http://localhost:3000.

### Running Web Tests

```bash
# Unit tests (Jest)
pnpm --filter @orionops/web test

# E2E tests (Playwright)
pnpm --filter @orionops/web test:e2e
```

### Web Project Structure

```
apps/web/
  src/
    app/                      <-- Next.js App Router pages
      (dashboard)/            <-- Route group for authenticated pages
        dashboard/
        incidents/
        problems/
        changes/
        ...
        layout.tsx            <-- Dashboard layout with sidebar
        providers.tsx         <-- React Query provider
        dashboard-shell.tsx   <-- Shell with nav, search, notifications
      login/
        page.tsx              <-- Login page
    components/
      ui/                     <-- Reusable UI components (Button, Input, etc.)
    lib/
      api.ts                  <-- API client and types
      hooks.ts                <-- React Query hooks
      utils.ts                <-- Utility functions
    e2e/                      <-- Playwright end-to-end tests
  next.config.mjs
  tailwind.config.ts
  tsconfig.json
```

### Adding a New Page

To add a new page (e.g., `/reports`):

1. Create `apps/web/src/app/(dashboard)/reports/page.tsx` with `'use client'` directive
2. The page automatically gets the dashboard layout (sidebar, header, notifications)
3. Use existing UI components from `@/components/ui/`
4. Add API hooks in `apps/web/src/lib/hooks.ts`
5. Add API types in `apps/web/src/lib/api.ts`

### Adding a New UI Component

1. Create `apps/web/src/components/ui/my-component.tsx`
2. Use `React.forwardRef` for DOM-wrapping components
3. Use `cn()` from `@/lib/utils` for conditional class merging
4. Follow the existing pattern: accept `className` prop, spread `...props`

## Mobile (React Native / Expo)

### Setup

```bash
pnpm install
```

### Running

```bash
pnpm dev:mobile
```

This starts the Expo dev server. Scan the QR code with the Expo Go app on your phone, or press `a` for Android emulator, `i` for iOS simulator.

### Mobile Project Structure

```
apps/mobile/
  src/
    screens/                  <-- Screen components
    components/               <-- Reusable components
    navigation/               <-- React Navigation setup
    hooks/                    <-- Custom hooks
    services/                 <-- API services
    theme/                    <-- NativeWind theme
  App.tsx                     <-- Entry point
```

## AI Service (Python / FastAPI)

### Setup

1. **File > Settings > Project > Python Interpreter > Add Interpreter > Virtualenv Environment**
2. Set location to `apps/ai/.venv`
3. Set base interpreter to Python 3.12

Or from the terminal:

```bash
cd apps/ai
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

### Running

Create a run configuration:

1. **Run > Edit Configurations > + > Python (FastAPI)**
2. Configure:

| Field | Value |
|-------|-------|
| Name | `AI Service` |
| Module | `uvicorn` |
| Parameters | `main:app --reload --port 8000` |
| Working directory | `apps/ai` |
| Python interpreter | Project virtualenv at `apps/ai/.venv` |

Or from the terminal:

```bash
cd apps/ai && uvicorn main:app --reload --port 8000
```

### AI Project Structure

```
apps/ai/
  main.py                     <-- FastAPI entry point
  models/                     <-- Pydantic models
  routers/                    <-- API route handlers
  services/                   <-- Business logic
  tests/                      <-- Test files
  requirements.txt
  pyproject.toml
  Dockerfile
```

## Docker Compose

The infrastructure dependencies are defined in `backend/docker-compose.yml`.

### Starting Infrastructure

From the terminal in IntelliJ:

```bash
cd backend && docker compose up -d
```

Or use IntelliJ's built-in Docker integration:

1. Open the **Services** tool window (bottom bar or Alt+8)
2. Expand **Docker** > **docker-compose**
3. Right-click `backend/docker-compose.yml` > **Up**

### Services Started

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & sessions |
| Kafka | 9092 | Event streaming |
| OpenSearch | 9200 | Full-text search |
| MinIO | 9000 / 9001 | Object storage |
| Keycloak | 8081 | Identity & access management |
| OPA | 8181 | Policy engine |

### Stopping Infrastructure

```bash
cd backend && docker compose down
```

To reset all data (delete volumes):

```bash
cd backend && docker compose down -v
```

## Database Access

### Using IntelliJ's Database Tool

1. Open **Database** tool window (right sidebar or Alt+1 > Database tab)
2. Click **+ > Data Source > PostgreSQL**
3. Configure:

| Field | Value |
|-------|-------|
| Host | localhost |
| Port | 5432 |
| Database | orionops |
| User | orionops |
| Password | orionops |

4. Click **Test Connection** > **OK**

### Using the Console

In the Database tool window, right-click the data source > **New > Query Console`. You can now run SQL queries directly.

### Flyway Migrations

Migrations are in `backend/src/main/resources/db/migration/`:

- `V001__create_initial_schema.sql`
- `V002__...sql` through `V005__...sql`

To create a new migration, add a file following the naming convention:

```
V{number}__{description_in_snake_case}.sql
```

Use the next available number (check existing files). Flyway runs migrations automatically when the backend starts.

### Keycloak Admin Console

Access at http://localhost:8081 with credentials `admin` / `admin`. The OrionOps realm is pre-configured via `backend/src/main/resources/keycloak/orionops-realm.json`.

## Debugging

### Backend Debugging

1. Set breakpoints in Java code by clicking the gutter next to line numbers
2. Use the **Debug** button (bug icon) instead of **Run** to start in debug mode
3. IntelliJ will stop at breakpoints and show variable state, call stack, and evaluation

#### Remote Debugging (for Docker deployments)

Add a remote JVM debug configuration:

1. **Run > Edit Configurations > + > Remote JVM Debug**
2. Port: 5005
3. Start the backend with: `java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar app.jar`

### Web Debugging

1. Use **Chrome/Edge DevTools** (F12) for frontend debugging
2. In IntelliJ, you can set breakpoints in TypeScript files if the JavaScript Debugger is configured
3. **Run > Edit Configurations > + > JavaScript Debug**
4. URL: `http://localhost:3000`
5. Set breakpoints in `.tsx` files and refresh the browser

### REST API Debugging

IntelliJ has a built-in HTTP client:

1. Create a `.http` file (e.g., `backend/test-api.http`)
2. Write requests:

```http
### Login
POST http://localhost:8080/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}

### List incidents
GET http://localhost:8080/api/v1/incidents
Authorization: Bearer {{token}}
```

3. Click the play icon next to each request to execute

## Run Configurations

Create these for quick access from the toolbar:

### Recommended Run Configurations

| Name | Type | Configuration |
|------|------|---------------|
| Backend | Spring Boot | Main: `OrionOpsApplication`, Profile: `test` |
| Web Dev | npm | Script: `dev:web`, PM: pnpm |
| Backend Tests | JUnit | Tags: `!docker`, Profile: `test` |
| Backend Tests (Docker) | JUnit | Tags: `docker`, Profile: `test` |
| Web E2E Tests | npm | Script: `test:e2e`, PM: pnpm, Dir: `apps/web` |
| AI Service | Python | Module: `uvicorn`, Args: `main:app --reload` |
| Docker Compose Up | Docker Compose | File: `backend/docker-compose.yml` |

## Recommended Plugins

Install these via **File > Settings > Plugins**:

| Plugin | Purpose |
|--------|---------|
| Lombok | Annotation processing for `@Data`, `@Builder`, etc. |
| Spring Boot | Spring Boot run configs, actuator support |
| Key Promoter X | Learn keyboard shortcuts |
| .env files support | `.env` file syntax highlighting |
| GitHub Copilot | AI-assisted coding (optional) |
| Database Navigator | Alternative to built-in Database tool |
| Docker | Docker Compose integration (bundled in Ultimate) |
| Python | Python support (bundled in Ultimate) |
| TypeScript | TypeScript support (bundled) |

## Code Style & Formatting

### Java

1. **File > Settings > Editor > Code Style > Java**
2. Click the gear icon > **Import Scheme > IntelliJ IDEA code style XML**
3. Use Spring Boot conventions: indent 4 spaces, braces on same line

### TypeScript / React

1. **File > Settings > Editor > Code Style > TypeScript**
2. Indent: 2 spaces
3. The project uses ESLint and Prettier. Configure:

**File > Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint**
- Set ESLint package to `apps/web/node_modules/eslint`
- Enable **Run ESLint --fix on save**

### Python

The AI service uses Ruff:

```bash
cd apps/ai && ruff check --fix .
```

## Common Workflows

### Full-Stack Development

1. Start infrastructure: `cd backend && docker compose up -d`
2. Start backend: Run the **Backend** configuration in IntelliJ
3. Start web: Run the **Web Dev** configuration or `pnpm dev:web`
4. Open http://localhost:3000

### Adding a New Feature (End-to-End)

Example: adding a "Reports" feature.

**Step 1: Database migration**

Create `backend/src/main/resources/db/migration/V006__create_reports_tables.sql`:

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parameters JSONB,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);
```

**Step 2: Backend module**

Create the entity, DTO, repository, service, and controller under `backend/src/main/java/com/orionops/modules/reports/`. Follow the existing module patterns.

**Step 3: API types**

Add types and hooks in `apps/web/src/lib/api.ts` and `apps/web/src/lib/hooks.ts`.

**Step 4: Web page**

Create `apps/web/src/app/(dashboard)/reports/page.tsx`.

**Step 5: Sidebar navigation**

Add the new link in `apps/web/src/components/ui/sidebar.tsx`.

**Step 6: Tests**

- Backend unit test: `backend/src/test/java/com/orionops/modules/reports/`
- Web E2E test: `apps/web/e2e/reports.spec.ts`

### Running All Tests Before a Push

```bash
# Backend
cd backend && mvn test -B -Dtest.excludedGroups=docker -Dspring.profiles.active=test

# Web unit tests
pnpm --filter @orionops/web test

# Web E2E tests (requires dev server running)
pnpm --filter @orionops/web test:e2e
```

### Viewing BPMN Workflows

The BPMN process definitions are in `backend/src/main/resources/workflows/`. These are XML files with `.bpmn20.xml` extension.

To edit them visually:
1. Install the **Flowable BPMN visualizer** plugin in IntelliJ, or
2. Use the [Flowable Modeler](https://www.flowable.com/open-source/docs/bpmn/ch07a-BPMN.html) web tool, or
3. Use [Camunda Modeler](https://camunda.com/download/modeler/) (free, supports BPMN 2.0)

### Accessing Swagger API Docs

When the backend is running, open:

```
http://localhost:8080/api/swagger-ui.html
```

This shows all REST endpoints, request/response schemas, and allows interactive testing.

### Accessing Actuator Endpoints

```
http://localhost:8080/api/actuator/health
http://localhost:8080/api/actuator/info
http://localhost:8080/api/actuator/prometheus
http://localhost:8080/api/actuator/metrics
```
