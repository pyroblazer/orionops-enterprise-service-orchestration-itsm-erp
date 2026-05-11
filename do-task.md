# OrionOps Sandbox Mode — Task List

## Completed

- [x] **Task 1: Add sandbox user + deterministic IDs to Keycloak realm**
  - File: `backend/src/main/resources/keycloak/orionops-realm.json`
  - Added explicit `id` UUIDs to all 5 users (admin, agent, engineer, changemgr, sandbox)
  - Added new `sandbox` user (password: `sandbox`) with roles: admin, service_desk_agent, resolver_engineer, change_manager

- [x] **Task 2: Add missing placeholder text to frontend inputs**
  - `apps/web/src/app/(dashboard)/admin/page.tsx` — added placeholders to platform-name, default-timezone, date-format, currency
  - `apps/web/src/app/(dashboard)/settings/page.tsx` — added placeholder to timezone input, added language helper text
  - `apps/web/src/app/(dashboard)/audit/page.tsx` — added title attributes and helper text to from-date and to-date

---

## Remaining Tasks

### Task 3: Create V006 Flyway Migration — Seed Data

**File:** `backend/src/main/resources/db/migration/V006__seed_sandbox_data.sql` (new)

Create a Flyway migration that seeds ~300 rows across 35 tables. Use a `sandbox_uuid(seed TEXT)` helper for deterministic UUIDs. All rows use `tenant_id = '00000000-0000-0000-0000-000000000001'`.

**Phase A — Platform Foundation (V001 tables)**

- [ ] `tenants` — 1 row: OrionOps Demo Organization (id must be `00000000-0000-0000-0000-000000000001`)
- [ ] `users` — 5 rows: admin, agent, engineer, changemgr, sandbox (keycloak_id matches realm JSON ids: `a1a1a1a1-1111-1111-1111-111111111101` through `...105`)
- [ ] `roles` — 7 rows: admin, service_desk_agent, resolver_engineer, change_manager, service_owner, viewer, finance_manager
- [ ] `permissions` — ~60 rows: resource:action pairs across all modules (incident:create, incident:read, incident:update, incident:delete, problem:*, change_request:*, service_request:*, cmdb:*, sla:*, knowledge:*, workflow:*, finance:*, procurement:*, inventory:*, vendor:*, workforce:*, billing:*, tenant:*, integration:*, audit:*, notification:*, search:*)
- [ ] `role_permissions` — ~80 rows: map permissions to roles (admin gets all, others get scoped subsets)
- [ ] `user_roles` — 5+ rows: map each user to their role(s) (sandbox gets 4 roles)
- [ ] `groups` — 5 rows: IT Operations, Development, Infrastructure, Security, Management
- [ ] `user_groups` — 5+ rows: map users to groups

**Phase B — ITSM Data (V002 tables)**

- [ ] `services` — 8 rows: Email Service, VPN Service, Web Application, Database Service, File Storage, IAM, Monitoring & Alerting, CI/CD Pipeline (with criticality: critical/high/medium)
- [ ] `configuration_items` — 12 rows: PROD-WEB-01, PROD-WEB-02, PROD-DB-01, PROD-DB-02, PROD-APP-01, STG-WEB-01, NETWORK-SW-01, PROD-LB-01, DEV-APP-01, BACKUP-SRV-01, VPN-GW-01, MONITOR-01 (with JSONB attributes, environment, linked to services)
- [ ] `ci_relationships` — ~15 rows: depends_on, hosts, connects_to, contains relationships between CIs
- [ ] `incidents` — 10 rows: covering all statuses (open×2, in_progress×2, on_hold×1, resolved×2, closed×2, cancelled×1), priorities (critical, high, medium, low), categories; one parent/child pair
- [ ] `problems` — 5 rows: open, under_investigation, root_cause_identified, resolved, closed; with root_cause, workaround, known_error fields
- [ ] `change_requests` — 6 rows: standard×2, normal×2, emergency×2; statuses: draft, pending_approval, approved, scheduled, implemented, closed; with implementation_plan, rollback_plan, test_plan
- [ ] `service_requests` — 5 rows: "New laptop request", "VPN access setup", "Software installation", etc.; covering all statuses
- [ ] `sla_definitions` — 4 rows: Critical (15min response / 4hr resolution), High (30min/8hr), Medium (2hr/24hr), Low (8hr/48hr)
- [ ] `sla_instances` — 5 rows: active×2, met×1, breached×1, paused×1; attached to incidents
- [ ] `knowledge_articles` — 6 rows: "How to reset your VPN password", "Email configuration guide", "Network troubleshooting checklist", "Server restart procedures", "Onboarding new employees", "Backup and recovery procedures" (3 published, 1 draft, 1 in_review, 1 archived)
- [ ] `workflow_definitions` — 3 rows: Incident Escalation (v1), Change Approval (v2), Procurement Request (v1); with BPMN XML
- [ ] `workflow_instances` — 3 rows: running, completed, suspended; linked to workflow_definitions and entities
- [ ] `approvals` — 4 rows: 2 pending (change_request, purchase_request), 1 approved, 1 rejected
- [ ] `assignments` — ~10 rows: assignment history across incidents showing routing (manual, auto, escalation)
- [ ] `comments` — ~15 rows: mix of internal (is_internal=true) and customer-visible comments on incidents, problems, changes
- [ ] `attachments` — 4 rows: mock file attachments on incidents and change_requests

