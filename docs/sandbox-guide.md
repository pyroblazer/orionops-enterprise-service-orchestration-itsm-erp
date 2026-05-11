# OrionOps Sandbox Guide

## Overview

The OrionOps sandbox is a fully pre-loaded demo environment designed for exploration, training, and evaluation. It includes realistic data across every module — incidents, changes, problems, CMDB, procurement, finance, workforce, and more — so you can experience the platform without needing to create anything from scratch.

**What's included:**
- 5 user accounts with distinct roles (and one "try everything" account)
- ~300 seed rows across 35 tables spanning ITSM, ERP, SaaS, event sourcing, and audit modules
- Active incidents, breached SLAs, pending approvals, knowledge articles, workflow instances, and vendor records
- A realistic event store and immutable audit trail

**Best for:** demos, team training, partner evaluations, and developer smoke testing.

---

## Quick Start

1. **Start the platform:**
   ```bash
   docker compose up --build
   ```

2. **Wait for all services to become healthy** (typically 2–3 minutes):
   ```bash
   docker compose ps   # all services should show "healthy" or "running"
   ```

3. **Log in at [http://localhost:3000](http://localhost:3000)** using any of the sandbox accounts below.

---

## Sandbox Accounts

All accounts use the password that matches the username (e.g., `admin` / `admin`).

| Username | Password | Roles | Best Use Case |
|----------|----------|-------|---------------|
| `admin` | `admin` | Administrator | Full platform administration, user management, system settings |
| `agent` | `agent` | Service Desk Agent | Incident creation, service requests, first-line support |
| `engineer` | `engineer` | Resolver Engineer | Problem investigation, CMDB management, technical resolution |
| `changemgr` | `changemgr` | Change Manager | Change approvals, CAB reviews, workflow management |
| **`sandbox`** | **`sandbox`** | **Admin + Agent + Engineer + Change Manager** | **Try everything — all modules, all permissions** |

> **Tip:** Use the `sandbox` account to explore the full platform without switching users.

---

## Feature Walkthrough

### Dashboard

The dashboard opens with a live summary of the platform state:

- **Summary cards:** open incidents (4), active changes (3), breached SLAs (1), pending approvals (2)
- **SLA gauge:** shows current SLA compliance rate across all active instances
- **Recent incidents panel:** INC-001 (critical, active), INC-003 (high, in progress), INC-004 (medium, in progress)
- **Quick actions:** create incident, submit service request, new change request

**Things to try:**
- Click an incident card to go directly to the incident detail
- Use the SLA gauge to navigate to the SLA dashboard
- Create a new incident using the quick action button

---

### Incident Management

10 incidents covering the full lifecycle:

| # | Status | Priority | Description |
|---|--------|----------|-------------|
| INC-001 | Open | Critical | Production database unreachable (parent incident) |
| INC-002 | Open | High | Web app 502 errors — child of INC-001 |
| INC-003 | In Progress | High | VPN connectivity issues |
| INC-004 | In Progress | Medium | Email delivery delays |
| INC-005 | On Hold | Medium | CI/CD pipeline intermittent failures |
| INC-006 | Resolved | High | PROD-DB-01 disk usage critical |
| INC-007 | Resolved | Low | Password reset email not received |
| INC-008 | Closed | Critical | Network switch hardware failure |
| INC-009 | Closed | Medium | File storage latency |
| INC-010 | Cancelled | Low | Monitoring dashboard browser cache issue |

**Things to try:**
- View INC-001 and INC-002 to see the parent/child incident relationship
- Filter by status, priority, or category using the toolbar
- Add a comment to INC-003 (internal vs. customer-visible toggle)
- Resolve INC-004 with a resolution code
- Check the assignment history timeline on INC-008

---

### Problem Management

5 problems across all statuses, demonstrating the full ITIL problem lifecycle:

| # | Status | Priority | Title |
|---|--------|----------|-------|
| PRB-001 | Open | Critical | Recurring DB connection pool exhaustion |
| PRB-002 | Under Investigation | High | VPN cert renewal causing disconnections |
| PRB-003 | Root Cause Identified | Medium | Email relay misconfiguration (known error) |
| PRB-004 | Resolved | High | Network switch hardware aging |
| PRB-005 | Closed | Medium | Storage capacity planning gap |

**Things to try:**
- Open PRB-003 to see a documented known error with workaround
- Link PRB-001 to INC-001 to explore incident-problem relationships
- View root cause analysis fields on PRB-004 and PRB-005

---

### Change Management

6 change requests spanning standard, normal, and emergency types:

| # | Type | Status | Title |
|---|------|--------|-------|
| CHG-001 | Standard | Implemented | Monthly application release v2.4.1 |
| CHG-002 | Standard | Closed | TLS certificate rotation |
| CHG-003 | Normal | Approved | PostgreSQL upgrade 15.4 → 15.6 |
| CHG-004 | Normal | Pending Approval | Network switch hardware refresh |
| CHG-005 | Emergency | Scheduled | SQL injection vulnerability hotfix |
| CHG-006 | Emergency | Draft | VPN gateway firmware update |

**Things to try:**
- View CHG-003 implementation plan, rollback plan, and test plan
- Approve or reject CHG-004 (as `changemgr` or `sandbox`)
- View CHG-001 to see a completed change with all fields populated
- Check the CAB approval history on CHG-003

---

### Service Requests

5 requests from the service catalog:

| # | Status | Title |
|---|--------|-------|
| SR-001 | Approved | New laptop request — Dell XPS 15 |
| SR-002 | Fulfilled | VPN access setup for contractor |
| SR-003 | Open | Software installation — IntelliJ IDEA |
| SR-004 | Pending Approval | Database read access for analytics team |
| SR-005 | Cancelled | Email distribution list creation |

**Things to try:**
- Fulfill SR-003 (assign it and mark it fulfilled)
- View the fulfillment history on SR-002
- Submit a new service request from the catalog

---

### CMDB

12 Configuration Items organized across environments with relationship mapping:

| Name | Type | Environment | Service |
|------|------|-------------|---------|
| PROD-WEB-01/02 | Server | Production | Web Application |
| PROD-DB-01/02 | Database | Production | Database Service |
| PROD-APP-01 | Application | Production | Web Application |
| STG-WEB-01 | Server | Staging | Web Application |
| NETWORK-SW-01 | Network Device | Production | Web Application |
| PROD-LB-01 | Network Device | Production | Web Application |
| DEV-APP-01 | Application | Development | Web Application |
| BACKUP-SRV-01 | Server | Production | File Storage |
| VPN-GW-01 | Network Device | Production | VPN Service |
| MONITOR-01 | Application | Production | Monitoring & Alerting |

15 relationships defined (depends_on, hosts, connects_to, contains).

**Things to try:**
- Open PROD-APP-01 and explore its relationship graph
- Use the impact analysis view to see what depends on PROD-DB-01
- Filter CIs by environment (production vs. staging vs. development)
- View the JSON attributes panel on any CI

---

### SLA Dashboard

4 SLA definitions and 5 tracked instances:

| Definition | Priority | Response Target | Resolution Target |
|------------|----------|-----------------|-------------------|
| Critical SLA | Critical | 15 min | 4 hr |
| High SLA | High | 30 min | 8 hr |
| Medium SLA | Medium | 2 hr | 24 hr |
| Low SLA | Low | 8 hr | 48 hr |

| Instance | Status | Linked To |
|----------|--------|-----------|
| SLA-INST-001 | Active (breached) | INC-001 Critical |
| SLA-INST-002 | Active | INC-003 High |
| SLA-INST-003 | Met | INC-007 Low |
| SLA-INST-004 | Breached | INC-008 Critical |
| SLA-INST-005 | Paused | INC-005 Medium |

**Things to try:**
- View the breached SLA on INC-001 and see the breach notification flag
- Compare met vs. breached SLA details
- Explore the paused SLA on INC-005 (on hold incident)

---

### Knowledge Base

6 articles across all statuses:

| Title | Status | Category |
|-------|--------|----------|
| How to reset your VPN password | Published | Access Management |
| Email configuration guide | Published | Communication |
| Network troubleshooting checklist | Published | Network |
| Server restart procedures | Draft | Infrastructure |
| Onboarding new employees — IT checklist | In Review | HR |
| Backup and recovery procedures | Archived | Infrastructure |

**Things to try:**
- Search for "VPN" to find the VPN reset guide
- Use the "helpful/not helpful" feedback on a published article
- Publish the "Server restart procedures" draft article
- View the review workflow on the onboarding article

---

### Financial Management

4 budgets, 5 expenses, 4 invoices demonstrating the financial lifecycle:

**Budgets (FY2026):**
- CC-IT-001 Information Technology: $500K allocated, $312K spent (62%)
- CC-OPS-001 Operations: $350K allocated, $332.5K spent (95% — near limit)
- CC-HR-001 Human Resources: $200K allocated, $120K spent (60%)
- CC-FAC-001 Facilities: $275K allocated, $165K spent (60%)

**Expenses by status:** approved (2), reimbursed (1), pending (1), rejected (1)

**Invoices:** INV-2026-0042 (paid, CloudCorp), INV-2026-0043 (sent, SecureNet), INV-2026-0038 (overdue, TechSupply), INV-2026-0044 (draft, DataVault)

**Things to try:**
- Open the Operations budget to see near-limit utilization warning
- View the paid invoice (INV-2026-0042) and its payment records
- Approve the pending expense for conference travel
- View the overdue invoice and mark it for follow-up

---

### Procurement

Full PR → PO → receiving workflow:

**Purchase Requests:**
- PR-2026-001 (Approved) — Laptop for onboarding, $2,500 est / $2,349 actual
- PR-2026-002 (Submitted) — Network switch replacement, $32,000 est
- PR-2026-003 (Draft) — SSD storage expansion, $4,800 est
- PR-2026-004 (Rejected) — CISSP certification training

**Purchase Orders:** PO-2026-001 (Received), PO-2026-002 (Issued), PO-2026-003 (Partial — AWS monthly)

**Things to try:**
- Follow the full lifecycle: PR-2026-001 → PO-2026-001 → received
- Approve PR-2026-003 (as `admin` or `sandbox`)
- View JSONB line items on PO-2026-002

---

### Inventory & Assets

**3 Warehouses:** WH-MAIN (Main), WH-IT (IT Storage), WH-DC (Data Center Staging)

**7 Inventory Items** (2 at low stock):

| Item | Qty | Min | Status |
|------|-----|-----|--------|
| Dell PowerEdge R750 Server | 3 | 2 | OK |
| Cisco Catalyst 9300 Switch | 2 | 1 | OK |
| Dell 27" 4K Monitor | 8 | 5 | OK |
| Logitech MX Keys Keyboard | **1** | 2 | **Low Stock** |
| CAT6A Network Cable 1m | 45 | 20 | OK |
| APC Smart-UPS 3000VA | **1** | 2 | **Low Stock** |
| Dell XPS 15 Laptop | 4 | 2 | OK |

**6 Assets** across all statuses: in_use (2), in_maintenance (1), available implied, disposed (1), retired (1). All with purchase cost, current value, and depreciation rate.

**5 Stock Movements:** in, out, transfer, adjustment, return types all represented.

**Things to try:**
- Filter inventory by "low stock" to see the two under-minimum items
- View the depreciation schedule on PROD-WEB-01 server asset
- Trace the movement history for the Dell XPS 15 laptop

---

### Vendor Management

6 vendors with performance data:

| Vendor | Type | Status | Rating |
|--------|------|--------|--------|
| CloudCorp Inc. | Cloud | Active | 4.5 |
| SecureNet LLC | Service | Active | 4.2 |
| TechSupply Co. | Hardware | Active | 3.8 |
| DataVault Systems | Software | Active | 4.0 |
| Nexus Consulting | Consulting | Active | 4.7 |
| NetEquip Inc. | Hardware | Pending | 3.5 |

4 vendor SLAs tracked: on_time_delivery (CloudCorp, Nexus), response_time (SecureNet), defect_rate (TechSupply — breaching target at 3.8% vs. 2.0% target).

3 quarterly performance evaluations: CloudCorp (93.3 overall), SecureNet (91.3), TechSupply (75.7 — under review).

**Things to try:**
- Open TechSupply Co. to see the SLA breach and low performance score
- View vendor contracts linked to CloudCorp and SecureNet
- Compare overall scores across the performance evaluations

---

### Service Billing

**5 service usage records** (api_calls, storage_gb, hours metrics) across Web App, Storage, Database, CI/CD, and Monitoring services.

**3 billing records:** 2 invoiced (April 2026), 1 pending (May 2026).

**3 cost models:**
- Web Application Fixed Cost — $2,000/month flat fee
- API Usage Tiered Pricing — $0.005/call (0-1M), $0.003/call (1M-10M), $0.001/call (10M+)
- Storage Usage-Based — $0.023/GB/month, min 100GB

**Things to try:**
- View the tiered pricing model for the Web Application service
- Check which billing records are tied to Invoice INV-2026-0042
- Review the pending May 2026 billing record

---

### Workforce Management

**5 employees** linked to the 5 user accounts:

| Employee # | Name | Department | Job Title | Manager |
|------------|------|------------|-----------|---------|
| EMP-001 | Alice Admin | IT Operations | Platform Administrator | — |
| EMP-002 | Bob Agent | Service Desk | Service Desk Agent | — |
| EMP-003 | Carol Engineer | Infrastructure | Resolver Engineer | — |
| EMP-004 | Dave ChangeMgr | Change Management | Change Manager | — |
| EMP-005 | Sam Sandbox | IT Operations | Sandbox User | Alice Admin |

**8 Skills:** Java, Python, Networking, Cloud Infrastructure, ITIL Framework, Project Management, DevOps, Security

12 employee-skill mappings with proficiency levels (beginner → expert).

**3 capacity plans** for May 2026:
- IT Operations: 320h available, 285h allocated (89%)
- Infrastructure: 480h available, 430h allocated (90%)
- Development: 640h available, 520h allocated (81%)

**Things to try:**
- View Sam Sandbox's profile and see they report to Alice Admin
- Check capacity utilization — all three teams are near capacity
- Add a skill to an employee and set the proficiency level

---

### Audit Log

12 pre-seeded audit events covering:
LOGIN, CREATE_INCIDENT, UPDATE_STATUS, CREATE_CHANGE, APPROVE_CHANGE, CREATE_PROBLEM, ASSIGN_INCIDENT, ESCALATE_INCIDENT, CREATE_EXPENSE, CREATE_PR, PAYMENT_RECEIVED, USER_SYNC

**Things to try:**
- Filter audit events by action type (e.g., show only `APPROVE_CHANGE`)
- Filter by user (e.g., all actions by `admin`)
- Set a date range to view events from the past 7 days
- Verify that you cannot edit or delete audit events (append-only)

---

### Admin Console

Available to the `admin` and `sandbox` accounts:

- **User management:** view and manage all 5 sandbox users
- **Role management:** 7 system roles with permission assignments visible
- **Permission matrix:** ~60 resource:action permissions mapped to roles
- **Workflow definitions:** 3 BPMN workflows (Incident Escalation, Change Approval, Procurement Request)
- **System settings:** platform name, timezone, currency, and language configuration
- **Integration endpoints:** Slack webhook and PagerDuty integration configurations

**Things to try:**
- View the full permission matrix for the `admin` vs. `viewer` roles
- Inspect the BPMN XML for the Change Approval workflow
- Update the platform timezone setting and observe the change

---

### Settings

Profile and preference settings for the current logged-in user:

- **Profile:** update display name, avatar, phone, department, title
- **Preferences:** theme (light/dark/system), timezone, date format, language
- **Notifications:** configure which events trigger in-app and email notifications
- **Security:** change password, manage MFA enrollment

**Things to try:**
- Switch between light and dark themes
- Update the timezone and see timestamps adjust across the platform
- Toggle notification preferences for SLA breach warnings

---

## All Input Placeholders Reference

| Page | Field | Placeholder / Label | Expected Format |
|------|-------|---------------------|-----------------|
| Admin > Platform Settings | Platform Name | `e.g. Acme Corp ITSM` | Free text, max 255 chars |
| Admin > Platform Settings | Default Timezone | `e.g. America/New_York` | IANA timezone string |
| Admin > Platform Settings | Date Format | `e.g. YYYY-MM-DD` | Date format token string |
| Admin > Platform Settings | Currency | `e.g. USD` | ISO 4217 3-letter code |
| Settings > Preferences | Timezone | `e.g. America/New_York` | IANA timezone string |
| Settings > Preferences | Language | Helper: `Select your preferred display language` | Dropdown selection |
| Audit > Filters | From Date | Title: `Filter audit events from this date` | YYYY-MM-DD |
| Audit > Filters | To Date | Title: `Filter audit events up to this date` | YYYY-MM-DD |
| Incidents > New | Title | `Brief description of the issue` | Free text, max 500 chars |
| Incidents > New | Description | `Detailed description, steps to reproduce, impact` | Multi-line text |
| Incidents > New | Category | `e.g. network, database, application` | Dropdown / free text |
| Change > New | Implementation Plan | `Step-by-step implementation instructions` | Multi-line text |
| Change > New | Rollback Plan | `Steps to revert if the change fails` | Multi-line text |
| Change > New | Test Plan | `How to verify the change was successful` | Multi-line text |
| Knowledge > New | Title | `Article title` | Free text, max 500 chars |
| Knowledge > New | Tags | `Add tags separated by commas` | Comma-separated strings |
| Expenses > New | Description | `Purpose of the expense` | Free text, max 500 chars |
| Expenses > New | Amount | `0.00` | Decimal number |
| Purchase Requests > New | Estimated Cost | `0.00` | Decimal number |
| Inventory > New Item | SKU | `e.g. DELL-XPS15-9530` | Alphanumeric, hyphens |
| Inventory > New Item | Minimum Quantity | `Reorder threshold` | Positive integer |
| Vendors > New | Rating | `0.00–5.00` | Decimal, 2 places |
| Employees > New | Employee Number | `e.g. EMP-001` | Alphanumeric with prefix |
| Employees > New | Hire Date | `YYYY-MM-DD` | ISO date |

---

## API Exploration

The backend exposes a full OpenAPI (Swagger) UI at:

**[http://localhost:8080/api/swagger-ui.html](http://localhost:8080/api/swagger-ui.html)**

**To authenticate against the API:**
1. Log in at [http://localhost:3000](http://localhost:3000) with any sandbox account
2. Open browser DevTools → Application → Cookies or Local Storage
3. Copy the `access_token` JWT value
4. In Swagger UI, click **Authorize** and enter: `Bearer <your_access_token>`
5. All API endpoints are now accessible with your user's permissions

**Alternatively, get a token directly from Keycloak:**
```bash
curl -s -X POST http://localhost:8081/realms/orionops/protocol/openid-connect/token \
  -d "grant_type=password&client_id=orionops-web&username=sandbox&password=sandbox" \
  | jq -r .access_token
```

---

## Mobile App

The mobile app (React Native + Expo) uses the same Keycloak identity provider as the web app.

**To connect the mobile app to the sandbox:**
1. Start the sandbox stack with `docker compose up --build`
2. Run the mobile app: `pnpm dev:mobile`
3. In the app, configure the server URL to your machine's local IP address (e.g., `http://192.168.1.x:8080`)
4. Log in with any sandbox account credentials (same username and password as the web app)

All sandbox data is shared — incidents, approvals, and notifications you create on the web are immediately visible in the mobile app.

---

## Resetting Sandbox Data

To wipe all data and start fresh with the original seed data:

```bash
docker compose down -v && docker compose up --build
```

> **Warning:** `down -v` removes all Docker volumes, including the PostgreSQL database. All changes made during your session will be permanently deleted. The seed data will be re-applied automatically by Flyway on startup.
