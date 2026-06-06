-- ============================================================================
-- V011__fix_seed_for_keycloak_login.sql
-- Aligns V006 sandbox seed data with Keycloak realm user emails/IDs so that
-- Keycloak users can log in and see their data.  Also adds extra demo rows.
-- ============================================================================
-- Keycloak accounts (from orionops-realm.json):
--   admin     / admin     — a1a1a1a1-1111-1111-1111-111111111101
--   agent     / agent     — a1a1a1a1-1111-1111-1111-111111111102
--   engineer  / engineer  — a1a1a1a1-1111-1111-1111-111111111103
--   changemgr / changemgr — a1a1a1a1-1111-1111-1111-111111111104
--   sandbox   / sandbox   — a1a1a1a1-1111-1111-1111-111111111105
-- ============================================================================

DO $$
BEGIN
    -- ------------------------------------------------------------------
    -- 1. Fix user emails to match Keycloak realm
    -- ------------------------------------------------------------------
    UPDATE users SET email = 'admin@orionops.local'      WHERE id = 'a1a1a1a1-1111-1111-1111-111111111101';
    UPDATE users SET email = 'agent@orionops.local'      WHERE id = 'a1a1a1a1-1111-1111-1111-111111111102';
    UPDATE users SET email = 'engineer@orionops.local'   WHERE id = 'a1a1a1a1-1111-1111-1111-111111111103';
    UPDATE users SET email = 'changemgr@orionops.local'  WHERE id = 'a1a1a1a1-1111-1111-1111-111111111104';
    UPDATE users SET email = 'sandbox@orionops.local'    WHERE id = 'a1a1a1a1-1111-1111-1111-111111111105';

    RAISE NOTICE 'V011: User emails aligned with Keycloak realm';
END;
$$;

-- ============================================================================
-- 2. Additional demo data to enrich the sandbox experience
--    Uses the same sandbox_uuid() helper from V006.
-- ============================================================================