**Phase C — ERP Data (V003 tables)**

- [ ] `cost_centers` — 4 rows: CC-IT-001 (Information Technology, $500K), CC-OPS-001 (Operations, $350K), CC-HR-001 (Human Resources, $200K), CC-FAC-001 (Facilities, $275K)
- [ ] `budgets` — 4 rows: FY 2026, one per cost center, 60-95% utilization (spent_amount varies)
- [ ] `vendors` — 6 rows: CloudCorp Inc. (cloud, active, 4.5), SecureNet LLC (service, active, 4.2), TechSupply Co. (hardware, active, 3.8), DataVault Systems (software, active, 4.0), Nexus Consulting (consulting, active, 4.7), NetEquip Inc. (hardware, pending, 3.5)
- [ ] `expenses` — 5 rows: categories Infrastructure, Software, Supplies, Travel, Services; statuses: pending, approved, rejected, reimbursed; linked to cost_centers
- [ ] `invoices` — 4 rows: statuses draft, sent, paid, overdue; with JSONB line_items; linked to vendors
- [ ] `payment_records` — 2 rows: for the paid invoice; bank_transfer and credit_card methods
- [ ] `contracts` — 4 rows: active×2, pending_renewal×1, expired×1; types: service, software, maintenance, hardware; auto_renew where appropriate
- [ ] `purchase_requests` — 4 rows: statuses draft, submitted, approved, rejected; with estimated_cost and actual_cost
- [ ] `purchase_orders` — 3 rows: statuses issued, partial, received; with JSONB line_items; linked to purchase_requests and vendors
- [ ] `warehouses` — 3 rows: WH-MAIN (Main Warehouse), WH-IT (IT Storage), WH-DC (Data Center Staging)
- [ ] `inventory_items` — 7 rows: servers, switches, monitors, keyboards, cables, UPS, laptops; 2 items at low stock (quantity <= minimum_quantity)
- [ ] `assets` — 6 rows: in_use×2, available×1, in_maintenance×1, disposed×1, retired×1; linked to CIs and vendors; with depreciation
- [ ] `stock_movements` — 5 rows: in, out, transfer, adjustment, return types
- [ ] `vendor_slas` — 4 rows: on_time_delivery, defect_rate, response_time metrics for top vendors
- [ ] `vendor_performances` — 3 rows: quarterly evaluations with on_time_delivery_pct, quality_score, responsiveness_score, overall_score
- [ ] `employees` — 5 rows: linked to the 5 users; with employee_number, department, job_title, hire_date, manager_id (sandbox reports to admin)
- [ ] `skills` — 8 rows: Java, Python, Networking, Cloud Infrastructure, ITIL Framework, Project Management, DevOps, Security
- [ ] `employee_skills` — ~10 rows: proficiency mappings (beginner, intermediate, advanced, expert)
- [ ] `capacity_plans` — 3 rows: one per team (IT Ops, Infrastructure, Development); with available_hours and allocated_hours
- [ ] `service_usages` — 5 rows: api_calls, storage_gb, hours metrics; linked to services
- [ ] `billing_records` — 3 rows: linked to service_usages; with amounts and billing periods
- [ ] `cost_models` — 3 rows: fixed, tiered, usage_based; with JSONB parameters; linked to services

**Phase D — SaaS Data (V004 tables)**

