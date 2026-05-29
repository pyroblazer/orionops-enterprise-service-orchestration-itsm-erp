-- Seed sandbox test data for admin account
-- This file populates all modules with realistic test data for demonstration

-- ============================================================================
-- TENANTS & USERS
-- ============================================================================

INSERT INTO tenants (id, name, status, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Admin Tenant', 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO users (id, username, email, password_hash, tenant_id, role, status, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@orionops.local', '$2a$10$hashedpassword', '550e8400-e29b-41d4-a716-446655440000', 'ADMIN', 'ACTIVE', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'manager', 'manager@orionops.local', '$2a$10$hashedpassword', '550e8400-e29b-41d4-a716-446655440000', 'MANAGER', 'ACTIVE', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'viewer', 'viewer@orionops.local', '$2a$10$hashedpassword', '550e8400-e29b-41d4-a716-446655440000', 'VIEWER', 'ACTIVE', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FINANCE MODULE
-- ============================================================================

-- Chart of Accounts
INSERT INTO gl_accounts (id, code, name, account_type, normal_balance, active, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655441001', '1000', 'Cash', 'ASSET', 'DEBIT', true, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655441002', '1010', 'Accounts Receivable', 'ASSET', 'DEBIT', true, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655441003', '2000', 'Accounts Payable', 'LIABILITY', 'CREDIT', true, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655441004', '3000', 'Common Stock', 'EQUITY', 'CREDIT', true, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655441005', '4000', 'Service Revenue', 'REVENUE', 'CREDIT', true, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655441006', '5000', 'Operating Expenses', 'EXPENSE', 'DEBIT', true, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Budgets
INSERT INTO budgets (id, name, amount, start_date, end_date, tenant_id, status, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655442001', 'Q2 2026 Software Development', 250000.00, '2026-04-01', '2026-06-30', '550e8400-e29b-41d4-a716-446655440000', 'ACTIVE', NOW()),
  ('550e8400-e29b-41d4-a716-446655442002', 'Q2 2026 Operations', 150000.00, '2026-04-01', '2026-06-30', '550e8400-e29b-41d4-a716-446655440000', 'ACTIVE', NOW()),
  ('550e8400-e29b-41d4-a716-446655442003', 'Q2 2026 Marketing', 100000.00, '2026-04-01', '2026-06-30', '550e8400-e29b-41d4-a716-446655440000', 'ACTIVE', NOW())
ON CONFLICT DO NOTHING;

-- Cost Centers
INSERT INTO cost_centers (id, code, name, description, owner_id, budget_amount, status, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655443001', 'CC-ENG', 'Engineering', 'Engineering department', '550e8400-e29b-41d4-a716-446655440001', 500000.00, 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655443002', 'CC-OPS', 'Operations', 'Operations team', '550e8400-e29b-41d4-a716-446655440001', 300000.00, 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655443003', 'CC-MKT', 'Marketing', 'Marketing department', '550e8400-e29b-41d4-a716-446655440002', 200000.00, 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- GL Entries (Sample transactions)
INSERT INTO gl_entries (id, gl_account_id, amount, reference, description, entry_date, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655444001', '550e8400-e29b-41d4-a716-446655441001', 50000.00, 'DEP-001', 'Initial cash deposit', '2026-04-01', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655444002', '550e8400-e29b-41d4-a716-446655441005', 25000.00, 'INV-001', 'Service revenue from Client A', '2026-05-01', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655444003', '550e8400-e29b-41d4-a716-446655441006', 5000.00, 'EXP-001', 'Utilities and rent', '2026-05-15', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PROCUREMENT MODULE
-- ============================================================================

-- Vendors
INSERT INTO vendors (id, vendor_name, vendor_code, status, payment_terms, rating, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655445001', 'Global Tech Solutions', 'VENDOR-001', 'ACTIVE', 'NET30', 4.5, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655445002', 'Industrial Supplies Inc', 'VENDOR-002', 'ACTIVE', 'NET15', 4.0, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655445003', 'Office Depot', 'VENDOR-003', 'ACTIVE', 'NET30', 3.8, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655445004', 'Dell Technologies', 'VENDOR-004', 'ACTIVE', 'NET45', 4.7, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Contracts
INSERT INTO contracts (id, vendor_id, contract_number, start_date, end_date, value, renewal_alert_days, owner_id, status, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655446001', '550e8400-e29b-41d4-a716-446655445001', 'CONT-001', '2026-01-01', '2026-12-31', 500000.00, 30, '550e8400-e29b-41d4-a716-446655440001', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655446002', '550e8400-e29b-41d4-a716-446655445002', 'CONT-002', '2026-03-01', '2027-02-28', 250000.00, 30, '550e8400-e29b-41d4-a716-446655440001', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655446003', '550e8400-e29b-41d4-a716-446655445004', 'CONT-003', '2026-02-01', '2026-08-31', 150000.00, 30, '550e8400-e29b-41d4-a716-446655440002', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Purchase Orders
INSERT INTO purchase_orders (id, vendor_id, po_number, status, total_amount, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655447001', '550e8400-e29b-41d4-a716-446655445001', 'PO-2026-001', 'APPROVED', 45000.00, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655447002', '550e8400-e29b-41d4-a716-446655445002', 'PO-2026-002', 'SENT', 32000.00, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655447003', '550e8400-e29b-41d4-a716-446655445003', 'PO-2026-003', 'DRAFT', 15000.00, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- RFQs
INSERT INTO rfqs (id, requisition_id, title, status, deadline, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655448001', 'REQ-001', 'Server Hardware Request', 'SENT', '2026-06-15', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655448002', 'REQ-002', 'Network Equipment', 'DRAFT', '2026-07-01', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655448003', 'REQ-003', 'Software Licenses', 'SENT', '2026-06-30', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INVENTORY MODULE
-- ============================================================================

-- Products/SKUs
INSERT INTO products (id, sku, product_name, description, uom, quantity_on_hand, reorder_point, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655449001', 'SKU-001', 'Server Rack', 'Enterprise server rack 42U', 'UNIT', 15, 5, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655449002', 'SKU-002', 'Network Switch', 'Gigabit network switch 48-port', 'UNIT', 32, 10, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655449003', 'SKU-003', 'Fiber Optic Cable', 'Single-mode fiber 100m spool', 'SPOOL', 125, 20, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655449004', 'SKU-004', 'Server RAM', 'DDR4 32GB RAM module', 'MODULE', 48, 10, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Warehouses
INSERT INTO warehouses (id, warehouse_code, location, capacity, current_items, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655450001', 'WH-001', 'Chicago Distribution Center', 10000, 4820, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655450002', 'WH-002', 'Dallas Regional Hub', 5000, 2340, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655450003', 'WH-003', 'West Coast Facility', 8000, 3120, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Inventory Transfers
INSERT INTO inventory_transfers (id, from_warehouse_id, to_warehouse_id, sku, quantity, status, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655451001', '550e8400-e29b-41d4-a716-446655450001', '550e8400-e29b-41d4-a716-446655450002', 'SKU-001', 5, 'PENDING', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655451002', '550e8400-e29b-41d4-a716-446655450001', '550e8400-e29b-41d4-a716-446655450003', 'SKU-002', 10, 'IN_TRANSIT', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655451003', '550e8400-e29b-41d4-a716-446655450002', '550e8400-e29b-41d4-a716-446655450001', 'SKU-003', 50, 'RECEIVED', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Assets
INSERT INTO assets (id, asset_tag, asset_name, asset_type, purchase_price, purchase_date, depreciation_method, useful_life_years, location, status, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655452001', 'ASSET-001', 'Server A1', 'HARDWARE', 5000.00, '2024-01-15', 'STRAIGHT_LINE', 5, 'WH-001', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655452002', 'ASSET-002', 'Server A2', 'HARDWARE', 5500.00, '2024-02-01', 'STRAIGHT_LINE', 5, 'WH-001', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655452003', 'ASSET-003', 'Network Switch 1', 'NETWORK', 2000.00, '2023-06-15', 'STRAIGHT_LINE', 5, 'WH-002', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INCIDENT & CHANGE MANAGEMENT
-- ============================================================================

-- SLA Definitions
INSERT INTO sla_definitions (id, name, response_time_hours, resolution_time_hours, priority_level, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655453001', 'P1 SLA', 1, 4, 'CRITICAL', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655453002', 'P2 SLA', 4, 8, 'HIGH', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655453003', 'P3 SLA', 8, 24, 'MEDIUM', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Incidents
INSERT INTO incidents (id, incident_number, title, description, priority, status, assigned_to, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655454001', 'INC-2026-001', 'Database connection timeout', 'Production database experiencing intermittent connection issues', 'CRITICAL', 'OPEN', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655454002', 'INC-2026-002', 'Email delivery failure', 'Notification emails not being delivered to users', 'HIGH', 'ASSIGNED', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655454003', 'INC-2026-003', 'UI rendering issue', 'Dashboard widgets showing formatting errors in Safari', 'MEDIUM', 'OPEN', NULL, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Changes
INSERT INTO changes (id, change_number, title, description, type, status, priority, scheduled_start, scheduled_end, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655455001', 'CHG-2026-001', 'Database version upgrade', 'Upgrade PostgreSQL from 13 to 15', 'MAINTENANCE', 'SCHEDULED', 'MEDIUM', '2026-06-15 02:00:00', '2026-06-15 04:00:00', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655455002', 'CHG-2026-002', 'Load balancer configuration', 'Update SSL certificates and routing rules', 'NORMAL', 'DRAFT', 'LOW', '2026-07-01 10:00:00', '2026-07-01 11:00:00', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655455003', 'CHG-2026-003', 'Emergency patch deployment', 'Critical security patch for kernel exploit', 'EMERGENCY', 'APPROVED', 'CRITICAL', '2026-05-29 18:00:00', '2026-05-29 19:00:00', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Problems
INSERT INTO problems (id, problem_number, title, description, status, known_error, root_cause, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655456001', 'PRB-2026-001', 'Intermittent database timeouts', 'Database connection pool exhaustion under peak load', 'OPEN', true, 'Connection pool size insufficient for concurrent requests', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655456002', 'PRB-2026-002', 'Memory leak in notification service', 'Notification service consuming increasing memory over time', 'ASSIGNED', true, 'Event listeners not properly cleaned up in message queue', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655456003', 'PRB-2026-003', 'Slow API response times', 'API endpoints responding slower than expected', 'OPEN', false, 'Unknown - requires investigation', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLIANCE & SECURITY
-- ============================================================================

-- Segregation of Duties Rules
INSERT INTO sod_rules (id, activity1, activity2, conflict_level, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655457001', 'CREATE_EXPENSE', 'APPROVE_EXPENSE', 'HIGH', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655457002', 'CREATE_PO', 'APPROVE_PO', 'HIGH', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655457003', 'CREATE_INVOICE', 'APPROVE_INVOICE', 'HIGH', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Approval Authorities
INSERT INTO approval_authorities (id, user_id, activity_type, max_amount, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655458001', '550e8400-e29b-41d4-a716-446655440001', 'APPROVE_EXPENSE', 100000.00, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655458002', '550e8400-e29b-41d4-a716-446655440001', 'APPROVE_PO', 500000.00, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655458003', '550e8400-e29b-41d4-a716-446655440002', 'APPROVE_EXPENSE', 50000.00, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655458004', '550e8400-e29b-41d4-a716-446655440002', 'APPROVE_PO', 250000.00, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- WORKFLOW & PROCESS
-- ============================================================================

-- Workflow Definitions
INSERT INTO workflow_definitions (id, name, description, status, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655459001', 'Expense Approval', 'Standard workflow for expense approval', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655459002', 'PO Approval', 'Purchase order approval workflow', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655459003', 'Change Request', 'IT change request workflow', 'ACTIVE', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BILLING & USAGE
-- ============================================================================

-- Billing Records
INSERT INTO billing_records (id, amount, usage_type, period_start, period_end, cost_center_id, status, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655460001', 15000.00, 'CLOUD_COMPUTE', '2026-05-01', '2026-05-31', '550e8400-e29b-41d4-a716-446655443001', 'POSTED', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655460002', 8000.00, 'STORAGE', '2026-05-01', '2026-05-31', '550e8400-e29b-41d4-a716-446655443001', 'POSTED', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655460003', 5000.00, 'NETWORK', '2026-05-01', '2026-05-31', '550e8400-e29b-41d4-a716-446655443002', 'POSTED', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KNOWLEDGE & DOCUMENTATION
-- ============================================================================

-- Knowledge Articles
INSERT INTO knowledge_articles (id, title, content, category, status, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655461001', 'How to Create a Purchase Order', 'Step-by-step guide for creating and submitting purchase orders in the system.', 'PROCUREMENT', 'PUBLISHED', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655461002', 'Emergency Change Request Process', 'Process for handling emergency IT changes with expedited approval.', 'CHANGE_MANAGEMENT', 'PUBLISHED', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655461003', 'Inventory Transfer Best Practices', 'Guidelines for safe and efficient inventory transfers between warehouses.', 'INVENTORY', 'PUBLISHED', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================

-- Report Definitions
INSERT INTO report_definitions (id, name, description, report_type, query, parameters, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655462001', 'Monthly Spend Summary', 'Total spending by cost center and category', 'FINANCIAL', 'SELECT * FROM billing_records', '{}', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655462002', 'Incident Metrics', 'Incident response times and resolution rates', 'OPERATIONS', 'SELECT * FROM incidents', '{}', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655462003', 'Vendor Performance', 'Vendor compliance and performance metrics', 'PROCUREMENT', 'SELECT * FROM vendors', '{}', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Notification Rules
INSERT INTO notification_rules (id, event_type, trigger_condition, notification_channels, enabled, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655463001', 'INCIDENT_CREATED', 'priority = CRITICAL', '{"EMAIL","SLACK"}', true, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655463002', 'PO_APPROVED', 'amount > 50000', '{"EMAIL"}', true, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655463003', 'BUDGET_ALERT', 'utilization > 80', '{"EMAIL","DASHBOARD"}', true, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- Sample Notifications
INSERT INTO notifications (id, user_id, title, message, notification_type, read, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655464001', '550e8400-e29b-41d4-a716-446655440001', 'New Critical Incident', 'INC-2026-001: Database connection timeout has been opened', 'INCIDENT', false, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655464002', '550e8400-e29b-41d4-a716-446655440001', 'Budget Alert', 'Engineering department budget utilization at 85%', 'ALERT', false, '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655464003', '550e8400-e29b-41d4-a716-446655440002', 'PO Approved', 'Purchase order PO-2026-001 has been approved', 'APPROVAL', true, '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

-- Audit entries
INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, changes, tenant_id, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655465001', '550e8400-e29b-41d4-a716-446655440001', 'CREATE', 'INCIDENT', '550e8400-e29b-41d4-a716-446655454001', '{"title":"Database connection timeout","status":"OPEN"}', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655465002', '550e8400-e29b-41d4-a716-446655440001', 'UPDATE', 'BUDGET', '550e8400-e29b-41d4-a716-446655442001', '{"status":"ACTIVE"}', '550e8400-e29b-41d4-a716-446655440000', NOW()),
  ('550e8400-e29b-41d4-a716-446655465003', '550e8400-e29b-41d4-a716-446655440002', 'CREATE', 'PO', '550e8400-e29b-41d4-a716-446655447001', '{"status":"APPROVED","amount":45000}', '550e8400-e29b-41d4-a716-446655440000', NOW())
ON CONFLICT DO NOTHING;
