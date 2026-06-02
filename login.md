---
  Login Credentials

  After starting the stack (docker compose up -d + backend), you can log in with any of these Keycloak accounts:

  ┌───────────┬───────────┬───────────────────────────────────────────────────┬─────────────────────────────────────┐
  │ Username  │ Password  │                       Role                        │               Access                │
  ├───────────┼───────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ admin     │ admin     │ Full admin                                        │ Everything                          │
  ├───────────┼───────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ agent     │ agent     │ Service Desk Agent                                │ Incidents, requests, knowledge read │
  ├───────────┼───────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ engineer  │ engineer  │ Resolver Engineer                                 │ Incidents, problems, CMDB, changes  │
  ├───────────┼───────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ changemgr │ changemgr │ Change Manager                                    │ Changes, approvals, workflows       │
  ├───────────┼───────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ sandbox   │ sandbox   │ Multi-role (admin + agent + engineer + changemgr) │ Full demo access                    │
  └───────────┴───────────┴───────────────────────────────────────────────────┴─────────────────────────────────────┘

  Remote Deployment URLs:
  - Frontend:  https://orionops.vercel.app
  - Backend:   https://orionops-enterprise-service.onrender.com/api/v1
  - Keycloak:  https://orionops-keycloak.onrender.com

  Database: Neon PostgreSQL (Cortexgrid project)
  - Schema "public":   Application data (seeded via Flyway V001–V011)
  - Schema "keycloak": Identity provider data (5 demo users from realm import)

  Seed Data Summary:
  - 1 tenant (OrionOps Demo Organization)
  - 5 users, 7 roles, ~60 permissions
  - 15 incidents, 5 problems, 6 change requests, 5 service requests
  - 12 configuration items, 15 CI relationships, 8 services
  - 9 knowledge articles, 4 SLA definitions
  - 6 vendors, 4 cost centers, 4 budgets
  - 3 warehouses, 7 inventory items, 6 assets
  - 5 employees, 8 skills
  - 15 notifications, workflow definitions, approvals, and more

  To re-seed the remote database:
    node scripts/seed-neon.js