- [ ] `plans` — 3 rows: Starter ($29/mo), Professional ($99/mo), Enterprise ($299/mo); with JSONB features arrays and limits objects
- [ ] `subscriptions` — 1 row: active Enterprise plan for demo tenant; with period dates
- [ ] `payments` — 3 rows: monthly billing history; completed status; card payment method
- [ ] `notifications` — 10 rows: mix of read/unread; types: incident_assigned, sla_breach_warning, approval_required, comment_added, change_scheduled; assigned across users
- [ ] `integration_endpoints` — 2 rows: Slack webhook (active), PagerDuty webhook (active); with JSONB auth_config

**Phase E — Event Store (V005 table)**

- [ ] `event_store` — 10 rows: incident_created, incident_assigned, incident_escalated, incident_resolved, problem_created, change_submitted, change_approved, change_implemented, sla_created, sla_breach_warning; with JSONB payload and metadata; unique (aggregate_id, sequence_number)

**Phase F — Audit Trail (V001 table)**

- [ ] `audit_events` — 12 rows: INSERT only (triggers block UPDATE/DELETE); actions: LOGIN, CREATE_INCIDENT, UPDATE_STATUS, CREATE_CHANGE, APPROVE_CHANGE, CREATE_PROBLEM, ASSIGN_INCIDENT, ESCALATE_INCIDENT, CREATE_EXPENSE, CREATE_PR, PAYMENT_RECEIVED, USER_SYNC

---

### Task 4: Create Sandbox Guide Documentation

**File:** `docs/sandbox-guide.md` (new)

Write a comprehensive markdown guide with these sections:

- [ ] **Overview** — what sandbox mode is, purpose (demo, training, evaluation), what's included
- [ ] **Quick Start** — 3 steps: docker compose up, wait for healthy, log in at localhost:3000
- [ ] **Sandbox Accounts** — table of all 5 accounts (username, password, roles, best use case). Highlight sandbox as "try everything" account
- [ ] **Feature Walkthrough** — subsection per module describing demo data and what to try:
  - [ ] Dashboard — summary cards, SLA gauge, recent incidents, quick actions
  - [ ] Incident Management — 10 incidents across all lifecycle states, parent/child demo, filters
  - [ ] Problem Management — 5 problems, root cause analysis, linked incidents, known errors
  - [ ] Change Management — 6 changes (standard/normal/emergency), approval workflow, CAB
  - [ ] Service Requests — 5 requests from catalog, fulfillment tracking
  - [ ] CMDB — 12 CIs, relationship graph, impact analysis, environments
  - [ ] SLA Dashboard — 4 definitions, 5 instances (active, met, breached, paused)
  - [ ] Knowledge Base — 6 articles, search, publish workflow, feedback
  - [ ] Financial Management — 4 budgets, 5 expenses, 4 invoices, payment tracking
  - [ ] Procurement — 4 PRs, 3 POs, 4 contracts, PR-to-PO flow
  - [ ] Inventory & Assets — 3 warehouses, 7 items (2 low stock), 6 assets with depreciation
  - [ ] Vendor Management — 6 vendors, performance scores, SLA metrics
  - [ ] Service Billing — 5 usage records, 3 billing records, 3 cost models
  - [ ] Workforce Management — 5 employees, 8 skills, 3 capacity plans
  - [ ] Audit Log — how to use filters, entity types, date range
  - [ ] Admin Console — user management, roles, workflows, system settings
  - [ ] Settings — profile, preferences (theme, timezone, language), notifications
- [ ] **All Input Placeholders Reference** — table of every input across all pages with: page, field name, placeholder text, expected input format
- [ ] **API Exploration** — Swagger UI at localhost:8080/api/swagger-ui.html, how to use bearer tokens from login
- [ ] **Mobile App** — how to use sandbox accounts on mobile (same credentials)
- [ ] **Resetting Data** — `docker compose down -v && docker compose up --build`

---

### Task 5: Update Local Development Guide

**File:** `docs/local-development.md`

- [ ] Add sandbox user to the Test Users table (after line 96):
  ```
  | sandbox | sandbox | Admin + Agent + Engineer + Change Manager |
  ```
- [ ] Add a note after the table pointing to sandbox guide:
  ```
  For a feature walkthrough with pre-loaded demo data, see the [Sandbox Guide](sandbox-guide.md).
  ```