-- ---- Additional Incidents (5 more for a richer dashboard) ----
INSERT INTO incidents (id, tenant_id, incident_number, title, description, status, priority, impact, urgency, category, subcategory, service_id, ci_id, reporter_id, assignee_id, assignment_group_id, parent_incident_id, resolution_code, resolution_notes, resolved_at, closed_at)
VALUES
    (sandbox_uuid('inc_011'), '00000000-0000-0000-0000-000000000001', 'INC-011',
     'Laptop blue screen — hardware failure',
     'Dell XPS 15 showing blue screen on boot. STOP code: CRITICAL_PROCESS_DIED. Hardware diagnostics indicate RAM failure.',
     'open', 'medium', 'low', 'medium', 'hardware', 'laptop',
     NULL, NULL,
     'a1a1a1a1-1111-1111-1111-111111111105', 'a1a1a1a1-1111-1111-1111-111111111102',
     sandbox_uuid('group_it_ops'), NULL, NULL, NULL, NULL, NULL),

    (sandbox_uuid('inc_012'), '00000000-0000-0000-0000-000000000001', 'INC-012',
     'Monitoring dashboard showing stale data',
     'Grafana dashboards not refreshing. Prometheus target health shows all endpoints as DOWN since 14:00 UTC.',
     'in_progress', 'medium', 'medium', 'medium', 'monitoring', 'dashboard',
     sandbox_uuid('svc_monitoring'), sandbox_uuid('ci_monitor_01'),
     'a1a1a1a1-1111-1111-1111-111111111103', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_infra'), NULL, NULL, NULL, NULL, NULL),

    (sandbox_uuid('inc_013'), '00000000-0000-0000-0000-000000000001', 'INC-013',
     'Unauthorized access attempt detected on VPN',
     'IDS flagged 47 failed login attempts from IP 203.0.113.99 within 5 minutes targeting VPN gateway.',
     'in_progress', 'high', 'high', 'high', 'security', 'unauthorized_access',
     sandbox_uuid('svc_vpn'), sandbox_uuid('ci_vpn_gw_01'),
     'a1a1a1a1-1111-1111-1111-111111111101', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_security'), NULL, NULL, NULL, NULL, NULL),

    (sandbox_uuid('inc_014'), '00000000-0000-0000-0000-000000000001', 'INC-014',
     'CI/CD build artifact corruption',
     'Pipeline producing corrupted Docker images. SHA256 checksums do not match between build and registry.',
     'resolved', 'high', 'medium', 'high', 'devops', 'cicd',
     sandbox_uuid('svc_cicd'), NULL,
     'a1a1a1a1-1111-1111-1111-111111111103', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_dev'), NULL, 'resolved_permanently',
     'Root cause: Docker registry storage ran out of inodes. Cleaned up old images and added monitoring.',
     NOW() - INTERVAL '1 day', NULL),

    (sandbox_uuid('inc_015'), '00000000-0000-0000-0000-000000000001', 'INC-015',
     'File share permissions reset after patch',
     'Windows file share permissions reverted to defaults after security patch KB5034441. 3 departments affected.',
     'closed', 'medium', 'medium', 'medium', 'infrastructure', 'permissions',
     sandbox_uuid('svc_storage'), sandbox_uuid('ci_backup_srv_01'),
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_infra'), NULL, 'resolved_permanently',
     'Restored permissions from backup. Documented patch impact for future reference.',
     NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days')
ON CONFLICT (incident_number) DO NOTHING;

-- ---- Additional Knowledge Articles ----
INSERT INTO knowledge_articles (id, tenant_id, title, content, article_type, status, category, tags, author_id, reviewer_id, published_at, views, helpful_count)
VALUES
    (sandbox_uuid('kb_007'), '00000000-0000-0000-0000-000000000001',
     'Incident management quick reference',
     E'# Incident Management Quick Reference\n\n## Severity Levels\n| Priority | Response Target | Resolution Target |\n|----------|----------------|-------------------|\n| Critical | 15 minutes | 4 hours |\n| High | 30 minutes | 8 hours |\n| Medium | 2 hours | 24 hours |\n| Low | 8 hours | 48 hours |\n\n## Escalation Path\n1. **Tier 1** — Service Desk (auto-assigned)\n2. **Tier 2** — Resolver Engineers (after SLA breach warning)\n3. **Tier 3** — Architecture Team (major incidents)\n\n## Major Incident Procedure\n1. Create parent incident\n2. Notify stakeholders via incident channel\n3. Bridge call within 15 minutes\n4. Update incident every 30 minutes\n5. Post-incident review within 48 hours',
     'reference', 'published', 'ITSM',
     ARRAY['incident', 'sla', 'escalation', 'reference'],
     'a1a1a1a1-1111-1111-1111-111111111102',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NOW() - INTERVAL '30 days', 523, 194),

    (sandbox_uuid('kb_008'), '00000000-0000-0000-0000-000000000001',
     'Change management policy and procedures',
     E'# Change Management Policy\n\n## Change Types\n- **Standard**: Pre-approved, low-risk, documented procedures\n- **Normal**: Requires CAB review and approval\n- **Emergency**: Expedited approval for critical fixes\n\n## Approval Matrix\n| Type | Risk | Approver |\n|------|------|----------|\n| Standard | Low | Auto-approved |\n| Normal | Low | Change Manager |\n| Normal | Medium/High | CAB Committee |\n| Emergency | Any | Emergency CAB |\n\n## Key Deadlines\n- Normal changes: Submit 5 business days before implementation\n- Emergency changes: Must be reviewed within 4 hours\n- Post-implementation review: Within 5 business days',
     'policy', 'published', 'Change Management',
     ARRAY['change', 'policy', 'cab', 'approval'],
     'a1a1a1a1-1111-1111-1111-111111111104',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NOW() - INTERVAL '60 days', 312, 145),

    (sandbox_uuid('kb_009'), '00000000-0000-0000-0000-000000000001',
     'Getting started with OrionOps — User guide',
     E'# Getting Started with OrionOps\n\n## Welcome!\nOrionOps is your enterprise service management platform. Here is how to get started.\n\n## 1. Log In\nUse your corporate credentials to log in via the login page. If you don''t have an account, contact your system administrator.\n\n## 2. Dashboard\nAfter logging in, you land on the **Dashboard** which shows:\n- Open incidents count\n- SLA compliance metrics\n- Pending approvals\n- Recent activity\n\n## 3. Report an Incident\nNavigate to **ITSM → Incidents** and click **New Incident**. Fill in:\n- Title and description\n- Priority and category\n- Affected service (if known)\n\n## 4. Submit a Service Request\nGo to **ITSM → Requests** for things like:\n- New equipment\n- Software installation\n- Access requests\n\n## 5. Search the Knowledge Base\nBefore creating a ticket, check **Service → Knowledge** for solutions to common issues.\n\n## 6. Track Your Items\nUse the global search (Ctrl+K) to quickly find any incident, change, or article.\n\n## Keyboard Shortcuts\n| Shortcut | Action |\n|----------|--------|\n| Ctrl+K | Global search |\n| Ctrl+B | Toggle sidebar |\n| Ctrl+/ | Keyboard shortcuts |',
     'how_to', 'published', 'Getting Started',
     ARRAY['getting started', 'onboarding', 'guide', 'tutorial', 'help'],
     'a1a1a1a1-1111-1111-1111-111111111101',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NOW() - INTERVAL '7 days', 89, 67)
ON CONFLICT DO NOTHING;

-- ---- Additional Notifications for a lively dashboard ----
INSERT INTO notifications (id, tenant_id, user_id, notification_type, title, message, entity_type, entity_id, channel, status, sent_at, created_at)
VALUES
    (sandbox_uuid('notif_welcome_admin'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'system',
     'Welcome to OrionOps!',
     'Your enterprise service management platform is ready. Use the interactive tutorial to get started — click the Help button in the sidebar.',
     NULL, NULL, 'in_app', 'unread', NOW(), NOW()),

    (sandbox_uuid('notif_welcome_sandbox'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111105', 'system',
     'Welcome to OrionOps!',
     'Your enterprise service management platform is ready. Use the interactive tutorial to get started — click the Help button in the sidebar.',
     NULL, NULL, 'in_app', 'unread', NOW(), NOW()),

    (sandbox_uuid('notif_sla_breach_001'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111102', 'sla_breach',
     'SLA Breach Warning — INC-001',
     'Critical incident INC-001 (Production database unreachable) has exceeded its 15-minute response target. Immediate escalation required.',
     'incident', sandbox_uuid('inc_001'), 'in_app', 'unread', NOW(), NOW()),

    (sandbox_uuid('notif_change_approved'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111103', 'approval',
     'Change CHG-003 Approved',
     'Your change request CHG-003 (PostgreSQL upgrade) has been approved by the CAB. Scheduled for implementation in 3 days.',
     'change_request', sandbox_uuid('chg_003'), 'in_app', 'unread', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),

    (sandbox_uuid('notif_security_alert'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'security',
     'Security Alert — Unauthorized VPN Access Attempt',
     '47 failed login attempts detected from IP 203.0.113.99 targeting the VPN gateway. Incident INC-013 has been auto-created.',
     'incident', sandbox_uuid('inc_013'), 'in_app', 'unread', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ---- Additional Audit Events ----
INSERT INTO audit_events (id, tenant_id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, timestamp)
VALUES
    (sandbox_uuid('audit_login_admin'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'LOGIN', 'user',
     'a1a1a1a1-1111-1111-1111-111111111101', NULL,
     '{"event": "user_login", "method": "password"}',
     '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0', NOW()),

    (sandbox_uuid('audit_seed_init'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'SYSTEM_INIT', 'tenant',
     '00000000-0000-0000-0000-000000000001', NULL,
     '{"event": "seed_data_loaded", "version": "V011", "description": "Demo environment initialized with sample data"}',
     '127.0.0.1', 'System', NOW() - INTERVAL '1 second')
ON CONFLICT (id) DO NOTHING;
