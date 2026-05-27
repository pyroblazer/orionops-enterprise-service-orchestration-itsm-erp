-- ============================================================================
-- V006__seed_sandbox_data.sql
-- OrionOps Enterprise Service Orchestration Platform - Sandbox Seed Data
-- ============================================================================
-- Seeds ~300 rows across 35 tables for demo, training, and evaluation.
-- All rows use tenant_id = '00000000-0000-0000-0000-000000000001'.
-- sandbox_uuid(seed) produces deterministic UUIDs from a text seed.
-- ============================================================================

-- Helper function: deterministic UUID from a text seed
CREATE OR REPLACE FUNCTION sandbox_uuid(seed TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (encode(digest(seed, 'md5'), 'hex'))::UUID;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PHASE A — PLATFORM FOUNDATION
-- ============================================================================

-- TENANTS (1 row)
INSERT INTO tenants (id, name, slug, domain, status, settings)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'OrionOps Demo Organization',
    'demo',
    'demo.orionops.local',
    'active',
    '{"timezone": "America/New_York", "date_format": "YYYY-MM-DD", "currency": "USD", "language": "en"}'
);

-- USERS (5 rows — keycloak_id in display_name field for reference)
-- Keycloak IDs: a1a1a1a1-1111-1111-1111-11111111110{1..5}
INSERT INTO users (id, tenant_id, email, first_name, last_name, display_name, department, title, status)
VALUES
    ('a1a1a1a1-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001',
     'admin@demo.orionops.local', 'Alice', 'Admin', 'Alice Admin',
     'IT Operations', 'Platform Administrator', 'active'),

    ('a1a1a1a1-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001',
     'agent@demo.orionops.local', 'Bob', 'Agent', 'Bob Agent',
     'Service Desk', 'Service Desk Agent', 'active'),

    ('a1a1a1a1-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000001',
     'engineer@demo.orionops.local', 'Carol', 'Engineer', 'Carol Engineer',
     'Infrastructure', 'Resolver Engineer', 'active'),

    ('a1a1a1a1-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000001',
     'changemgr@demo.orionops.local', 'Dave', 'ChangeMgr', 'Dave ChangeMgr',
     'Change Management', 'Change Manager', 'active'),

    ('a1a1a1a1-1111-1111-1111-111111111105', '00000000-0000-0000-0000-000000000001',
     'sandbox@demo.orionops.local', 'Sam', 'Sandbox', 'Sam Sandbox',
     'IT Operations', 'Sandbox User', 'active');

-- ROLES (7 rows)
INSERT INTO roles (id, tenant_id, name, description, is_system)
VALUES
    (sandbox_uuid('role_admin'),           '00000000-0000-0000-0000-000000000001', 'admin',                'Full platform administrator',         true),
    (sandbox_uuid('role_agent'),           '00000000-0000-0000-0000-000000000001', 'service_desk_agent',   'Service desk first-line support',     true),
    (sandbox_uuid('role_engineer'),        '00000000-0000-0000-0000-000000000001', 'resolver_engineer',    'Technical resolver and escalation',   true),
    (sandbox_uuid('role_changemgr'),       '00000000-0000-0000-0000-000000000001', 'change_manager',       'Change advisory board member',        true),
    (sandbox_uuid('role_service_owner'),   '00000000-0000-0000-0000-000000000001', 'service_owner',        'Business service owner',              true),
    (sandbox_uuid('role_viewer'),          '00000000-0000-0000-0000-000000000001', 'viewer',               'Read-only access to all modules',     true),
    (sandbox_uuid('role_finance_manager'), '00000000-0000-0000-0000-000000000001', 'finance_manager',      'Financial module full access',        true);

-- PERMISSIONS (~60 rows)
INSERT INTO permissions (id, name, resource, action, description) VALUES
    -- Incidents
    (sandbox_uuid('perm_incident_create'), 'incident:create', 'incident', 'create', 'Create new incidents'),
    (sandbox_uuid('perm_incident_read'),   'incident:read',   'incident', 'read',   'View incident details'),
    (sandbox_uuid('perm_incident_update'), 'incident:update', 'incident', 'update', 'Update incident fields'),
    (sandbox_uuid('perm_incident_delete'), 'incident:delete', 'incident', 'delete', 'Delete incidents'),
    -- Problems
    (sandbox_uuid('perm_problem_create'), 'problem:create', 'problem', 'create', 'Create problem records'),
    (sandbox_uuid('perm_problem_read'),   'problem:read',   'problem', 'read',   'View problem details'),
    (sandbox_uuid('perm_problem_update'), 'problem:update', 'problem', 'update', 'Update problem records'),
    (sandbox_uuid('perm_problem_delete'), 'problem:delete', 'problem', 'delete', 'Delete problem records'),
    -- Change Requests
    (sandbox_uuid('perm_change_create'), 'change_request:create', 'change_request', 'create', 'Create change requests'),
    (sandbox_uuid('perm_change_read'),   'change_request:read',   'change_request', 'read',   'View change requests'),
    (sandbox_uuid('perm_change_update'), 'change_request:update', 'change_request', 'update', 'Update change requests'),
    (sandbox_uuid('perm_change_delete'), 'change_request:delete', 'change_request', 'delete', 'Delete change requests'),
    (sandbox_uuid('perm_change_approve'),'change_request:approve','change_request', 'approve','Approve change requests'),
    -- Service Requests
    (sandbox_uuid('perm_sr_create'), 'service_request:create', 'service_request', 'create', 'Submit service requests'),
    (sandbox_uuid('perm_sr_read'),   'service_request:read',   'service_request', 'read',   'View service requests'),
    (sandbox_uuid('perm_sr_update'), 'service_request:update', 'service_request', 'update', 'Update service requests'),
    (sandbox_uuid('perm_sr_delete'), 'service_request:delete', 'service_request', 'delete', 'Delete service requests'),
    -- CMDB
    (sandbox_uuid('perm_cmdb_create'), 'cmdb:create', 'cmdb', 'create', 'Create CIs'),
    (sandbox_uuid('perm_cmdb_read'),   'cmdb:read',   'cmdb', 'read',   'View CIs'),
    (sandbox_uuid('perm_cmdb_update'), 'cmdb:update', 'cmdb', 'update', 'Update CIs'),
    (sandbox_uuid('perm_cmdb_delete'), 'cmdb:delete', 'cmdb', 'delete', 'Delete CIs'),
    -- SLA
    (sandbox_uuid('perm_sla_create'), 'sla:create', 'sla', 'create', 'Create SLA definitions'),
    (sandbox_uuid('perm_sla_read'),   'sla:read',   'sla', 'read',   'View SLA data'),
    (sandbox_uuid('perm_sla_update'), 'sla:update', 'sla', 'update', 'Update SLA definitions'),
    -- Knowledge
    (sandbox_uuid('perm_kb_create'),  'knowledge:create',  'knowledge', 'create',  'Create knowledge articles'),
    (sandbox_uuid('perm_kb_read'),    'knowledge:read',    'knowledge', 'read',    'View knowledge articles'),
    (sandbox_uuid('perm_kb_update'),  'knowledge:update',  'knowledge', 'update',  'Update knowledge articles'),
    (sandbox_uuid('perm_kb_publish'), 'knowledge:publish', 'knowledge', 'publish', 'Publish knowledge articles'),
    -- Workflow
    (sandbox_uuid('perm_wf_create'), 'workflow:create', 'workflow', 'create', 'Create workflow definitions'),
    (sandbox_uuid('perm_wf_read'),   'workflow:read',   'workflow', 'read',   'View workflows'),
    (sandbox_uuid('perm_wf_update'), 'workflow:update', 'workflow', 'update', 'Update workflows'),
    -- Finance
    (sandbox_uuid('perm_finance_create'), 'finance:create', 'finance', 'create', 'Create financial records'),
    (sandbox_uuid('perm_finance_read'),   'finance:read',   'finance', 'read',   'View financial data'),
    (sandbox_uuid('perm_finance_update'), 'finance:update', 'finance', 'update', 'Update financial records'),
    (sandbox_uuid('perm_finance_approve'),'finance:approve','finance', 'approve','Approve financial records'),
    -- Procurement
    (sandbox_uuid('perm_proc_create'),  'procurement:create',  'procurement', 'create',  'Create purchase requests'),
    (sandbox_uuid('perm_proc_read'),    'procurement:read',    'procurement', 'read',    'View procurement data'),
    (sandbox_uuid('perm_proc_update'),  'procurement:update',  'procurement', 'update',  'Update purchase requests'),
    (sandbox_uuid('perm_proc_approve'), 'procurement:approve', 'procurement', 'approve', 'Approve purchase requests'),
    -- Inventory
    (sandbox_uuid('perm_inv_create'), 'inventory:create', 'inventory', 'create', 'Add inventory items'),
    (sandbox_uuid('perm_inv_read'),   'inventory:read',   'inventory', 'read',   'View inventory'),
    (sandbox_uuid('perm_inv_update'), 'inventory:update', 'inventory', 'update', 'Update inventory'),
    -- Vendor
    (sandbox_uuid('perm_vendor_create'), 'vendor:create', 'vendor', 'create', 'Add vendors'),
    (sandbox_uuid('perm_vendor_read'),   'vendor:read',   'vendor', 'read',   'View vendors'),
    (sandbox_uuid('perm_vendor_update'), 'vendor:update', 'vendor', 'update', 'Update vendor records'),
    -- Workforce
    (sandbox_uuid('perm_workforce_create'), 'workforce:create', 'workforce', 'create', 'Add employees'),
    (sandbox_uuid('perm_workforce_read'),   'workforce:read',   'workforce', 'read',   'View workforce data'),
    (sandbox_uuid('perm_workforce_update'), 'workforce:update', 'workforce', 'update', 'Update employee records'),
    -- Billing
    (sandbox_uuid('perm_billing_create'), 'billing:create', 'billing', 'create', 'Create billing records'),
    (sandbox_uuid('perm_billing_read'),   'billing:read',   'billing', 'read',   'View billing data'),
    (sandbox_uuid('perm_billing_update'), 'billing:update', 'billing', 'update', 'Update billing records'),
    -- Tenant
    (sandbox_uuid('perm_tenant_read'),   'tenant:read',   'tenant', 'read',   'View tenant settings'),
    (sandbox_uuid('perm_tenant_update'), 'tenant:update', 'tenant', 'update', 'Update tenant settings'),
    (sandbox_uuid('perm_tenant_manage'), 'tenant:manage', 'tenant', 'manage', 'Manage tenant users and roles'),
    -- Integration
    (sandbox_uuid('perm_integration_read'),   'integration:read',   'integration', 'read',   'View integrations'),
    (sandbox_uuid('perm_integration_manage'), 'integration:manage', 'integration', 'manage', 'Manage integrations'),
    -- Audit
    (sandbox_uuid('perm_audit_read'), 'audit:read', 'audit', 'read', 'View audit logs'),
    -- Notification
    (sandbox_uuid('perm_notification_read'),   'notification:read',   'notification', 'read',   'View notifications'),
    (sandbox_uuid('perm_notification_manage'), 'notification:manage', 'notification', 'manage', 'Manage notification settings'),
    -- Search
    (sandbox_uuid('perm_search_read'), 'search:read', 'search', 'read', 'Use full-text search');

-- ROLE_PERMISSIONS
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT sandbox_uuid('role_admin'), id FROM permissions;

-- service_desk_agent: incident (all), sr (all), kb (read), cmdb (read), sla (read), notification (read), search
INSERT INTO role_permissions (role_id, permission_id)
SELECT sandbox_uuid('role_agent'), id FROM permissions
WHERE name IN (
    'incident:create','incident:read','incident:update',
    'service_request:create','service_request:read','service_request:update',
    'knowledge:read','cmdb:read','sla:read',
    'notification:read','search:read'
);

-- resolver_engineer: incident (all), problem (all), cmdb (all), kb (all), change (read/update), sla (read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT sandbox_uuid('role_engineer'), id FROM permissions
WHERE name IN (
    'incident:create','incident:read','incident:update','incident:delete',
    'problem:create','problem:read','problem:update','problem:delete',
    'cmdb:create','cmdb:read','cmdb:update',
    'knowledge:create','knowledge:read','knowledge:update','knowledge:publish',
    'change_request:read','change_request:update',
    'sla:read','notification:read','search:read'
);

-- change_manager: change (all + approve), incident (read/update), problem (read), workflow (all), kb (read), cmdb (read)
INSERT INTO role_permissions (role_id, permission_id)
SELECT sandbox_uuid('role_changemgr'), id FROM permissions
WHERE name IN (
    'change_request:create','change_request:read','change_request:update','change_request:delete','change_request:approve',
    'incident:read','incident:update',
    'problem:read',
    'workflow:create','workflow:read','workflow:update',
    'knowledge:read','cmdb:read','sla:read','notification:read','search:read'
);

-- service_owner: read across itsm modules + billing/finance read
INSERT INTO role_permissions (role_id, permission_id)
SELECT sandbox_uuid('role_service_owner'), id FROM permissions
WHERE name IN (
    'incident:read','problem:read','change_request:read','service_request:read',
    'cmdb:read','sla:read','knowledge:read','billing:read','finance:read',
    'notification:read','search:read'
);

-- viewer: read-only across all modules
INSERT INTO role_permissions (role_id, permission_id)
SELECT sandbox_uuid('role_viewer'), id FROM permissions
WHERE action = 'read';

-- finance_manager: finance + billing + procurement + vendor + inventory full access
INSERT INTO role_permissions (role_id, permission_id)
SELECT sandbox_uuid('role_finance_manager'), id FROM permissions
WHERE resource IN ('finance','billing','procurement','vendor','inventory')
   OR name IN ('notification:read','search:read','tenant:read');

-- USER_ROLES
INSERT INTO user_roles (user_id, role_id) VALUES
    ('a1a1a1a1-1111-1111-1111-111111111101', sandbox_uuid('role_admin')),
    ('a1a1a1a1-1111-1111-1111-111111111102', sandbox_uuid('role_agent')),
    ('a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('role_engineer')),
    ('a1a1a1a1-1111-1111-1111-111111111104', sandbox_uuid('role_changemgr')),
    -- sandbox gets 4 roles
    ('a1a1a1a1-1111-1111-1111-111111111105', sandbox_uuid('role_admin')),
    ('a1a1a1a1-1111-1111-1111-111111111105', sandbox_uuid('role_agent')),
    ('a1a1a1a1-1111-1111-1111-111111111105', sandbox_uuid('role_engineer')),
    ('a1a1a1a1-1111-1111-1111-111111111105', sandbox_uuid('role_changemgr'));

-- GROUPS (5 rows)
INSERT INTO groups (id, tenant_id, name, description, group_type)
VALUES
    (sandbox_uuid('group_it_ops'),      '00000000-0000-0000-0000-000000000001', 'IT Operations',    'Day-to-day IT operations and service desk',           'team'),
    (sandbox_uuid('group_dev'),         '00000000-0000-0000-0000-000000000001', 'Development',      'Software development and engineering team',           'team'),
    (sandbox_uuid('group_infra'),       '00000000-0000-0000-0000-000000000001', 'Infrastructure',   'Infrastructure, networking, and systems team',        'team'),
    (sandbox_uuid('group_security'),    '00000000-0000-0000-0000-000000000001', 'Security',         'Information security and compliance team',            'team'),
    (sandbox_uuid('group_management'),  '00000000-0000-0000-0000-000000000001', 'Management',       'Leadership and management team',                      'department');

-- USER_GROUPS
INSERT INTO user_groups (user_id, group_id) VALUES
    ('a1a1a1a1-1111-1111-1111-111111111101', sandbox_uuid('group_management')),
    ('a1a1a1a1-1111-1111-1111-111111111101', sandbox_uuid('group_it_ops')),
    ('a1a1a1a1-1111-1111-1111-111111111102', sandbox_uuid('group_it_ops')),
    ('a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('group_infra')),
    ('a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('group_dev')),
    ('a1a1a1a1-1111-1111-1111-111111111104', sandbox_uuid('group_management')),
    ('a1a1a1a1-1111-1111-1111-111111111105', sandbox_uuid('group_it_ops')),
    ('a1a1a1a1-1111-1111-1111-111111111105', sandbox_uuid('group_security'));

-- ============================================================================
-- PHASE B — ITSM DATA
-- ============================================================================

-- SERVICES (8 rows)
INSERT INTO services (id, tenant_id, name, description, service_type, owner_id, status, criticality)
VALUES
    (sandbox_uuid('svc_email'),      '00000000-0000-0000-0000-000000000001', 'Email Service',          'Corporate email platform (Microsoft 365)',         'business',  'a1a1a1a1-1111-1111-1111-111111111101', 'active', 'critical'),
    (sandbox_uuid('svc_vpn'),        '00000000-0000-0000-0000-000000000001', 'VPN Service',            'Remote access VPN for employees',                  'technical', 'a1a1a1a1-1111-1111-1111-111111111103', 'active', 'high'),
    (sandbox_uuid('svc_webapp'),     '00000000-0000-0000-0000-000000000001', 'Web Application',        'Customer-facing web application',                  'business',  'a1a1a1a1-1111-1111-1111-111111111101', 'active', 'critical'),
    (sandbox_uuid('svc_db'),         '00000000-0000-0000-0000-000000000001', 'Database Service',       'Managed PostgreSQL database clusters',             'technical', 'a1a1a1a1-1111-1111-1111-111111111103', 'active', 'critical'),
    (sandbox_uuid('svc_storage'),    '00000000-0000-0000-0000-000000000001', 'File Storage',           'Shared file storage and document management',      'supporting','a1a1a1a1-1111-1111-1111-111111111103', 'active', 'medium'),
    (sandbox_uuid('svc_iam'),        '00000000-0000-0000-0000-000000000001', 'IAM',                    'Identity and access management (Keycloak)',        'technical', 'a1a1a1a1-1111-1111-1111-111111111101', 'active', 'critical'),
    (sandbox_uuid('svc_monitoring'), '00000000-0000-0000-0000-000000000001', 'Monitoring & Alerting',  'Infrastructure monitoring and alerting (Prometheus/Grafana)', 'supporting', 'a1a1a1a1-1111-1111-1111-111111111103', 'active', 'high'),
    (sandbox_uuid('svc_cicd'),       '00000000-0000-0000-0000-000000000001', 'CI/CD Pipeline',         'Continuous integration and deployment pipelines',  'supporting','a1a1a1a1-1111-1111-1111-111111111103', 'active', 'medium');

-- CONFIGURATION_ITEMS (12 rows)
INSERT INTO configuration_items (id, tenant_id, name, ci_type, description, environment, owner_id, service_id, attributes, status)
VALUES
    (sandbox_uuid('ci_prod_web_01'), '00000000-0000-0000-0000-000000000001', 'PROD-WEB-01', 'server', 'Primary production web server', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_webapp'),
     '{"ip": "10.0.1.10", "os": "Ubuntu 22.04", "cpu": "8 vCPU", "ram": "32GB", "disk": "500GB SSD"}', 'active'),

    (sandbox_uuid('ci_prod_web_02'), '00000000-0000-0000-0000-000000000001', 'PROD-WEB-02', 'server', 'Secondary production web server', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_webapp'),
     '{"ip": "10.0.1.11", "os": "Ubuntu 22.04", "cpu": "8 vCPU", "ram": "32GB", "disk": "500GB SSD"}', 'active'),

    (sandbox_uuid('ci_prod_db_01'), '00000000-0000-0000-0000-000000000001', 'PROD-DB-01', 'database', 'Primary PostgreSQL production database', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_db'),
     '{"ip": "10.0.2.10", "version": "15.4", "engine": "PostgreSQL", "storage": "2TB NVMe", "replication": "synchronous"}', 'active'),

    (sandbox_uuid('ci_prod_db_02'), '00000000-0000-0000-0000-000000000001', 'PROD-DB-02', 'database', 'Read replica PostgreSQL database', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_db'),
     '{"ip": "10.0.2.11", "version": "15.4", "engine": "PostgreSQL", "storage": "2TB NVMe", "replication": "async_replica"}', 'active'),

    (sandbox_uuid('ci_prod_app_01'), '00000000-0000-0000-0000-000000000001', 'PROD-APP-01', 'application', 'Java Spring Boot application server', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_webapp'),
     '{"ip": "10.0.1.20", "java_version": "21", "heap": "8GB", "port": 8080, "instances": 3}', 'active'),

    (sandbox_uuid('ci_stg_web_01'), '00000000-0000-0000-0000-000000000001', 'STG-WEB-01', 'server', 'Staging web server', 'staging', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_webapp'),
     '{"ip": "10.1.1.10", "os": "Ubuntu 22.04", "cpu": "4 vCPU", "ram": "16GB"}', 'active'),

    (sandbox_uuid('ci_network_sw_01'), '00000000-0000-0000-0000-000000000001', 'NETWORK-SW-01', 'network_device', 'Core network switch', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_vpn'),
     '{"ip": "10.0.0.1", "model": "Cisco Catalyst 9300", "ports": 48, "uplink": "10GbE"}', 'active'),

    (sandbox_uuid('ci_prod_lb_01'), '00000000-0000-0000-0000-000000000001', 'PROD-LB-01', 'network_device', 'Production load balancer (HAProxy)', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_webapp'),
     '{"ip": "10.0.0.5", "type": "HAProxy", "algorithm": "round_robin", "ssl_termination": true}', 'active'),

    (sandbox_uuid('ci_dev_app_01'), '00000000-0000-0000-0000-000000000001', 'DEV-APP-01', 'application', 'Development application server', 'development', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_webapp'),
     '{"ip": "10.2.1.20", "java_version": "21", "heap": "4GB", "port": 8080}', 'active'),

    (sandbox_uuid('ci_backup_srv_01'), '00000000-0000-0000-0000-000000000001', 'BACKUP-SRV-01', 'server', 'Backup and recovery server', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_storage'),
     '{"ip": "10.0.3.10", "os": "Ubuntu 22.04", "storage": "20TB RAID6", "backup_software": "Veeam"}', 'active'),

    (sandbox_uuid('ci_vpn_gw_01'), '00000000-0000-0000-0000-000000000001', 'VPN-GW-01', 'network_device', 'VPN gateway appliance', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_vpn'),
     '{"ip": "203.0.113.1", "model": "Palo Alto PA-3260", "tunnels": 500, "throughput": "10Gbps"}', 'active'),

    (sandbox_uuid('ci_monitor_01'), '00000000-0000-0000-0000-000000000001', 'MONITOR-01', 'application', 'Monitoring stack (Prometheus + Grafana)', 'production', 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('svc_monitoring'),
     '{"ip": "10.0.4.10", "prometheus_version": "2.47", "grafana_version": "10.2", "retention_days": 90}', 'active');

-- CI_RELATIONSHIPS (~15 rows)
INSERT INTO ci_relationships (id, source_ci_id, target_ci_id, relationship_type, description)
VALUES
    (sandbox_uuid('cir_lb_web1'),    sandbox_uuid('ci_prod_lb_01'),   sandbox_uuid('ci_prod_web_01'),   'connects_to',  'Load balancer routes to web server 1'),
    (sandbox_uuid('cir_lb_web2'),    sandbox_uuid('ci_prod_lb_01'),   sandbox_uuid('ci_prod_web_02'),   'connects_to',  'Load balancer routes to web server 2'),
    (sandbox_uuid('cir_web1_app'),   sandbox_uuid('ci_prod_web_01'),  sandbox_uuid('ci_prod_app_01'),   'depends_on',   'Web server proxies to app server'),
    (sandbox_uuid('cir_web2_app'),   sandbox_uuid('ci_prod_web_02'),  sandbox_uuid('ci_prod_app_01'),   'depends_on',   'Web server proxies to app server'),
    (sandbox_uuid('cir_app_db1'),    sandbox_uuid('ci_prod_app_01'),  sandbox_uuid('ci_prod_db_01'),    'depends_on',   'Application uses primary database'),
    (sandbox_uuid('cir_db1_db2'),    sandbox_uuid('ci_prod_db_01'),   sandbox_uuid('ci_prod_db_02'),    'contains',     'Primary replicates to read replica'),
    (sandbox_uuid('cir_app_vpn'),    sandbox_uuid('ci_prod_app_01'),  sandbox_uuid('ci_vpn_gw_01'),     'connects_to',  'App connects through VPN for remote users'),
    (sandbox_uuid('cir_sw_lb'),      sandbox_uuid('ci_network_sw_01'),sandbox_uuid('ci_prod_lb_01'),    'hosts',        'Switch hosts load balancer traffic'),
    (sandbox_uuid('cir_sw_web1'),    sandbox_uuid('ci_network_sw_01'),sandbox_uuid('ci_prod_web_01'),   'hosts',        'Switch hosts web server 1'),
    (sandbox_uuid('cir_sw_web2'),    sandbox_uuid('ci_network_sw_01'),sandbox_uuid('ci_prod_web_02'),   'hosts',        'Switch hosts web server 2'),
    (sandbox_uuid('cir_mon_web1'),   sandbox_uuid('ci_monitor_01'),   sandbox_uuid('ci_prod_web_01'),   'connects_to',  'Monitoring polls web server 1 metrics'),
    (sandbox_uuid('cir_mon_db1'),    sandbox_uuid('ci_monitor_01'),   sandbox_uuid('ci_prod_db_01'),    'connects_to',  'Monitoring polls database metrics'),
    (sandbox_uuid('cir_bkp_db1'),    sandbox_uuid('ci_backup_srv_01'),sandbox_uuid('ci_prod_db_01'),    'contains',     'Backup server stores database backups'),
    (sandbox_uuid('cir_stg_db'),     sandbox_uuid('ci_stg_web_01'),   sandbox_uuid('ci_prod_db_02'),    'depends_on',   'Staging uses read replica for testing'),
    (sandbox_uuid('cir_dev_stg'),    sandbox_uuid('ci_dev_app_01'),   sandbox_uuid('ci_stg_web_01'),    'depends_on',   'Dev environment mirrors staging setup');

-- INCIDENTS (10 rows)
INSERT INTO incidents (id, tenant_id, incident_number, title, description, status, priority, impact, urgency, category, subcategory, service_id, ci_id, reporter_id, assignee_id, assignment_group_id, parent_incident_id, resolution_code, resolution_notes, resolved_at, closed_at)
VALUES
    -- INC-001: open, critical — parent incident
    (sandbox_uuid('inc_001'), '00000000-0000-0000-0000-000000000001', 'INC-001',
     'Production database unreachable — full outage',
     'PROD-DB-01 is not responding to connections. Multiple application errors reported. All production services affected.',
     'open', 'critical', 'high', 'high', 'infrastructure', 'database',
     sandbox_uuid('svc_db'), sandbox_uuid('ci_prod_db_01'),
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_infra'), NULL, NULL, NULL, NULL, NULL),

    -- INC-002: open, high — child of INC-001
    (sandbox_uuid('inc_002'), '00000000-0000-0000-0000-000000000001', 'INC-002',
     'Web application returning 502 errors due to DB outage',
     'Downstream effect of INC-001. Web app cannot process requests. Users receiving 502 Bad Gateway.',
     'open', 'high', 'high', 'high', 'application', 'web_service',
     sandbox_uuid('svc_webapp'), sandbox_uuid('ci_prod_web_01'),
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111102',
     sandbox_uuid('group_it_ops'), sandbox_uuid('inc_001'), NULL, NULL, NULL, NULL),

    -- INC-003: in_progress, high
    (sandbox_uuid('inc_003'), '00000000-0000-0000-0000-000000000001', 'INC-003',
     'VPN connectivity issues for remote workers',
     'Multiple remote employees reporting intermittent VPN disconnections since 08:00 UTC. Approximately 30 users affected.',
     'in_progress', 'high', 'medium', 'high', 'network', 'vpn',
     sandbox_uuid('svc_vpn'), sandbox_uuid('ci_vpn_gw_01'),
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_infra'), NULL, NULL, NULL, NULL, NULL),

    -- INC-004: in_progress, medium
    (sandbox_uuid('inc_004'), '00000000-0000-0000-0000-000000000001', 'INC-004',
     'Email delivery delays — messages queued',
     'Users reporting emails are queued and not delivered. Issue started approximately 2 hours ago.',
     'in_progress', 'medium', 'medium', 'medium', 'communication', 'email',
     sandbox_uuid('svc_email'), NULL,
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111102',
     sandbox_uuid('group_it_ops'), NULL, NULL, NULL, NULL, NULL),

    -- INC-005: on_hold, medium
    (sandbox_uuid('inc_005'), '00000000-0000-0000-0000-000000000001', 'INC-005',
     'CI/CD pipeline intermittently failing on deploy stage',
     'Deployment pipeline fails with timeout error on the deploy-to-prod stage. Occurs roughly 1 in 3 runs.',
     'on_hold', 'medium', 'low', 'medium', 'devops', 'cicd',
     sandbox_uuid('svc_cicd'), NULL,
     'a1a1a1a1-1111-1111-1111-111111111103', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_dev'), NULL, NULL, NULL, NULL, NULL),

    -- INC-006: resolved, high
    (sandbox_uuid('inc_006'), '00000000-0000-0000-0000-000000000001', 'INC-006',
     'Monitoring alerts — disk usage critical on PROD-DB-01',
     'Disk usage on PROD-DB-01 exceeded 90% threshold. Alert triggered. Auto-archival of old logs initiated.',
     'resolved', 'high', 'medium', 'high', 'infrastructure', 'storage',
     sandbox_uuid('svc_db'), sandbox_uuid('ci_prod_db_01'),
     'a1a1a1a1-1111-1111-1111-111111111103', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_infra'), NULL, 'resolved_by_workaround',
     'Cleared 150GB of archived WAL segments. Permanent fix: increase disk or implement automated archival.',
     NOW() - INTERVAL '2 days', NULL),

    -- INC-007: resolved, low
    (sandbox_uuid('inc_007'), '00000000-0000-0000-0000-000000000001', 'INC-007',
     'User unable to reset password via self-service portal',
     'Single user reporting password reset email not received. Investigated: email was in spam folder.',
     'resolved', 'low', 'low', 'low', 'access_management', 'password',
     sandbox_uuid('svc_iam'), NULL,
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111102',
     sandbox_uuid('group_it_ops'), NULL, 'resolved_by_user',
     'User found reset email in spam. Recommended allowlisting the sender domain.',
     NOW() - INTERVAL '5 days', NULL),

    -- INC-008: closed, critical
    (sandbox_uuid('inc_008'), '00000000-0000-0000-0000-000000000001', 'INC-008',
     'Complete network outage — core switch failure',
     'NETWORK-SW-01 suffered a hardware failure causing a complete network outage lasting 45 minutes.',
     'closed', 'critical', 'high', 'high', 'network', 'hardware',
     sandbox_uuid('svc_webapp'), sandbox_uuid('ci_network_sw_01'),
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_infra'), NULL, 'resolved_permanently',
     'Replaced failed switch module. Network restored. Root cause: hardware fault in power supply unit.',
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),

    -- INC-009: closed, medium
    (sandbox_uuid('inc_009'), '00000000-0000-0000-0000-000000000001', 'INC-009',
     'File storage latency — slow file access reported',
     'Multiple users reported slow access to shared file storage. Investigation found a misconfigured NFS export.',
     'closed', 'medium', 'medium', 'medium', 'storage', 'file_system',
     sandbox_uuid('svc_storage'), sandbox_uuid('ci_backup_srv_01'),
     'a1a1a1a1-1111-1111-1111-111111111102', 'a1a1a1a1-1111-1111-1111-111111111103',
     sandbox_uuid('group_infra'), NULL, 'resolved_permanently',
     'Fixed NFS export configuration. Performance restored. Latency improved from 2s to <50ms.',
     NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),

    -- INC-010: cancelled, low
    (sandbox_uuid('inc_010'), '00000000-0000-0000-0000-000000000001', 'INC-010',
     'Reported: monitoring dashboard not loading',
     'User reported MONITOR-01 dashboard unavailable. Investigation found it was a browser cache issue.',
     'cancelled', 'low', 'low', 'low', 'application', 'monitoring',
     sandbox_uuid('svc_monitoring'), sandbox_uuid('ci_monitor_01'),
     'a1a1a1a1-1111-1111-1111-111111111102', NULL,
     sandbox_uuid('group_it_ops'), NULL, NULL, NULL, NULL, NULL);

-- PROBLEMS (5 rows)
INSERT INTO problems (id, tenant_id, problem_number, title, description, status, priority, category, root_cause, workaround, known_error, service_id, assignee_id)
VALUES
    (sandbox_uuid('prb_001'), '00000000-0000-0000-0000-000000000001', 'PRB-001',
     'Recurring database connection pool exhaustion',
     'PROD-DB-01 regularly exhausts connection pool during peak hours causing cascading incidents. Linked to INC-001.',
     'open', 'critical', 'infrastructure',
     NULL, 'Increase connection pool size in application config as temporary measure.', false,
     sandbox_uuid('svc_db'), 'a1a1a1a1-1111-1111-1111-111111111103'),

    (sandbox_uuid('prb_002'), '00000000-0000-0000-0000-000000000001', 'PRB-002',
     'VPN gateway certificate renewal causing brief disconnections',
     'Investigation into recurring VPN disconnections (INC-003) identified that certificate auto-renewal restarts the VPN daemon.',
     'under_investigation', 'high', 'network',
     NULL, 'Schedule maintenance window for certificate renewal outside peak hours.', false,
     sandbox_uuid('svc_vpn'), 'a1a1a1a1-1111-1111-1111-111111111103'),

    (sandbox_uuid('prb_003'), '00000000-0000-0000-0000-000000000001', 'PRB-003',
     'Email relay misconfiguration causing delivery delays',
     'Root cause identified: SMTP relay is configured with a single upstream MX server. Failover is not configured.',
     'root_cause_identified', 'medium', 'communication',
     'Single upstream MX relay without failover. When the upstream is slow, all mail queues.',
     'Monitor relay queue and escalate to cloud provider if queue depth exceeds 1000.', true,
     sandbox_uuid('svc_email'), 'a1a1a1a1-1111-1111-1111-111111111102'),

    (sandbox_uuid('prb_004'), '00000000-0000-0000-0000-000000000001', 'PRB-004',
     'Network switch hardware aging causing periodic failures',
     'Core switch NETWORK-SW-01 is end-of-life. Hardware failures are increasing in frequency.',
     'resolved', 'high', 'network',
     'Switch hardware is EoL (Cisco Catalyst 9300, manufactured 2017). Power supply module failed due to age.',
     'No workaround available — hardware replacement is the only option.',
     true, sandbox_uuid('svc_webapp'), 'a1a1a1a1-1111-1111-1111-111111111103'),

    (sandbox_uuid('prb_005'), '00000000-0000-0000-0000-000000000001', 'PRB-005',
     'Storage capacity planning gap causing reactive incidents',
     'Lack of proactive capacity management led to disk full alert on PROD-DB-01 (INC-006).',
     'closed', 'medium', 'infrastructure',
     'No automated capacity forecasting. Disk alerts only trigger at 90% usage — too late for graceful response.',
     'Manual weekly capacity reviews by infrastructure team until automated solution in place.',
     false, sandbox_uuid('svc_db'), 'a1a1a1a1-1111-1111-1111-111111111103');

-- CHANGE_REQUESTS (6 rows)
INSERT INTO change_requests (id, tenant_id, change_number, title, description, change_type, status, risk_level, impact_level, reason, implementation_plan, rollback_plan, test_plan, service_id, requester_id, assignee_id, scheduled_start, scheduled_end, implemented_at)
VALUES
    (sandbox_uuid('chg_001'), '00000000-0000-0000-0000-000000000001', 'CHG-001',
     'Deploy application version 2.4.1 — standard monthly release',
     'Monthly standard release including 12 bug fixes and 3 minor feature enhancements.',
     'standard', 'implemented', 'low', 'low',
     'Scheduled monthly release cycle. All changes reviewed and tested in staging.',
     '1. Tag release in Git. 2. CI/CD pipeline builds Docker image. 3. Rolling deploy to PROD-APP-01. 4. Smoke tests. 5. Monitor for 30 minutes.',
     '1. Revert Git tag. 2. Redeploy previous image v2.4.0. 3. Verify smoke tests pass.',
     '1. Run full regression suite in staging. 2. Load test for 15 minutes. 3. Security scan.',
     sandbox_uuid('svc_webapp'), 'a1a1a1a1-1111-1111-1111-111111111103', 'a1a1a1a1-1111-1111-1111-111111111103',
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 hours',
     NOW() - INTERVAL '7 days' + INTERVAL '1 hour 45 minutes'),

    (sandbox_uuid('chg_002'), '00000000-0000-0000-0000-000000000001', 'CHG-002',
     'Rotate TLS certificates on production load balancer',
     'Annual TLS certificate rotation on PROD-LB-01. Certificates expire in 30 days.',
     'standard', 'closed', 'low', 'low',
     'Certificate expiry. Proactive rotation to prevent service disruption.',
     '1. Generate new CSR. 2. Submit to CA and receive signed cert. 3. Stage cert on LB. 4. Cut over at maintenance window. 5. Verify HTTPS.',
     '1. Restore previous certificate from vault. 2. Restart HAProxy with old cert.',
     '1. Verify new cert chain. 2. Test HTTPS from multiple clients. 3. Check cert expiry date.',
     sandbox_uuid('svc_webapp'), 'a1a1a1a1-1111-1111-1111-111111111104', 'a1a1a1a1-1111-1111-1111-111111111103',
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour',
     NOW() - INTERVAL '30 days' + INTERVAL '50 minutes'),

    (sandbox_uuid('chg_003'), '00000000-0000-0000-0000-000000000001', 'CHG-003',
     'Upgrade PostgreSQL from 15.4 to 15.6 on PROD-DB-01',
     'Minor version upgrade to address security CVEs and performance improvements.',
     'normal', 'approved', 'medium', 'medium',
     'CVE-2024-7348 and CVE-2024-10978 affect PostgreSQL 15.4. Upgrade required for compliance.',
     '1. Take full snapshot backup. 2. Apply pg_upgrade in place during maintenance window. 3. Restart service. 4. Run ANALYZE. 5. Verify replication health.',
     '1. Restore from snapshot backup. 2. Verify replication. 3. Notify stakeholders of extended outage.',
     '1. Run regression test suite against staging with 15.6. 2. Performance benchmark comparison. 3. Replication lag test.',
     sandbox_uuid('svc_db'), 'a1a1a1a1-1111-1111-1111-111111111104', 'a1a1a1a1-1111-1111-1111-111111111103',
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '4 hours', NULL),

    (sandbox_uuid('chg_004'), '00000000-0000-0000-0000-000000000001', 'CHG-004',
     'Network switch replacement — NETWORK-SW-01 hardware refresh',
     'Replace end-of-life Cisco Catalyst 9300 with new Catalyst 9300X. Addresses PRB-004.',
     'normal', 'pending_approval', 'high', 'high',
     'Hardware is EoL, causing reliability issues. Replacement required to prevent future outages.',
     '1. Pre-configure new switch in lab. 2. Schedule maintenance window. 3. Hot-swap switch modules. 4. Migrate port configs. 5. Verify connectivity.',
     '1. Reinstall original switch modules. 2. Re-patch network cables.',
     '1. Lab validation of port configs. 2. Traffic simulation test. 3. Failover test with redundant switch.',
     sandbox_uuid('svc_webapp'), 'a1a1a1a1-1111-1111-1111-111111111104', 'a1a1a1a1-1111-1111-1111-111111111103',
     NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '8 hours', NULL),

    (sandbox_uuid('chg_005'), '00000000-0000-0000-0000-000000000001', 'CHG-005',
     'Emergency hotfix — critical SQL injection vulnerability patch',
     'Security team identified an SQL injection vector in the reporting module. Immediate patching required.',
     'emergency', 'scheduled', 'high', 'high',
     'Critical security vulnerability CVE-2026-0042 identified via penetration test. CVSS score 9.8.',
     '1. Apply security patch to staging. 2. Run security scan. 3. Emergency CAB approval. 4. Deploy to production within 4 hours.',
     '1. Rollback to previous version. 2. Apply WAF rule to block exploit vector.',
     '1. DAST scan against patched staging. 2. Verify vulnerable endpoint is no longer exploitable.',
     sandbox_uuid('svc_webapp'), 'a1a1a1a1-1111-1111-1111-111111111104', 'a1a1a1a1-1111-1111-1111-111111111103',
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', NULL),

    (sandbox_uuid('chg_006'), '00000000-0000-0000-0000-000000000001', 'CHG-006',
     'Emergency VPN gateway firmware update — security patch',
     'Critical firmware vulnerability CVE-2026-0089 in VPN-GW-01. Vendor patch available.',
     'emergency', 'draft', 'high', 'medium',
     'Vendor advisory PA-SEC-2026-089 recommends immediate firmware update.',
     '1. Download and verify firmware. 2. Snapshot current config. 3. Apply firmware via console. 4. Verify VPN tunnels.',
     '1. Downgrade firmware. 2. Restore config snapshot.',
     '1. Verify all VPN tunnels re-establish. 2. Test remote access from 5 different locations.',
     sandbox_uuid('svc_vpn'), 'a1a1a1a1-1111-1111-1111-111111111104', 'a1a1a1a1-1111-1111-1111-111111111103',
     NULL, NULL, NULL);

-- SERVICE_REQUESTS (5 rows)
INSERT INTO service_requests (id, tenant_id, request_number, title, description, status, priority, service_id, requester_id, assignee_id)
VALUES
    (sandbox_uuid('sr_001'), '00000000-0000-0000-0000-000000000001', 'SR-001',
     'New laptop request — Dell XPS 15',
     'Requesting a new Dell XPS 15 laptop for onboarding. Current machine is 4 years old and slowing productivity.',
     'approved', 'medium', sandbox_uuid('svc_storage'),
     'a1a1a1a1-1111-1111-1111-111111111105', 'a1a1a1a1-1111-1111-1111-111111111102'),

    (sandbox_uuid('sr_002'), '00000000-0000-0000-0000-000000000001', 'SR-002',
     'VPN access setup for new contractor',
     'New contractor John Smith starting Monday needs VPN access to development environments.',
     'fulfilled', 'high', sandbox_uuid('svc_vpn'),
     'a1a1a1a1-1111-1111-1111-111111111101', 'a1a1a1a1-1111-1111-1111-111111111102'),

    (sandbox_uuid('sr_003'), '00000000-0000-0000-0000-000000000001', 'SR-003',
     'Software installation — JetBrains IntelliJ IDEA Ultimate',
     'Requesting IntelliJ IDEA Ultimate license for Java development work on the backend services.',
     'open', 'medium', sandbox_uuid('svc_cicd'),
     'a1a1a1a1-1111-1111-1111-111111111103', 'a1a1a1a1-1111-1111-1111-111111111102'),

    (sandbox_uuid('sr_004'), '00000000-0000-0000-0000-000000000001', 'SR-004',
     'Database read access for analytics team',
     'Analytics team requires read-only access to the production database replica for reporting.',
     'pending_approval', 'high', sandbox_uuid('svc_db'),
     'a1a1a1a1-1111-1111-1111-111111111101', 'a1a1a1a1-1111-1111-1111-111111111103'),

    (sandbox_uuid('sr_005'), '00000000-0000-0000-0000-000000000001', 'SR-005',
     'Email distribution list creation — dev-team@demo.orionops.local',
     'Create a distribution list for the development team for easier communication.',
     'cancelled', 'low', sandbox_uuid('svc_email'),
     'a1a1a1a1-1111-1111-1111-111111111103', NULL);

-- SLA_DEFINITIONS (4 rows)
INSERT INTO sla_definitions (id, tenant_id, name, description, priority, target_response_minutes, target_resolution_minutes)
VALUES
    (sandbox_uuid('sla_def_critical'), '00000000-0000-0000-0000-000000000001',
     'Critical SLA', 'SLA for critical priority incidents requiring immediate response',
     'critical', 15, 240),

    (sandbox_uuid('sla_def_high'), '00000000-0000-0000-0000-000000000001',
     'High SLA', 'SLA for high priority incidents',
     'high', 30, 480),

    (sandbox_uuid('sla_def_medium'), '00000000-0000-0000-0000-000000000001',
     'Medium SLA', 'SLA for medium priority incidents',
     'medium', 120, 1440),

    (sandbox_uuid('sla_def_low'), '00000000-0000-0000-0000-000000000001',
     'Low SLA', 'SLA for low priority incidents',
     'low', 480, 2880);

-- SLA_INSTANCES (5 rows)
INSERT INTO sla_instances (id, tenant_id, sla_definition_id, entity_type, entity_id, status, response_target_at, resolution_target_at, responded_at, resolved_at, paused_at, total_paused_minutes, breach_notified)
VALUES
    -- active: critical incident INC-001
    (sandbox_uuid('sla_inst_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sla_def_critical'), 'incident', sandbox_uuid('inc_001'),
     'active',
     NOW() - INTERVAL '3 hours' + INTERVAL '15 minutes',
     NOW() - INTERVAL '3 hours' + INTERVAL '4 hours',
     NULL, NULL, NULL, 0, true),

    -- active: high incident INC-003
    (sandbox_uuid('sla_inst_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sla_def_high'), 'incident', sandbox_uuid('inc_003'),
     'active',
     NOW() - INTERVAL '2 hours' + INTERVAL '30 minutes',
     NOW() - INTERVAL '2 hours' + INTERVAL '8 hours',
     NOW() - INTERVAL '1 hour 45 minutes', NULL, NULL, 0, false),

    -- met: resolved incident INC-007
    (sandbox_uuid('sla_inst_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sla_def_low'), 'incident', sandbox_uuid('inc_007'),
     'met',
     NOW() - INTERVAL '5 days' + INTERVAL '8 hours',
     NOW() - INTERVAL '5 days' + INTERVAL '48 hours',
     NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
     NOW() - INTERVAL '5 days' + INTERVAL '6 hours',
     NULL, 0, false),

    -- breached: closed incident INC-008
    (sandbox_uuid('sla_inst_004'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sla_def_critical'), 'incident', sandbox_uuid('inc_008'),
     'breached',
     NOW() - INTERVAL '10 days' + INTERVAL '15 minutes',
     NOW() - INTERVAL '10 days' + INTERVAL '4 hours',
     NOW() - INTERVAL '10 days' + INTERVAL '25 minutes',
     NOW() - INTERVAL '10 days' + INTERVAL '45 minutes',
     NULL, 0, true),

    -- paused: on_hold incident INC-005
    (sandbox_uuid('sla_inst_005'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sla_def_medium'), 'incident', sandbox_uuid('inc_005'),
     'paused',
     NOW() - INTERVAL '1 day' + INTERVAL '2 hours',
     NOW() - INTERVAL '1 day' + INTERVAL '24 hours',
     NOW() - INTERVAL '23 hours',
     NULL,
     NOW() - INTERVAL '20 hours', 180, false);

-- KNOWLEDGE_ARTICLES (6 rows)
INSERT INTO knowledge_articles (id, tenant_id, title, content, article_type, status, category, tags, author_id, reviewer_id, published_at, views, helpful_count)
VALUES
    (sandbox_uuid('kb_001'), '00000000-0000-0000-0000-000000000001',
     'How to reset your VPN password',
     E'# How to Reset Your VPN Password\n\n## Overview\nThis article guides you through resetting your VPN password using the self-service portal.\n\n## Steps\n1. Navigate to https://vpn.demo.orionops.local/reset\n2. Enter your corporate email address\n3. Check your email for the reset link (check spam if not received)\n4. Click the reset link and set a new password\n5. Reconnect your VPN client with the new password\n\n## Common Issues\n- **Email not received**: Check spam folder, or contact the service desk\n- **Reset link expired**: Links are valid for 30 minutes — request a new one\n- **Still cannot connect**: Ensure you are using the correct username format (email address)\n\n## Contact\nService Desk: ext. 1234 | agent@demo.orionops.local',
     'how_to', 'published', 'Access Management',
     ARRAY['vpn', 'password', 'reset', 'access'], 'a1a1a1a1-1111-1111-1111-111111111102',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NOW() - INTERVAL '60 days', 342, 89),

    (sandbox_uuid('kb_002'), '00000000-0000-0000-0000-000000000001',
     'Email configuration guide',
     E'# Email Configuration Guide\n\n## Microsoft 365 Setup\n\n### Desktop (Outlook)\n1. Open Outlook and select **File > Add Account**\n2. Enter your corporate email address\n3. Select **Microsoft 365** when prompted\n4. Authenticate with your SSO credentials\n\n### Mobile (iOS/Android)\n1. Open the Outlook app\n2. Tap **Add Account** and select **Work or School**\n3. Enter your email and follow the prompts\n\n### IMAP Settings (Third-party clients)\n- Server: mail.demo.orionops.local\n- Port: 993 (IMAP/SSL)\n- Port: 587 (SMTP/STARTTLS)\n- Username: your full email address\n\n## Troubleshooting\n- Clear email cache if messages are not syncing\n- Ensure MFA is configured in the IAM portal',
     'how_to', 'published', 'Communication',
     ARRAY['email', 'outlook', 'configuration', 'setup', 'office365'], 'a1a1a1a1-1111-1111-1111-111111111102',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NOW() - INTERVAL '90 days', 215, 64),

    (sandbox_uuid('kb_003'), '00000000-0000-0000-0000-000000000001',
     'Network troubleshooting checklist',
     E'# Network Troubleshooting Checklist\n\n## Basic Connectivity\n- [ ] Check physical cable connection\n- [ ] Verify network adapter is enabled\n- [ ] Run `ping 10.0.0.1` to test gateway\n- [ ] Run `ping 8.8.8.8` to test internet\n- [ ] Check DNS: `nslookup demo.orionops.local`\n\n## Common Issues\n\n### Cannot reach internal resources\n1. Verify you are on the correct VLAN\n2. Check VPN connection status\n3. Confirm firewall rules with infrastructure team\n\n### Slow network performance\n1. Run `iperf3` throughput test to switch\n2. Check switch port utilization in monitoring\n3. Review QoS settings\n\n## Escalation\nIf basic troubleshooting fails, raise an incident with:\n- IP address and hostname\n- Affected systems\n- `traceroute` output',
     'reference', 'published', 'Network',
     ARRAY['network', 'troubleshooting', 'connectivity', 'checklist'], 'a1a1a1a1-1111-1111-1111-111111111103',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NOW() - INTERVAL '45 days', 178, 52),

    (sandbox_uuid('kb_004'), '00000000-0000-0000-0000-000000000001',
     'Server restart procedures',
     E'# Server Restart Procedures\n\n## Pre-Restart Checklist\n- [ ] Notify stakeholders via incident or change request\n- [ ] Verify maintenance window is approved\n- [ ] Take VM snapshot or backup\n- [ ] Drain active connections\n\n## Restart Sequence\n\n### Application Servers\n1. Graceful shutdown: `systemctl stop orionops-backend`\n2. Wait for connections to drain (30 seconds)\n3. Reboot: `sudo reboot`\n4. Verify service restart: `systemctl status orionops-backend`\n\n### Database Servers\n> **WARNING**: Always coordinate with DBA team\n1. Put application in maintenance mode\n2. `pg_ctl stop -m fast`\n3. Reboot OS\n4. Verify PostgreSQL startup and replication health\n\n## Post-Restart Verification\n- Check service health endpoints\n- Verify monitoring alerts clear\n- Update incident or change request',
     'procedure', 'draft', 'Infrastructure',
     ARRAY['server', 'restart', 'procedure', 'maintenance'], 'a1a1a1a1-1111-1111-1111-111111111103',
     NULL, NULL, 23, 8),

    (sandbox_uuid('kb_005'), '00000000-0000-0000-0000-000000000001',
     'Onboarding new employees — IT checklist',
     E'# New Employee IT Onboarding Checklist\n\n## Day 1 — Accounts\n- [ ] Create IAM account in Keycloak\n- [ ] Assign appropriate role (viewer by default)\n- [ ] Set temporary password and require reset on first login\n- [ ] Add to relevant distribution groups\n\n## Day 1 — Equipment\n- [ ] Issue laptop from IT Storage (WH-IT)\n- [ ] Configure MDM enrollment\n- [ ] Install required software\n- [ ] Set up corporate email on device\n\n## Week 1 — Access\n- [ ] VPN certificate provisioned\n- [ ] MFA enrolled\n- [ ] Access to shared file storage granted\n- [ ] ITSM platform account activated\n\n## Manager Responsibilities\n- Submit service request for equipment at least 3 days before start date\n- Review and approve access requests in the ITSM portal\n- Complete 30-day access review',
     'procedure', 'in_review', 'HR',
     ARRAY['onboarding', 'new employee', 'hr', 'checklist', 'access'], 'a1a1a1a1-1111-1111-1111-111111111101',
     'a1a1a1a1-1111-1111-1111-111111111104', NULL, 87, 31),

    (sandbox_uuid('kb_006'), '00000000-0000-0000-0000-000000000001',
     'Backup and recovery procedures',
     E'# Backup and Recovery Procedures\n\n## Backup Schedule\n| System | Frequency | Retention | Location |\n|--------|-----------|-----------|----------|\n| PROD-DB-01 | Every 6 hours | 30 days | BACKUP-SRV-01 |\n| PROD-APP-01 (config) | Daily | 7 days | BACKUP-SRV-01 |\n| File Storage | Daily | 90 days | BACKUP-SRV-01 |\n\n## Recovery Procedures\n\n### Database Point-in-Time Recovery\n1. Identify target recovery point\n2. Stop application servers\n3. `pg_restore -Fc -d orionops backup_YYYYMMDD_HH.dump`\n4. Verify data integrity\n5. Restart application servers\n\n### File Storage Recovery\n1. Identify affected files and recovery point\n2. Use Veeam console to restore to original location\n3. Verify file permissions\n\n## RTO/RPO Targets\n- **PROD-DB-01**: RTO 4 hours, RPO 6 hours\n- **File Storage**: RTO 8 hours, RPO 24 hours',
     'reference', 'archived', 'Infrastructure',
     ARRAY['backup', 'recovery', 'rto', 'rpo', 'disaster recovery'], 'a1a1a1a1-1111-1111-1111-111111111103',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NOW() - INTERVAL '180 days', 156, 44);

-- WORKFLOW_DEFINITIONS (3 rows)
INSERT INTO workflow_definitions (id, tenant_id, name, bpmn_xml, version, status)
VALUES
    (sandbox_uuid('wfd_incident_esc'), '00000000-0000-0000-0000-000000000001',
     'Incident Escalation',
     '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="incident-escalation" targetNamespace="http://orionops.com/bpmn"><process id="incident-escalation-v1" name="Incident Escalation" isExecutable="true"><startEvent id="start" name="Incident Created"/><sequenceFlow id="sf1" sourceRef="start" targetRef="assignTier1"/><userTask id="assignTier1" name="Assign to Tier 1"/><sequenceFlow id="sf2" sourceRef="assignTier1" targetRef="slaGateway"/><exclusiveGateway id="slaGateway" name="SLA Breached?"/><sequenceFlow id="sf3" sourceRef="slaGateway" targetRef="escalateToTier2" conditionExpression="slaBreached == true"/><sequenceFlow id="sf4" sourceRef="slaGateway" targetRef="resolve" conditionExpression="slaBreached == false"/><userTask id="escalateToTier2" name="Escalate to Tier 2"/><userTask id="resolve" name="Resolve Incident"/><endEvent id="end" name="Incident Closed"/></process></definitions>',
     1, 'active'),

    (sandbox_uuid('wfd_change_approval'), '00000000-0000-0000-0000-000000000001',
     'Change Approval',
     '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="change-approval" targetNamespace="http://orionops.com/bpmn"><process id="change-approval-v2" name="Change Approval" isExecutable="true"><startEvent id="start" name="Change Submitted"/><sequenceFlow id="sf1" sourceRef="start" targetRef="riskAssessment"/><userTask id="riskAssessment" name="Risk Assessment"/><sequenceFlow id="sf2" sourceRef="riskAssessment" targetRef="cabReview"/><userTask id="cabReview" name="CAB Review"/><sequenceFlow id="sf3" sourceRef="cabReview" targetRef="approvalGateway"/><exclusiveGateway id="approvalGateway" name="Approved?"/><sequenceFlow id="sf4" sourceRef="approvalGateway" targetRef="scheduleImpl" conditionExpression="approved == true"/><sequenceFlow id="sf5" sourceRef="approvalGateway" targetRef="reject" conditionExpression="approved == false"/><userTask id="scheduleImpl" name="Schedule Implementation"/><endEvent id="end" name="Change Closed"/><endEvent id="rejected" name="Change Rejected"/></process></definitions>',
     2, 'active'),

    (sandbox_uuid('wfd_proc_request'), '00000000-0000-0000-0000-000000000001',
     'Procurement Request',
     '<?xml version="1.0" encoding="UTF-8"?><definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="procurement-request" targetNamespace="http://orionops.com/bpmn"><process id="procurement-request-v1" name="Procurement Request" isExecutable="true"><startEvent id="start" name="PR Submitted"/><sequenceFlow id="sf1" sourceRef="start" targetRef="managerApproval"/><userTask id="managerApproval" name="Manager Approval"/><sequenceFlow id="sf2" sourceRef="managerApproval" targetRef="budgetCheck"/><serviceTask id="budgetCheck" name="Budget Check"/><sequenceFlow id="sf3" sourceRef="budgetCheck" targetRef="procurementReview"/><userTask id="procurementReview" name="Procurement Review"/><sequenceFlow id="sf4" sourceRef="procurementReview" targetRef="issuePO"/><userTask id="issuePO" name="Issue Purchase Order"/><endEvent id="end" name="PO Issued"/></process></definitions>',
     1, 'active');

-- WORKFLOW_INSTANCES (3 rows)
INSERT INTO workflow_instances (id, tenant_id, definition_id, business_key, entity_type, entity_id, status, started_at, completed_at)
VALUES
    (sandbox_uuid('wfi_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('wfd_incident_esc'), 'INC-001', 'incident', sandbox_uuid('inc_001'),
     'running', NOW() - INTERVAL '3 hours', NULL),

    (sandbox_uuid('wfi_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('wfd_change_approval'), 'CHG-003', 'change_request', sandbox_uuid('chg_003'),
     'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

    (sandbox_uuid('wfi_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('wfd_proc_request'), 'PR-003', 'purchase_request', sandbox_uuid('pr_003'),
     'suspended', NOW() - INTERVAL '7 days', NULL);

-- APPROVALS (4 rows)
INSERT INTO approvals (id, tenant_id, entity_type, entity_id, approver_id, approver_group_id, status, comments, requested_at, responded_at)
VALUES
    (sandbox_uuid('appr_001'), '00000000-0000-0000-0000-000000000001',
     'change_request', sandbox_uuid('chg_004'),
     'a1a1a1a1-1111-1111-1111-111111111104', NULL,
     'pending', NULL, NOW() - INTERVAL '2 days', NULL),

    (sandbox_uuid('appr_002'), '00000000-0000-0000-0000-000000000001',
     'purchase_request', sandbox_uuid('pr_003'),
     'a1a1a1a1-1111-1111-1111-111111111101', NULL,
     'pending', NULL, NOW() - INTERVAL '4 days', NULL),

    (sandbox_uuid('appr_003'), '00000000-0000-0000-0000-000000000001',
     'change_request', sandbox_uuid('chg_003'),
     'a1a1a1a1-1111-1111-1111-111111111104', NULL,
     'approved', 'Risk assessment reviewed. Maintenance window scheduled. Approved for implementation.',
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

    (sandbox_uuid('appr_004'), '00000000-0000-0000-0000-000000000001',
     'change_request', sandbox_uuid('chg_004'),
     NULL, sandbox_uuid('group_management'),
     'rejected', 'Insufficient rollback plan detail. Please revise and resubmit with more granular rollback steps.',
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day');

-- ASSIGNMENTS (~10 rows)
INSERT INTO assignments (id, entity_type, entity_id, assignee_id, assignee_group_id, assignment_type, created_at)
VALUES
    (sandbox_uuid('asgn_001'), 'incident', sandbox_uuid('inc_001'), 'a1a1a1a1-1111-1111-1111-111111111102', sandbox_uuid('group_it_ops'),   'auto',        NOW() - INTERVAL '3 hours'),
    (sandbox_uuid('asgn_002'), 'incident', sandbox_uuid('inc_001'), 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('group_infra'),    'escalation',  NOW() - INTERVAL '2 hours 45 minutes'),
    (sandbox_uuid('asgn_003'), 'incident', sandbox_uuid('inc_003'), 'a1a1a1a1-1111-1111-1111-111111111102', sandbox_uuid('group_it_ops'),   'auto',        NOW() - INTERVAL '4 hours'),
    (sandbox_uuid('asgn_004'), 'incident', sandbox_uuid('inc_003'), 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('group_infra'),    'manual',      NOW() - INTERVAL '3 hours 30 minutes'),
    (sandbox_uuid('asgn_005'), 'incident', sandbox_uuid('inc_004'), 'a1a1a1a1-1111-1111-1111-111111111102', sandbox_uuid('group_it_ops'),   'auto',        NOW() - INTERVAL '2 hours'),
    (sandbox_uuid('asgn_006'), 'incident', sandbox_uuid('inc_006'), 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('group_infra'),    'auto',        NOW() - INTERVAL '2 days'),
    (sandbox_uuid('asgn_007'), 'incident', sandbox_uuid('inc_008'), 'a1a1a1a1-1111-1111-1111-111111111102', sandbox_uuid('group_it_ops'),   'auto',        NOW() - INTERVAL '10 days'),
    (sandbox_uuid('asgn_008'), 'incident', sandbox_uuid('inc_008'), 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('group_infra'),    'escalation',  NOW() - INTERVAL '10 days' + INTERVAL '10 minutes'),
    (sandbox_uuid('asgn_009'), 'change_request', sandbox_uuid('chg_004'), 'a1a1a1a1-1111-1111-1111-111111111103', sandbox_uuid('group_infra'), 'manual',   NOW() - INTERVAL '3 days'),
    (sandbox_uuid('asgn_010'), 'service_request', sandbox_uuid('sr_001'), 'a1a1a1a1-1111-1111-1111-111111111102', sandbox_uuid('group_it_ops'), 'auto',    NOW() - INTERVAL '1 day');

-- COMMENTS (~15 rows)
INSERT INTO comments (id, tenant_id, entity_type, entity_id, author_id, content, comment_type, is_internal, created_at)
VALUES
    (sandbox_uuid('cmt_001'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_001'), 'a1a1a1a1-1111-1111-1111-111111111102',
     'Incident confirmed. PROD-DB-01 is unreachable. Escalating to infrastructure team immediately.', 'comment', false, NOW() - INTERVAL '2 hours 55 minutes'),

    (sandbox_uuid('cmt_002'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_001'), 'a1a1a1a1-1111-1111-1111-111111111103',
     'Infrastructure team engaged. Running diagnostics on PROD-DB-01. PostgreSQL process appears to have crashed. Checking pg_log.', 'comment', true, NOW() - INTERVAL '2 hours 40 minutes'),

    (sandbox_uuid('cmt_003'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_001'), 'a1a1a1a1-1111-1111-1111-111111111103',
     'OOM killer terminated postgres process. Connection pool exhaustion led to memory pressure. Investigating root cause. Temporary fix: restarted PostgreSQL. DB is back online.', 'comment', false, NOW() - INTERVAL '2 hours 10 minutes'),

    (sandbox_uuid('cmt_004'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_001'), 'a1a1a1a1-1111-1111-1111-111111111101',
     'Linked to PRB-001. This is a recurring pattern. We need a permanent fix for connection pool management. Keeping this incident open until PRB-001 is resolved.', 'comment', true, NOW() - INTERVAL '1 hour 50 minutes'),

    (sandbox_uuid('cmt_005'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_003'), 'a1a1a1a1-1111-1111-1111-111111111102',
     'Multiple users have called in. Approximately 30 remote workers affected. VPN-GW-01 logs show TLS handshake failures.', 'comment', false, NOW() - INTERVAL '3 hours 45 minutes'),

    (sandbox_uuid('cmt_006'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_003'), 'a1a1a1a1-1111-1111-1111-111111111103',
     'Root cause identified: VPN daemon restarted due to automatic certificate renewal. Linked to PRB-002. Workaround: users can reconnect. Permanent fix requires scheduling certificate renewal outside business hours.', 'comment', true, NOW() - INTERVAL '3 hours 20 minutes'),

    (sandbox_uuid('cmt_007'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_004'), 'a1a1a1a1-1111-1111-1111-111111111102',
     'Contacted cloud email provider. Acknowledged queue buildup on their relay. ETA for resolution: 2 hours.', 'comment', false, NOW() - INTERVAL '1 hour 30 minutes'),

    (sandbox_uuid('cmt_008'), '00000000-0000-0000-0000-000000000001',
     'change_request', sandbox_uuid('chg_003'), 'a1a1a1a1-1111-1111-1111-111111111104',
     'Change reviewed by CAB. Risk assessment looks thorough. Backup plan is solid. Approved for the scheduled maintenance window.', 'comment', false, NOW() - INTERVAL '3 days'),

    (sandbox_uuid('cmt_009'), '00000000-0000-0000-0000-000000000001',
     'change_request', sandbox_uuid('chg_005'), 'a1a1a1a1-1111-1111-1111-111111111104',
     'Emergency CAB convened. Security team confirmed CVSS 9.8. Approved for emergency deployment within 4-hour window.', 'comment', true, NOW() - INTERVAL '2 hours'),

    (sandbox_uuid('cmt_010'), '00000000-0000-0000-0000-000000000001',
     'problem', sandbox_uuid('prb_001'), 'a1a1a1a1-1111-1111-1111-111111111103',
     'Connection pool tuning options under investigation. PgBouncer or increasing max_connections are candidates. Will present options to management next week.', 'comment', false, NOW() - INTERVAL '1 day'),

    (sandbox_uuid('cmt_011'), '00000000-0000-0000-0000-000000000001',
     'problem', sandbox_uuid('prb_003'), 'a1a1a1a1-1111-1111-1111-111111111102',
     'Confirmed known error. Working with cloud provider to add secondary MX relay. Expected completion: 2 weeks. Workaround documented in PRB-003.', 'comment', false, NOW() - INTERVAL '3 days'),

    (sandbox_uuid('cmt_012'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_008'), 'a1a1a1a1-1111-1111-1111-111111111103',
     'Power supply replaced. Switch fully operational. All 48 ports re-tested. VLAN configurations restored from backup. Network fully restored.', 'comment', false, NOW() - INTERVAL '10 days' + INTERVAL '40 minutes'),

    (sandbox_uuid('cmt_013'), '00000000-0000-0000-0000-000000000001',
     'service_request', sandbox_uuid('sr_001'), 'a1a1a1a1-1111-1111-1111-111111111102',
     'Procurement request raised for Dell XPS 15. Expected delivery: 5 business days. Will assign to user on receipt.', 'comment', false, NOW() - INTERVAL '23 hours'),

    (sandbox_uuid('cmt_014'), '00000000-0000-0000-0000-000000000001',
     'service_request', sandbox_uuid('sr_002'), 'a1a1a1a1-1111-1111-1111-111111111102',
     'VPN certificate generated. Instructions emailed to contractor. Access activated.', 'comment', false, NOW() - INTERVAL '5 days'),

    (sandbox_uuid('cmt_015'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_005'), 'a1a1a1a1-1111-1111-1111-111111111103',
     'Placed on hold. Intermittent issue could not be reproduced consistently. Will revisit after CHG-003 (PostgreSQL upgrade) is implemented to rule out DB timeout as root cause.', 'comment', true, NOW() - INTERVAL '20 hours');

-- ATTACHMENTS (4 rows)
INSERT INTO attachments (id, tenant_id, entity_type, entity_id, file_name, file_path, file_size, mime_type, uploaded_by, created_at)
VALUES
    (sandbox_uuid('att_001'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_001'),
     'db-error-log-2026-05-11.txt', 'attachments/incidents/inc-001/db-error-log-2026-05-11.txt',
     48320, 'text/plain', 'a1a1a1a1-1111-1111-1111-111111111103', NOW() - INTERVAL '2 hours 35 minutes'),

    (sandbox_uuid('att_002'), '00000000-0000-0000-0000-000000000001',
     'incident', sandbox_uuid('inc_008'),
     'network-switch-failure-report.pdf', 'attachments/incidents/inc-008/network-switch-failure-report.pdf',
     184220, 'application/pdf', 'a1a1a1a1-1111-1111-1111-111111111103', NOW() - INTERVAL '9 days 23 hours'),

    (sandbox_uuid('att_003'), '00000000-0000-0000-0000-000000000001',
     'change_request', sandbox_uuid('chg_003'),
     'postgresql-upgrade-runbook.pdf', 'attachments/change-requests/chg-003/postgresql-upgrade-runbook.pdf',
     256000, 'application/pdf', 'a1a1a1a1-1111-1111-1111-111111111103', NOW() - INTERVAL '5 days'),

    (sandbox_uuid('att_004'), '00000000-0000-0000-0000-000000000001',
     'change_request', sandbox_uuid('chg_005'),
     'security-scan-report-cve-2026-0042.pdf', 'attachments/change-requests/chg-005/security-scan-report-cve-2026-0042.pdf',
     312448, 'application/pdf', 'a1a1a1a1-1111-1111-1111-111111111101', NOW() - INTERVAL '4 hours');

-- ============================================================================
-- PHASE C — ERP DATA
-- ============================================================================

-- COST_CENTERS (4 rows)
INSERT INTO cost_centers (id, tenant_id, code, name, description, owner_id, status, budget_amount)
VALUES
    (sandbox_uuid('cc_it'),  '00000000-0000-0000-0000-000000000001', 'CC-IT-001',  'Information Technology', 'IT infrastructure, software, and services',          'a1a1a1a1-1111-1111-1111-111111111101', 'active', 500000.00),
    (sandbox_uuid('cc_ops'), '00000000-0000-0000-0000-000000000001', 'CC-OPS-001', 'Operations',             'Day-to-day operational expenses',                    'a1a1a1a1-1111-1111-1111-111111111101', 'active', 350000.00),
    (sandbox_uuid('cc_hr'),  '00000000-0000-0000-0000-000000000001', 'CC-HR-001',  'Human Resources',        'Recruitment, training, and HR programs',             'a1a1a1a1-1111-1111-1111-111111111101', 'active', 200000.00),
    (sandbox_uuid('cc_fac'), '00000000-0000-0000-0000-000000000001', 'CC-FAC-001', 'Facilities',             'Office space, utilities, and facilities management',  'a1a1a1a1-1111-1111-1111-111111111101', 'active', 275000.00);

-- BUDGETS (4 rows, FY2026)
INSERT INTO budgets (id, tenant_id, name, cost_center_id, fiscal_year, allocated_amount, spent_amount, remaining_amount, status)
VALUES
    (sandbox_uuid('bgt_it'),  '00000000-0000-0000-0000-000000000001', 'IT FY2026 Budget',          sandbox_uuid('cc_it'),  2026, 500000.00, 312000.00, 188000.00, 'active'),
    (sandbox_uuid('bgt_ops'), '00000000-0000-0000-0000-000000000001', 'Operations FY2026 Budget',  sandbox_uuid('cc_ops'), 2026, 350000.00, 332500.00,  17500.00, 'active'),
    (sandbox_uuid('bgt_hr'),  '00000000-0000-0000-0000-000000000001', 'HR FY2026 Budget',          sandbox_uuid('cc_hr'),  2026, 200000.00, 120000.00,  80000.00, 'active'),
    (sandbox_uuid('bgt_fac'), '00000000-0000-0000-0000-000000000001', 'Facilities FY2026 Budget',  sandbox_uuid('cc_fac'), 2026, 275000.00, 165000.00, 110000.00, 'active');

-- VENDORS (6 rows)
INSERT INTO vendors (id, tenant_id, name, code, contact_email, contact_phone, vendor_type, status, rating, notes)
VALUES
    (sandbox_uuid('vnd_cloudcorp'), '00000000-0000-0000-0000-000000000001',
     'CloudCorp Inc.', 'VND-001', 'sales@cloudcorp.example.com', '+1-555-0101',
     'cloud', 'active', 4.50, 'Primary cloud infrastructure provider. AWS and GCP reseller.'),

    (sandbox_uuid('vnd_securenet'), '00000000-0000-0000-0000-000000000001',
     'SecureNet LLC', 'VND-002', 'support@securenet.example.com', '+1-555-0202',
     'service', 'active', 4.20, 'Managed security services and SOC provider.'),

    (sandbox_uuid('vnd_techsupply'), '00000000-0000-0000-0000-000000000001',
     'TechSupply Co.', 'VND-003', 'orders@techsupply.example.com', '+1-555-0303',
     'hardware', 'active', 3.80, 'Hardware procurement for servers, networking, and peripherals.'),

    (sandbox_uuid('vnd_datavault'), '00000000-0000-0000-0000-000000000001',
     'DataVault Systems', 'VND-004', 'licensing@datavault.example.com', '+1-555-0404',
     'software', 'active', 4.00, 'Enterprise software licensing — backup, monitoring, and ITSM tools.'),

    (sandbox_uuid('vnd_nexus'), '00000000-0000-0000-0000-000000000001',
     'Nexus Consulting', 'VND-005', 'contracts@nexus.example.com', '+1-555-0505',
     'consulting', 'active', 4.70, 'IT consulting and project management services.'),

    (sandbox_uuid('vnd_netequip'), '00000000-0000-0000-0000-000000000001',
     'NetEquip Inc.', 'VND-006', 'sales@netequip.example.com', '+1-555-0606',
     'hardware', 'pending', 3.50, 'Network equipment supplier. Currently in vendor qualification process.');

-- EXPENSES (5 rows)
INSERT INTO expenses (id, tenant_id, description, amount, currency, expense_date, category, cost_center_id, submitted_by, status)
VALUES
    (sandbox_uuid('exp_001'), '00000000-0000-0000-0000-000000000001',
     'AWS cloud infrastructure monthly invoice — May 2026',
     18500.00, 'USD', '2026-05-01', 'Infrastructure', sandbox_uuid('cc_it'),
     'a1a1a1a1-1111-1111-1111-111111111101', 'approved'),

    (sandbox_uuid('exp_002'), '00000000-0000-0000-0000-000000000001',
     'JetBrains IDE license renewal — 10 seats',
     3200.00, 'USD', '2026-04-15', 'Software', sandbox_uuid('cc_it'),
     'a1a1a1a1-1111-1111-1111-111111111103', 'approved'),

    (sandbox_uuid('exp_003'), '00000000-0000-0000-0000-000000000001',
     'Office supplies Q2 2026 — IT Operations',
     845.00, 'USD', '2026-04-01', 'Supplies', sandbox_uuid('cc_ops'),
     'a1a1a1a1-1111-1111-1111-111111111102', 'reimbursed'),

    (sandbox_uuid('exp_004'), '00000000-0000-0000-0000-000000000001',
     'Conference travel — AWS re:Invent 2026 registration and flights',
     4200.00, 'USD', '2026-05-10', 'Travel', sandbox_uuid('cc_it'),
     'a1a1a1a1-1111-1111-1111-111111111103', 'pending'),

    (sandbox_uuid('exp_005'), '00000000-0000-0000-0000-000000000001',
     'Nexus Consulting — architecture review engagement May 2026',
     12000.00, 'USD', '2026-05-05', 'Services', sandbox_uuid('cc_it'),
     'a1a1a1a1-1111-1111-1111-111111111101', 'rejected');

-- INVOICES (4 rows)
INSERT INTO invoices (id, tenant_id, invoice_number, vendor_id, amount, currency, status, due_date, paid_date, line_items)
VALUES
    (sandbox_uuid('inv_001'), '00000000-0000-0000-0000-000000000001',
     'INV-2026-0042', sandbox_uuid('vnd_cloudcorp'),
     18500.00, 'USD', 'paid', '2026-04-30', '2026-04-28',
     '[{"description": "AWS EC2 instances", "quantity": 1, "unit_price": 12000.00, "total": 12000.00}, {"description": "AWS S3 storage", "quantity": 1, "unit_price": 3500.00, "total": 3500.00}, {"description": "AWS data transfer", "quantity": 1, "unit_price": 3000.00, "total": 3000.00}]'),

    (sandbox_uuid('inv_002'), '00000000-0000-0000-0000-000000000001',
     'INV-2026-0043', sandbox_uuid('vnd_securenet'),
     8750.00, 'USD', 'sent', '2026-05-31', NULL,
     '[{"description": "Managed SOC services — May 2026", "quantity": 1, "unit_price": 7500.00, "total": 7500.00}, {"description": "Vulnerability scanning", "quantity": 1, "unit_price": 1250.00, "total": 1250.00}]'),

    (sandbox_uuid('inv_003'), '00000000-0000-0000-0000-000000000001',
     'INV-2026-0038', sandbox_uuid('vnd_techsupply'),
     24600.00, 'USD', 'overdue', '2026-04-15', NULL,
     '[{"description": "Dell PowerEdge R750 Server", "quantity": 1, "unit_price": 18000.00, "total": 18000.00}, {"description": "32GB DDR5 ECC RAM modules", "quantity": 4, "unit_price": 1200.00, "total": 4800.00}, {"description": "Delivery and installation", "quantity": 1, "unit_price": 1800.00, "total": 1800.00}]'),

    (sandbox_uuid('inv_004'), '00000000-0000-0000-0000-000000000001',
     'INV-2026-0044', sandbox_uuid('vnd_datavault'),
     5400.00, 'USD', 'draft', '2026-06-15', NULL,
     '[{"description": "Veeam Backup Enterprise Plus — 3 year renewal", "quantity": 1, "unit_price": 4200.00, "total": 4200.00}, {"description": "Support and maintenance", "quantity": 1, "unit_price": 1200.00, "total": 1200.00}]');

-- PAYMENT_RECORDS (2 rows, for the paid invoice INV-2026-0042)
INSERT INTO payment_records (id, tenant_id, invoice_id, amount, payment_method, payment_ref, status, paid_at)
VALUES
    (sandbox_uuid('pay_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('inv_001'), 18500.00, 'bank_transfer', 'WIRE-20260428-00142', 'completed',
     '2026-04-28 14:30:00+00'),

    (sandbox_uuid('pay_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('inv_001'), 0.00, 'credit_card', 'CARD-20260428-AUTH-9921', 'failed',
     NULL);

-- CONTRACTS (4 rows)
INSERT INTO contracts (id, tenant_id, vendor_id, title, description, contract_type, start_date, end_date, value, status, terms, auto_renew)
VALUES
    (sandbox_uuid('ctr_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_cloudcorp'),
     'AWS Cloud Infrastructure Services Agreement',
     'Enterprise agreement for AWS cloud infrastructure services including compute, storage, and networking.',
     'service', '2025-01-01', '2026-12-31', 220000.00, 'active',
     'Monthly invoicing. 30-day termination notice required. SLA: 99.9% uptime guarantee.', true),

    (sandbox_uuid('ctr_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_securenet'),
     'Managed Security Services Contract',
     '24/7 SOC monitoring and managed security services.',
     'service', '2025-06-01', '2026-05-31', 90000.00, 'pending_renewal',
     'Monthly invoicing. 60-day renewal notice required. Includes quarterly penetration testing.', false),

    (sandbox_uuid('ctr_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_techsupply'),
     'Hardware Supply and Maintenance Agreement',
     'Preferred vendor agreement for server and network hardware procurement.',
     'maintenance', '2024-01-01', '2025-12-31', 150000.00, 'expired',
     'Net-30 payment terms. 3-year hardware warranty included. On-site support within 4 hours.', false),

    (sandbox_uuid('ctr_004'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_nexus'),
     'IT Consulting Retainer Agreement',
     'Monthly consulting retainer for architecture review and project advisory services.',
     'software', '2026-01-01', '2026-12-31', 60000.00, 'active',
     'Monthly retainer of $5,000. Additional hours at $250/hr. 30-day notice to cancel.', true);

-- PURCHASE_REQUESTS (4 rows)
INSERT INTO purchase_requests (id, tenant_id, pr_number, title, description, priority, status, requester_id, assigned_buyer_id, cost_center_id, estimated_cost, actual_cost)
VALUES
    (sandbox_uuid('pr_001'), '00000000-0000-0000-0000-000000000001', 'PR-2026-001',
     'New laptop for onboarding — Dell XPS 15',
     'New employee laptop required for sandbox user onboarding.',
     'medium', 'approved', 'a1a1a1a1-1111-1111-1111-111111111105', 'a1a1a1a1-1111-1111-1111-111111111101',
     sandbox_uuid('cc_it'), 2500.00, 2349.00),

    (sandbox_uuid('pr_002'), '00000000-0000-0000-0000-000000000001', 'PR-2026-002',
     'Network switch replacement — Cisco Catalyst 9300X',
     'Hardware refresh for NETWORK-SW-01 (EoL). Required to address PRB-004.',
     'high', 'submitted', 'a1a1a1a1-1111-1111-1111-111111111103', 'a1a1a1a1-1111-1111-1111-111111111101',
     sandbox_uuid('cc_it'), 32000.00, NULL),

    (sandbox_uuid('pr_003'), '00000000-0000-0000-0000-000000000001', 'PR-2026-003',
     'SSD storage expansion for PROD-DB-01',
     'Add 4TB NVMe SSD to address capacity issues identified in INC-006 and PRB-005.',
     'high', 'draft', 'a1a1a1a1-1111-1111-1111-111111111103', NULL,
     sandbox_uuid('cc_it'), 4800.00, NULL),

    (sandbox_uuid('pr_004'), '00000000-0000-0000-0000-000000000001', 'PR-2026-004',
     'Security training program — CISSP certification support',
     'Funding for CISSP certification training and exam fees for security team.',
     'low', 'rejected', 'a1a1a1a1-1111-1111-1111-111111111101', 'a1a1a1a1-1111-1111-1111-111111111101',
     sandbox_uuid('cc_hr'), 6500.00, NULL);

-- PURCHASE_ORDERS (3 rows)
INSERT INTO purchase_orders (id, tenant_id, po_number, purchase_request_id, vendor_id, status, total_amount, currency, order_date, expected_delivery, line_items)
VALUES
    (sandbox_uuid('po_001'), '00000000-0000-0000-0000-000000000001', 'PO-2026-001',
     sandbox_uuid('pr_001'), sandbox_uuid('vnd_techsupply'),
     'received', 2349.00, 'USD', '2026-04-20', '2026-04-28',
     '[{"sku": "DELL-XPS15-9530", "description": "Dell XPS 15 9530 (i9, 32GB RAM, 1TB SSD)", "quantity": 1, "unit_price": 2349.00, "total": 2349.00}]'),

    (sandbox_uuid('po_002'), '00000000-0000-0000-0000-000000000001', 'PO-2026-002',
     sandbox_uuid('pr_002'), sandbox_uuid('vnd_techsupply'),
     'issued', 31500.00, 'USD', '2026-05-08', '2026-05-22',
     '[{"sku": "C9300X-48P-A", "description": "Cisco Catalyst 9300X 48-port PoE+ switch", "quantity": 1, "unit_price": 28000.00, "total": 28000.00}, {"sku": "C9300X-NM-8Y", "description": "Cisco 9300X Network Module 8x25G", "quantity": 1, "unit_price": 3500.00, "total": 3500.00}]'),

    (sandbox_uuid('po_003'), '00000000-0000-0000-0000-000000000001', 'PO-2026-003',
     NULL, sandbox_uuid('vnd_cloudcorp'),
     'partial', 18500.00, 'USD', '2026-05-01', '2026-05-31',
     '[{"sku": "AWS-EC2-MONTHLY", "description": "AWS EC2 compute instances — May 2026", "quantity": 1, "unit_price": 12000.00, "total": 12000.00}, {"sku": "AWS-S3-MONTHLY", "description": "AWS S3 storage — May 2026", "quantity": 1, "unit_price": 3500.00, "total": 3500.00}, {"sku": "AWS-TRANSFER", "description": "AWS data transfer — May 2026", "quantity": 1, "unit_price": 3000.00, "total": 3000.00}]');

-- WAREHOUSES (3 rows)
INSERT INTO warehouses (id, tenant_id, name, location, code, status)
VALUES
    (sandbox_uuid('wh_main'), '00000000-0000-0000-0000-000000000001', 'Main Warehouse',       '123 Industrial Ave, Building A, Floor 1', 'WH-MAIN', 'active'),
    (sandbox_uuid('wh_it'),   '00000000-0000-0000-0000-000000000001', 'IT Storage',           'Data Center, Rack Room B, Cabinet Row 3', 'WH-IT',   'active'),
    (sandbox_uuid('wh_dc'),   '00000000-0000-0000-0000-000000000001', 'Data Center Staging',  'Data Center, Staging Area, Row 7',        'WH-DC',   'active');

-- INVENTORY_ITEMS (7 rows; 2 at low stock)
INSERT INTO inventory_items (id, tenant_id, name, sku, description, category, warehouse_id, quantity, minimum_quantity, unit_cost, status)
VALUES
    (sandbox_uuid('inv_servers'),   '00000000-0000-0000-0000-000000000001', 'Dell PowerEdge R750 Server', 'DELL-R750',       '2U rack server for production workloads',        'Servers',     sandbox_uuid('wh_dc'),   3,  2, 18000.00, 'active'),
    (sandbox_uuid('inv_switches'),  '00000000-0000-0000-0000-000000000001', 'Cisco Catalyst 9300 Switch', 'CISCO-C9300',     '48-port managed network switch',                 'Networking',  sandbox_uuid('wh_dc'),   2,  1, 12000.00, 'active'),
    (sandbox_uuid('inv_monitors'),  '00000000-0000-0000-0000-000000000001', 'Dell 27" 4K Monitor',        'DELL-U2723D',     '27-inch 4K IPS display for workstations',        'Peripherals', sandbox_uuid('wh_main'), 8,  5,  650.00, 'active'),
    -- low stock: quantity (1) <= minimum_quantity (2)
    (sandbox_uuid('inv_keyboards'), '00000000-0000-0000-0000-000000000001', 'Logitech MX Keys Keyboard',  'LOGI-MX-KEYS',    'Wireless keyboard for developer workstations',   'Peripherals', sandbox_uuid('wh_main'), 1,  2,   95.00, 'active'),
    (sandbox_uuid('inv_cables'),    '00000000-0000-0000-0000-000000000001', 'CAT6A Network Cable 1m',     'CAT6A-1M',        'Category 6A patch cable for rack patching',      'Cables',      sandbox_uuid('wh_dc'),  45, 20,    3.50, 'active'),
    -- low stock: quantity (1) <= minimum_quantity (2)
    (sandbox_uuid('inv_ups'),       '00000000-0000-0000-0000-000000000001', 'APC Smart-UPS 3000VA',       'APC-SUA3000',     '3000VA rack-mount UPS for server protection',    'Power',       sandbox_uuid('wh_dc'),   1,  2, 2200.00, 'active'),
    (sandbox_uuid('inv_laptops'),   '00000000-0000-0000-0000-000000000001', 'Dell XPS 15 Laptop',         'DELL-XPS15-9530', 'Developer laptop — 15" i9 32GB 1TB SSD',         'Laptops',     sandbox_uuid('wh_it'),   4,  2, 2349.00, 'active');

-- ASSETS (6 rows)
INSERT INTO assets (id, tenant_id, asset_tag, name, description, asset_type, status, acquisition_date, purchase_cost, current_value, depreciation_rate, assigned_to_id, location, ci_id, warranty_expiry, vendor_id)
VALUES
    (sandbox_uuid('ast_001'), '00000000-0000-0000-0000-000000000001',
     'AST-2023-001', 'PROD-WEB-01 Server',
     'Primary production web server hardware',
     'server', 'in_use', '2023-03-15', 22000.00, 14850.00, 25.00,
     'a1a1a1a1-1111-1111-1111-111111111103', 'Data Center, Rack A, Unit 12',
     sandbox_uuid('ci_prod_web_01'), '2026-03-14', sandbox_uuid('vnd_techsupply')),

    (sandbox_uuid('ast_002'), '00000000-0000-0000-0000-000000000001',
     'AST-2023-002', 'PROD-DB-01 Server',
     'Primary production database server hardware',
     'server', 'in_use', '2023-03-15', 32000.00, 21600.00, 25.00,
     'a1a1a1a1-1111-1111-1111-111111111103', 'Data Center, Rack B, Unit 4',
     sandbox_uuid('ci_prod_db_01'), '2026-03-14', sandbox_uuid('vnd_techsupply')),

    (sandbox_uuid('ast_003'), '00000000-0000-0000-0000-000000000001',
     'AST-2024-001', 'PROD-LB-01 Appliance',
     'Load balancer hardware appliance',
     'network', 'in_use', '2024-01-10', 8500.00, 7225.00, 15.00,
     NULL, 'Data Center, Rack A, Unit 1',
     sandbox_uuid('ci_prod_lb_01'), '2027-01-09', sandbox_uuid('vnd_techsupply')),

    (sandbox_uuid('ast_004'), '00000000-0000-0000-0000-000000000001',
     'AST-2022-001', 'Network Switch (Legacy)',
     'Cisco Catalyst 9300 — EoL, being replaced per CHG-004',
     'network', 'in_maintenance', '2022-06-01', 15000.00, 3750.00, 25.00,
     NULL, 'Data Center, Rack A, Unit 2',
     sandbox_uuid('ci_network_sw_01'), '2025-05-31', sandbox_uuid('vnd_techsupply')),

    (sandbox_uuid('ast_005'), '00000000-0000-0000-0000-000000000001',
     'AST-2019-001', 'Old Development Workstation',
     'Dell Precision 7820 — no longer in use, ready for disposal',
     'workstation', 'disposed', '2019-08-01', 4500.00, 0.00, 25.00,
     NULL, 'IT Storage (WH-IT)', NULL, '2022-07-31', sandbox_uuid('vnd_techsupply')),

    (sandbox_uuid('ast_006'), '00000000-0000-0000-0000-000000000001',
     'AST-2021-001', 'Backup Server (Retired)',
     'Legacy backup server replaced by BACKUP-SRV-01',
     'server', 'retired', '2021-02-15', 12000.00, 1200.00, 25.00,
     NULL, 'Data Center, Rack C, Unit 20', NULL, '2024-02-14', sandbox_uuid('vnd_techsupply'));

-- STOCK_MOVEMENTS (5 rows)
INSERT INTO stock_movements (id, tenant_id, inventory_item_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reference_type, reference_id, performed_by, notes, created_at)
VALUES
    (sandbox_uuid('stk_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('inv_laptops'), 'in', 5, NULL, sandbox_uuid('wh_it'),
     'purchase_order', sandbox_uuid('po_001'),
     'a1a1a1a1-1111-1111-1111-111111111102',
     'Received 5 Dell XPS 15 laptops from TechSupply PO-2026-001', NOW() - INTERVAL '12 days'),

    (sandbox_uuid('stk_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('inv_laptops'), 'out', 1, sandbox_uuid('wh_it'), NULL,
     'service_request', sandbox_uuid('sr_001'),
     'a1a1a1a1-1111-1111-1111-111111111102',
     'Issued 1 Dell XPS 15 to sandbox user per SR-001', NOW() - INTERVAL '10 days'),

    (sandbox_uuid('stk_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('inv_cables'), 'transfer', 20, sandbox_uuid('wh_main'), sandbox_uuid('wh_dc'),
     NULL, NULL,
     'a1a1a1a1-1111-1111-1111-111111111103',
     'Transfer cables to data center for rack patching project', NOW() - INTERVAL '7 days'),

    (sandbox_uuid('stk_004'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('inv_keyboards'), 'adjustment', -2, sandbox_uuid('wh_main'), NULL,
     NULL, NULL,
     'a1a1a1a1-1111-1111-1111-111111111102',
     'Inventory adjustment: 2 keyboards damaged during move, written off', NOW() - INTERVAL '3 days'),

    (sandbox_uuid('stk_005'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('inv_switches'), 'return', 1, NULL, sandbox_uuid('wh_dc'),
     'incident', sandbox_uuid('inc_008'),
     'a1a1a1a1-1111-1111-1111-111111111103',
     'Returned spare switch to stock after network incident resolved', NOW() - INTERVAL '9 days');

-- VENDOR_SLAS (4 rows)
INSERT INTO vendor_slas (id, tenant_id, vendor_id, contract_id, metric, target_value, actual_value, measurement_period, status)
VALUES
    (sandbox_uuid('vsla_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_cloudcorp'), sandbox_uuid('ctr_001'),
     'on_time_delivery', 99.90, 99.95, 'monthly', 'active'),

    (sandbox_uuid('vsla_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_securenet'), sandbox_uuid('ctr_002'),
     'response_time', 15.00, 12.50, 'monthly', 'active'),

    (sandbox_uuid('vsla_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_techsupply'), sandbox_uuid('ctr_003'),
     'defect_rate', 2.00, 3.80, 'quarterly', 'active'),

    (sandbox_uuid('vsla_004'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_nexus'), sandbox_uuid('ctr_004'),
     'on_time_delivery', 95.00, 97.00, 'monthly', 'active');

-- VENDOR_PERFORMANCES (3 rows)
INSERT INTO vendor_performances (id, tenant_id, vendor_id, period_start, period_end, on_time_delivery_pct, quality_score, responsiveness_score, overall_score, notes)
VALUES
    (sandbox_uuid('vperf_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_cloudcorp'), '2026-01-01', '2026-03-31',
     99.95, 92.00, 88.00, 93.32,
     'Excellent uptime. Minor latency spikes in January resolved quickly.'),

    (sandbox_uuid('vperf_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_securenet'), '2026-01-01', '2026-03-31',
     96.00, 88.00, 90.00, 91.33,
     'Good response times. Pentest report delivered on time. One false positive alert spike in February.'),

    (sandbox_uuid('vperf_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('vnd_techsupply'), '2026-01-01', '2026-03-31',
     82.00, 75.00, 70.00, 75.67,
     'Defect rate above SLA target. Hardware shipment delayed 3 days in February. Under review.');

-- EMPLOYEES (5 rows)
-- Insert without manager_id first, then update sandbox's manager
INSERT INTO employees (id, tenant_id, user_id, employee_number, department, job_title, hire_date, status)
VALUES
    (sandbox_uuid('emp_admin'),    '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111101', 'EMP-001', 'IT Operations',     'Platform Administrator', '2020-01-15', 'active'),
    (sandbox_uuid('emp_agent'),    '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111102', 'EMP-002', 'Service Desk',      'Service Desk Agent',     '2021-03-01', 'active'),
    (sandbox_uuid('emp_engineer'), '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111103', 'EMP-003', 'Infrastructure',    'Resolver Engineer',      '2021-06-14', 'active'),
    (sandbox_uuid('emp_changemgr'),'00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111104', 'EMP-004', 'Change Management', 'Change Manager',         '2019-09-01', 'active'),
    (sandbox_uuid('emp_sandbox'),  '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111105', 'EMP-005', 'IT Operations',     'Sandbox User',           '2026-05-01', 'active');

-- sandbox reports to admin
UPDATE employees SET manager_id = sandbox_uuid('emp_admin') WHERE id = sandbox_uuid('emp_sandbox');

-- SKILLS (8 rows)
INSERT INTO skills (id, tenant_id, name, category, description)
VALUES
    (sandbox_uuid('skill_java'),     '00000000-0000-0000-0000-000000000001', 'Java',                  'technical',      'Java programming language and JVM ecosystem'),
    (sandbox_uuid('skill_python'),   '00000000-0000-0000-0000-000000000001', 'Python',                'technical',      'Python scripting and automation'),
    (sandbox_uuid('skill_network'),  '00000000-0000-0000-0000-000000000001', 'Networking',            'technical',      'Network protocols, configuration, and troubleshooting'),
    (sandbox_uuid('skill_cloud'),    '00000000-0000-0000-0000-000000000001', 'Cloud Infrastructure',  'technical',      'AWS, GCP, and Azure cloud platforms'),
    (sandbox_uuid('skill_itil'),     '00000000-0000-0000-0000-000000000001', 'ITIL Framework',        'certification',  'ITIL v4 service management framework'),
    (sandbox_uuid('skill_pm'),       '00000000-0000-0000-0000-000000000001', 'Project Management',    'soft_skill',     'Project planning, execution, and delivery'),
    (sandbox_uuid('skill_devops'),   '00000000-0000-0000-0000-000000000001', 'DevOps',                'technical',      'CI/CD, Docker, Kubernetes, and automation'),
    (sandbox_uuid('skill_security'), '00000000-0000-0000-0000-000000000001', 'Security',              'technical',      'Information security, vulnerability management, compliance');

-- EMPLOYEE_SKILLS (~10 rows)
INSERT INTO employee_skills (employee_id, skill_id, proficiency_level) VALUES
    (sandbox_uuid('emp_admin'),     sandbox_uuid('skill_itil'),     'expert'),
    (sandbox_uuid('emp_admin'),     sandbox_uuid('skill_pm'),       'advanced'),
    (sandbox_uuid('emp_admin'),     sandbox_uuid('skill_cloud'),    'intermediate'),
    (sandbox_uuid('emp_agent'),     sandbox_uuid('skill_itil'),     'intermediate'),
    (sandbox_uuid('emp_engineer'),  sandbox_uuid('skill_java'),     'expert'),
    (sandbox_uuid('emp_engineer'),  sandbox_uuid('skill_cloud'),    'advanced'),
    (sandbox_uuid('emp_engineer'),  sandbox_uuid('skill_devops'),   'advanced'),
    (sandbox_uuid('emp_engineer'),  sandbox_uuid('skill_network'),  'intermediate'),
    (sandbox_uuid('emp_changemgr'), sandbox_uuid('skill_itil'),     'expert'),
    (sandbox_uuid('emp_changemgr'), sandbox_uuid('skill_pm'),       'expert'),
    (sandbox_uuid('emp_sandbox'),   sandbox_uuid('skill_python'),   'beginner'),
    (sandbox_uuid('emp_sandbox'),   sandbox_uuid('skill_security'), 'beginner');

-- CAPACITY_PLANS (3 rows)
INSERT INTO capacity_plans (id, tenant_id, team_id, period_start, period_end, available_hours, allocated_hours)
VALUES
    (sandbox_uuid('cap_it_ops'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('group_it_ops'), '2026-05-01', '2026-05-31', 320.00, 285.00),

    (sandbox_uuid('cap_infra'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('group_infra'), '2026-05-01', '2026-05-31', 480.00, 430.00),

    (sandbox_uuid('cap_dev'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('group_dev'), '2026-05-01', '2026-05-31', 640.00, 520.00);

-- SERVICE_USAGES (5 rows)
INSERT INTO service_usages (id, tenant_id, service_id, usage_type, quantity, unit, recorded_at, recorded_by)
VALUES
    (sandbox_uuid('su_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('svc_webapp'), 'api_calls', 2850000.00, 'count',
     NOW() - INTERVAL '1 day', 'a1a1a1a1-1111-1111-1111-111111111101'),

    (sandbox_uuid('su_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('svc_storage'), 'storage_gb', 4250.50, 'GB',
     NOW() - INTERVAL '1 day', 'a1a1a1a1-1111-1111-1111-111111111101'),

    (sandbox_uuid('su_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('svc_db'), 'hours', 720.00, 'hours',
     NOW() - INTERVAL '1 day', 'a1a1a1a1-1111-1111-1111-111111111101'),

    (sandbox_uuid('su_004'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('svc_cicd'), 'api_calls', 14200.00, 'count',
     NOW() - INTERVAL '1 day', 'a1a1a1a1-1111-1111-1111-111111111103'),

    (sandbox_uuid('su_005'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('svc_monitoring'), 'storage_gb', 180.00, 'GB',
     NOW() - INTERVAL '1 day', 'a1a1a1a1-1111-1111-1111-111111111103');

-- BILLING_RECORDS (3 rows)
INSERT INTO billing_records (id, tenant_id, service_usage_id, amount, currency, billing_period_start, billing_period_end, status, invoice_id)
VALUES
    (sandbox_uuid('br_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('su_001'), 12000.00, 'USD', '2026-04-01', '2026-04-30', 'invoiced', sandbox_uuid('inv_001')),

    (sandbox_uuid('br_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('su_002'), 3500.00, 'USD', '2026-04-01', '2026-04-30', 'invoiced', sandbox_uuid('inv_001')),

    (sandbox_uuid('br_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('su_003'), 1800.00, 'USD', '2026-05-01', '2026-05-31', 'pending', NULL);

-- COST_MODELS (3 rows)
INSERT INTO cost_models (id, tenant_id, name, description, model_type, parameters, service_id, effective_from, effective_to, status)
VALUES
    (sandbox_uuid('cm_001'), '00000000-0000-0000-0000-000000000001',
     'Web Application Fixed Cost', 'Fixed monthly fee for web application service',
     'fixed', '{"monthly_fee": 2000.00, "currency": "USD"}',
     sandbox_uuid('svc_webapp'), '2026-01-01', NULL, 'active'),

    (sandbox_uuid('cm_002'), '00000000-0000-0000-0000-000000000001',
     'API Usage Tiered Pricing', 'Tiered pricing based on monthly API call volume',
     'tiered', '{"tiers": [{"from": 0, "to": 1000000, "price_per_unit": 0.005}, {"from": 1000000, "to": 10000000, "price_per_unit": 0.003}, {"from": 10000000, "to": null, "price_per_unit": 0.001}], "unit": "api_call"}',
     sandbox_uuid('svc_webapp'), '2026-01-01', NULL, 'active'),

    (sandbox_uuid('cm_003'), '00000000-0000-0000-0000-000000000001',
     'Storage Usage-Based Billing', 'Pay-per-GB storage billing model',
     'usage_based', '{"price_per_gb": 0.023, "currency": "USD", "minimum_gb": 100}',
     sandbox_uuid('svc_storage'), '2026-01-01', NULL, 'active');

-- ============================================================================
-- PHASE D — SaaS DATA
-- ============================================================================

-- PLANS (3 rows)
INSERT INTO plans (id, name, description, price_monthly, price_yearly, currency, features, limits, is_active)
VALUES
    (sandbox_uuid('plan_starter'), 'Starter',
     'For small teams getting started with ITSM',
     29.00, 290.00, 'USD',
     '["incident_management", "service_requests", "basic_reporting", "email_notifications"]',
     '{"max_users": 10, "max_incidents_per_month": 100, "storage_gb": 5, "api_calls_per_day": 1000}',
     true),

    (sandbox_uuid('plan_professional'), 'Professional',
     'For growing organizations needing advanced ITSM capabilities',
     99.00, 990.00, 'USD',
     '["incident_management", "problem_management", "change_management", "cmdb", "sla_management", "knowledge_base", "workflow_automation", "advanced_reporting", "email_notifications", "webhook_integrations"]',
     '{"max_users": 50, "max_incidents_per_month": 1000, "storage_gb": 50, "api_calls_per_day": 10000}',
     true),

    (sandbox_uuid('plan_enterprise'), 'Enterprise',
     'Full platform with ERP extensions, unlimited scale, and dedicated support',
     299.00, 2990.00, 'USD',
     '["incident_management", "problem_management", "change_management", "cmdb", "sla_management", "knowledge_base", "workflow_automation", "advanced_reporting", "email_notifications", "webhook_integrations", "erp_financial", "erp_procurement", "erp_inventory", "erp_workforce", "saas_billing", "audit_trail", "sso", "api_full_access", "dedicated_support", "custom_workflows"]',
     '{"max_users": -1, "max_incidents_per_month": -1, "storage_gb": -1, "api_calls_per_day": -1}',
     true);

-- SUBSCRIPTIONS (1 row)
INSERT INTO subscriptions (id, tenant_id, plan_id, status, current_period_start, current_period_end)
VALUES
    (sandbox_uuid('sub_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('plan_enterprise'), 'active',
     '2026-05-01 00:00:00+00', '2026-06-01 00:00:00+00');

-- PAYMENTS (3 rows)
INSERT INTO payments (id, tenant_id, subscription_id, amount, currency, status, payment_method, paid_at)
VALUES
    (sandbox_uuid('pmt_001'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sub_001'), 299.00, 'USD', 'completed', 'card',
     '2026-03-01 10:00:00+00'),

    (sandbox_uuid('pmt_002'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sub_001'), 299.00, 'USD', 'completed', 'card',
     '2026-04-01 10:00:00+00'),

    (sandbox_uuid('pmt_003'), '00000000-0000-0000-0000-000000000001',
     sandbox_uuid('sub_001'), 299.00, 'USD', 'completed', 'card',
     '2026-05-01 10:00:00+00');

-- NOTIFICATIONS (10 rows)
INSERT INTO notifications (id, tenant_id, user_id, notification_type, title, message, entity_type, entity_id, channel, status, read_at, sent_at, created_at)
VALUES
    (sandbox_uuid('notif_001'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111103', 'incident_assigned',
     'New incident assigned to you',
     'INC-001: Production database unreachable — full outage has been assigned to you.',
     'incident', sandbox_uuid('inc_001'), 'in_app', 'unread', NULL,
     NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

    (sandbox_uuid('notif_002'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'sla_breach_warning',
     'SLA breach warning — INC-001',
     'Critical SLA for INC-001 has been breached. Resolution target was 4 hours ago.',
     'incident', sandbox_uuid('inc_001'), 'in_app', 'unread', NULL,
     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

    (sandbox_uuid('notif_003'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111104', 'approval_required',
     'Approval required — CHG-004',
     'Change request CHG-004: Network switch replacement requires your approval.',
     'change_request', sandbox_uuid('chg_004'), 'in_app', 'unread', NULL,
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

    (sandbox_uuid('notif_004'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'approval_required',
     'Approval required — PR-2026-003',
     'Purchase request PR-2026-003: SSD storage expansion requires your approval.',
     'purchase_request', sandbox_uuid('pr_003'), 'in_app', 'unread', NULL,
     NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

    (sandbox_uuid('notif_005'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111103', 'comment_added',
     'New comment on INC-001',
     'Alice Admin commented on INC-001: "Linked to PRB-001. This is a recurring pattern..."',
     'incident', sandbox_uuid('inc_001'), 'in_app', 'read',
     NOW() - INTERVAL '1 hour 45 minutes',
     NOW() - INTERVAL '1 hour 50 minutes', NOW() - INTERVAL '1 hour 50 minutes'),

    (sandbox_uuid('notif_006'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111102', 'incident_assigned',
     'New incident assigned to you',
     'INC-004: Email delivery delays — messages queued has been assigned to you.',
     'incident', sandbox_uuid('inc_004'), 'in_app', 'read',
     NOW() - INTERVAL '1 hour 55 minutes',
     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

    (sandbox_uuid('notif_007'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111103', 'change_scheduled',
     'Change request scheduled — CHG-003',
     'CHG-003: PostgreSQL upgrade to 15.6 is scheduled for 3 days from now. Please prepare.',
     'change_request', sandbox_uuid('chg_003'), 'in_app', 'read',
     NOW() - INTERVAL '2 days 22 hours',
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

    (sandbox_uuid('notif_008'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111104', 'comment_added',
     'New comment on CHG-005',
     'Security team commented on CHG-005 emergency change. Action required.',
     'change_request', sandbox_uuid('chg_005'), 'in_app', 'unread', NULL,
     NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

    (sandbox_uuid('notif_009'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111105', 'incident_assigned',
     'Welcome — Sandbox account active',
     'Your sandbox account is active. Explore all features using your multi-role access.',
     'incident', sandbox_uuid('inc_001'), 'in_app', 'unread', NULL,
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

    (sandbox_uuid('notif_010'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'sla_breach_warning',
     'SLA breached — INC-008 (historical)',
     'Critical SLA for INC-008: Network switch failure was breached by 5 minutes.',
     'incident', sandbox_uuid('inc_008'), 'in_app', 'read',
     NOW() - INTERVAL '9 days 23 hours',
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

-- INTEGRATION_ENDPOINTS (2 rows)
INSERT INTO integration_endpoints (id, tenant_id, name, endpoint_type, url, method, auth_type, auth_config, is_active, last_triggered_at)
VALUES
    (sandbox_uuid('ie_slack'), '00000000-0000-0000-0000-000000000001',
     'Slack Incident Alerts', 'webhook',
     'https://hooks.slack.example.com/services/T0SANDBOX/B0SANDBOX/xxxxxSANDBOXxxxxx',
     'POST', 'none',
     '{"channel": "#incidents", "username": "OrionOps Bot", "icon_emoji": ":rotating_light:"}',
     true, NOW() - INTERVAL '3 hours'),

    (sandbox_uuid('ie_pagerduty'), '00000000-0000-0000-0000-000000000001',
     'PagerDuty Critical Alerts', 'webhook',
     'https://events.pagerduty.example.com/v2/enqueue',
     'POST', 'api_key',
     '{"integration_key": "sandbox_pd_key_placeholder", "routing_key": "R0SANDBOX00000"}',
     true, NOW() - INTERVAL '3 hours');

-- ============================================================================
-- PHASE E — EVENT STORE
-- ============================================================================

INSERT INTO event_store (id, aggregate_type, aggregate_id, event_type, event_version, payload, metadata, timestamp)
VALUES
    (sandbox_uuid('es_001'), 'incident', sandbox_uuid('inc_001'),
     'incident_created', 1,
     '{"incident_number": "INC-001", "title": "Production database unreachable", "priority": "critical", "status": "open"}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111102", "correlation_id": "corr-inc-001-create", "tenant_id": "00000000-0000-0000-0000-000000000001"}',
     NOW() - INTERVAL '3 hours'),

    (sandbox_uuid('es_002'), 'incident', sandbox_uuid('inc_001'),
     'incident_assigned', 1,
     '{"incident_id": "' || sandbox_uuid('inc_001') || '", "assignee_id": "a1a1a1a1-1111-1111-1111-111111111103", "assignment_type": "escalation", "previous_assignee_id": "a1a1a1a1-1111-1111-1111-111111111102"}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111101", "correlation_id": "corr-inc-001-assign", "causation_id": "' || sandbox_uuid('es_001') || '"}',
     NOW() - INTERVAL '2 hours 45 minutes'),

    (sandbox_uuid('es_003'), 'incident', sandbox_uuid('inc_008'),
     'incident_escalated', 1,
     '{"incident_id": "' || sandbox_uuid('inc_008') || '", "from_priority": "high", "to_priority": "critical", "reason": "Network-wide outage confirmed"}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111101", "correlation_id": "corr-inc-008-escalate"}',
     NOW() - INTERVAL '10 days' + INTERVAL '5 minutes'),

    (sandbox_uuid('es_004'), 'incident', sandbox_uuid('inc_008'),
     'incident_resolved', 1,
     '{"incident_id": "' || sandbox_uuid('inc_008') || '", "resolution_code": "resolved_permanently", "resolution_notes": "Replaced failed switch module. Network restored.", "resolved_at": "' || (NOW() - INTERVAL '10 days' + INTERVAL '45 minutes') || '"}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111103", "correlation_id": "corr-inc-008-resolve"}',
     NOW() - INTERVAL '10 days' + INTERVAL '45 minutes'),

    (sandbox_uuid('es_005'), 'problem', sandbox_uuid('prb_001'),
     'problem_created', 1,
     '{"problem_number": "PRB-001", "title": "Recurring database connection pool exhaustion", "priority": "critical", "linked_incident_id": "' || sandbox_uuid('inc_001') || '"}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111101", "correlation_id": "corr-prb-001-create"}',
     NOW() - INTERVAL '1 day'),

    (sandbox_uuid('es_006'), 'change_request', sandbox_uuid('chg_003'),
     'change_submitted', 1,
     '{"change_number": "CHG-003", "change_type": "normal", "title": "Upgrade PostgreSQL from 15.4 to 15.6", "risk_level": "medium", "submitted_by": "a1a1a1a1-1111-1111-1111-111111111104"}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111104", "correlation_id": "corr-chg-003-submit"}',
     NOW() - INTERVAL '5 days'),

    (sandbox_uuid('es_007'), 'change_request', sandbox_uuid('chg_003'),
     'change_approved', 1,
     '{"change_number": "CHG-003", "approved_by": "a1a1a1a1-1111-1111-1111-111111111104", "comments": "Risk assessment reviewed. Approved for implementation."}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111104", "correlation_id": "corr-chg-003-approve", "causation_id": "' || sandbox_uuid('es_006') || '"}',
     NOW() - INTERVAL '3 days'),

    (sandbox_uuid('es_008'), 'change_request', sandbox_uuid('chg_001'),
     'change_implemented', 1,
     '{"change_number": "CHG-001", "implemented_by": "a1a1a1a1-1111-1111-1111-111111111103", "implemented_at": "' || (NOW() - INTERVAL '7 days' + INTERVAL '1 hour 45 minutes') || '", "notes": "Deployment successful. All smoke tests passed."}',
     '{"user_id": "a1a1a1a1-1111-1111-1111-111111111103", "correlation_id": "corr-chg-001-implement"}',
     NOW() - INTERVAL '7 days' + INTERVAL '1 hour 45 minutes'),

    (sandbox_uuid('es_009'), 'sla', sandbox_uuid('sla_inst_001'),
     'sla_created', 1,
     '{"sla_definition_id": "' || sandbox_uuid('sla_def_critical') || '", "entity_type": "incident", "entity_id": "' || sandbox_uuid('inc_001') || '", "response_target_minutes": 15, "resolution_target_minutes": 240}',
     '{"correlation_id": "corr-sla-inst-001-create", "system": "sla-engine"}',
     NOW() - INTERVAL '3 hours'),

    (sandbox_uuid('es_010'), 'sla', sandbox_uuid('sla_inst_004'),
     'sla_breach_warning', 1,
     '{"sla_definition_id": "' || sandbox_uuid('sla_def_critical') || '", "entity_type": "incident", "entity_id": "' || sandbox_uuid('inc_008') || '", "breach_type": "resolution", "breached_by_minutes": 5}',
     '{"correlation_id": "corr-sla-inst-004-breach", "system": "sla-engine"}',
     NOW() - INTERVAL '10 days' + INTERVAL '4 hours 5 minutes');

-- ============================================================================
-- PHASE F — AUDIT TRAIL
-- ============================================================================

INSERT INTO audit_events (id, tenant_id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, timestamp)
VALUES
    (sandbox_uuid('aud_001'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'LOGIN', 'user',
     'a1a1a1a1-1111-1111-1111-111111111101',
     NULL, '{"status": "success", "method": "password"}',
     '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0',
     NOW() - INTERVAL '4 hours'),

    (sandbox_uuid('aud_002'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111102', 'CREATE_INCIDENT', 'incident',
     sandbox_uuid('inc_001'),
     NULL, '{"incident_number": "INC-001", "priority": "critical", "status": "open"}',
     '192.168.1.20', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0',
     NOW() - INTERVAL '3 hours'),

    (sandbox_uuid('aud_003'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111103', 'UPDATE_STATUS', 'incident',
     sandbox_uuid('inc_006'),
     '{"status": "in_progress"}', '{"status": "resolved", "resolution_code": "resolved_by_workaround"}',
     '192.168.1.30', 'Mozilla/5.0 (Macintosh) Chrome/124.0',
     NOW() - INTERVAL '2 days'),

    (sandbox_uuid('aud_004'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111104', 'CREATE_CHANGE', 'change_request',
     sandbox_uuid('chg_003'),
     NULL, '{"change_number": "CHG-003", "change_type": "normal", "risk_level": "medium"}',
     '192.168.1.40', 'Mozilla/5.0 (Windows NT 10.0) Firefox/124.0',
     NOW() - INTERVAL '5 days'),

    (sandbox_uuid('aud_005'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111104', 'APPROVE_CHANGE', 'change_request',
     sandbox_uuid('chg_003'),
     '{"status": "pending_approval"}', '{"status": "approved"}',
     '192.168.1.40', 'Mozilla/5.0 (Windows NT 10.0) Firefox/124.0',
     NOW() - INTERVAL '3 days'),

    (sandbox_uuid('aud_006'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111103', 'CREATE_PROBLEM', 'problem',
     sandbox_uuid('prb_001'),
     NULL, '{"problem_number": "PRB-001", "priority": "critical", "status": "open"}',
     '192.168.1.30', 'Mozilla/5.0 (Macintosh) Chrome/124.0',
     NOW() - INTERVAL '1 day'),

    (sandbox_uuid('aud_007'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'ASSIGN_INCIDENT', 'incident',
     sandbox_uuid('inc_001'),
     '{"assignee_id": "a1a1a1a1-1111-1111-1111-111111111102"}',
     '{"assignee_id": "a1a1a1a1-1111-1111-1111-111111111103", "assignment_type": "escalation"}',
     '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0',
     NOW() - INTERVAL '2 hours 45 minutes'),

    (sandbox_uuid('aud_008'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'ESCALATE_INCIDENT', 'incident',
     sandbox_uuid('inc_008'),
     '{"priority": "high"}', '{"priority": "critical", "reason": "Network-wide outage confirmed"}',
     '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0',
     NOW() - INTERVAL '10 days' + INTERVAL '5 minutes'),

    (sandbox_uuid('aud_009'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'CREATE_EXPENSE', 'expense',
     sandbox_uuid('exp_001'),
     NULL, '{"description": "AWS cloud infrastructure monthly invoice", "amount": 18500.00, "category": "Infrastructure"}',
     '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0',
     NOW() - INTERVAL '10 days'),

    (sandbox_uuid('aud_010'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111105', 'CREATE_PR', 'purchase_request',
     sandbox_uuid('pr_001'),
     NULL, '{"pr_number": "PR-2026-001", "title": "New laptop for onboarding", "estimated_cost": 2500.00}',
     '192.168.1.50', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0',
     NOW() - INTERVAL '15 days'),

    (sandbox_uuid('aud_011'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'PAYMENT_RECEIVED', 'payment_record',
     sandbox_uuid('pay_001'),
     NULL, '{"invoice_number": "INV-2026-0042", "amount": 18500.00, "payment_method": "bank_transfer", "status": "completed"}',
     '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0) Chrome/124.0',
     '2026-04-28 14:30:00+00'),

    (sandbox_uuid('aud_012'), '00000000-0000-0000-0000-000000000001',
     'a1a1a1a1-1111-1111-1111-111111111101', 'USER_SYNC', 'user',
     'a1a1a1a1-1111-1111-1111-111111111105',
     NULL, '{"action": "keycloak_sync", "user_email": "sandbox@demo.orionops.local", "status": "synced"}',
     '127.0.0.1', 'OrionOps-Keycloak-Sync/1.0',
     NOW() - INTERVAL '10 days');

-- ============================================================================
-- CLEANUP: Drop the helper function (optional — leave if needed by app code)
-- ============================================================================
-- DROP FUNCTION IF EXISTS sandbox_uuid(TEXT);
