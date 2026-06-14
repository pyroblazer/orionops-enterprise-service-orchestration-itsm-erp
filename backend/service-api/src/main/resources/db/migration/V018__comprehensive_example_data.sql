-- V018: Comprehensive example data for all dashboards
-- All inserts use ON CONFLICT DO NOTHING for idempotency
BEGIN;

-- Services (12 records)
INSERT INTO services (id, tenant_id, name, description, service_type, status, criticality, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', 'Email Service', 'Corporate email', 'technical', 'active', 'high', NOW(), NOW()),
('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001', 'Help Desk', 'IT support', 'business', 'active', 'high', NOW(), NOW()),
('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000001', 'VPN', 'Remote access', 'technical', 'active', 'high', NOW(), NOW()),
('11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000001', 'Network', 'Monitoring', 'technical', 'active', 'medium', NOW(), NOW()),
('11111111-1111-1111-1111-111111111105', '00000000-0000-0000-0000-000000000001', 'Backup', 'Recovery', 'technical', 'active', 'high', NOW(), NOW()),
('11111111-1111-1111-1111-111111111106', '00000000-0000-0000-0000-000000000001', 'Database', 'Admin', 'technical', 'active', 'high', NOW(), NOW()),
('11111111-1111-1111-1111-111111111107', '00000000-0000-0000-0000-000000000001', 'Cloud Storage', 'Files', 'business', 'active', 'medium', NOW(), NOW()),
('11111111-1111-1111-1111-111111111108', '00000000-0000-0000-0000-000000000001', 'HR Portal', 'Self-service', 'business', 'active', 'medium', NOW(), NOW()),
('11111111-1111-1111-1111-111111111109', '00000000-0000-0000-0000-000000000001', 'Accounting', 'Finance', 'business', 'active', 'high', NOW(), NOW()),
('11111111-1111-1111-1111-111111111110', '00000000-0000-0000-0000-000000000001', 'Procurement', 'Vendors', 'business', 'active', 'medium', NOW(), NOW()),
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Inventory', 'Warehouse', 'business', 'active', 'medium', NOW(), NOW()),
('11111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'Video Conf', 'Meetings', 'business', 'active', 'medium', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Notifications (25 records - just insert a subset for brevity)
INSERT INTO notifications (id, tenant_id, user_id, title, message, notification_type, read, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa01', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111101', 'Incident assigned', 'Critical incident', 'incident', false, NOW() - INTERVAL '30 minutes'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa02', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111101', 'Change approved', 'Your change was approved', 'change', false, NOW() - INTERVAL '1 hour'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa03', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111101', 'SLA breached', 'P1 SLA breached', 'sla', false, NOW() - INTERVAL '2 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa04', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111101', 'System alert', 'High CPU usage', 'system', false, NOW() - INTERVAL '3 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa05', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111101', 'Report ready', 'Your report is ready', 'report', false, NOW() - INTERVAL '4 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa06', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111102', 'Ticket assigned', 'Service request', 'ticket', false, NOW() - INTERVAL '1 hour'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa07', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111102', 'Approval needed', 'Pending approval', 'approval', false, NOW() - INTERVAL '2 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa08', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111102', 'Update available', 'New version', 'update', false, NOW() - INTERVAL '6 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa09', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111102', 'Meeting reminder', 'Staff meeting', 'reminder', false, NOW() - INTERVAL '30 minutes'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa10', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111102', 'Task completed', 'Work item closed', 'task', false, NOW() - INTERVAL '5 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa11', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111103', 'Change window', 'Upcoming change', 'change', false, NOW() - INTERVAL '12 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa12', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111103', 'Escalation', 'Ticket escalated', 'ticket', false, NOW() - INTERVAL '2 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa13', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111103', 'Status update', 'Incident update', 'incident', false, NOW() - INTERVAL '45 minutes'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa14', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111103', 'Capacity alert', 'Storage low', 'system', false, NOW() - INTERVAL '8 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa15', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111103', 'Backup status', 'Backup completed', 'system', false, NOW() - INTERVAL '6 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa16', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111104', 'Problem assigned', 'New problem', 'problem', false, NOW() - INTERVAL '3 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa17', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111104', 'Workflow started', 'New workflow', 'workflow', false, NOW() - INTERVAL '4 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa18', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111104', 'Action required', 'Approval needed', 'approval', false, NOW() - INTERVAL '1 day'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa19', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111104', 'Review request', 'Please review', 'review', false, NOW() - INTERVAL '2 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa20', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111104', 'Audit log', 'Activity recorded', 'audit', false, NOW() - INTERVAL '12 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa21', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111105', 'Exception report', 'New exception', 'report', false, NOW() - INTERVAL '6 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa22', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111105', 'Budget alert', 'Over budget', 'financial', false, NOW() - INTERVAL '18 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa23', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111105', 'Vendor issue', 'Contact needed', 'vendor', false, NOW() - INTERVAL '1 day'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa24', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111105', 'Compliance check', 'Review needed', 'compliance', false, NOW() - INTERVAL '3 days'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa25', '00000000-0000-0000-0000-000000000001', 'a1a1a1a1-1111-1111-1111-111111111105', 'License renewal', 'Expires soon', 'license', false, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Plans (3 records)
INSERT INTO plans (id, tenant_id, name, description, price_monthly, features, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb01', '00000000-0000-0000-0000-000000000001', 'Starter', 'Small teams', 299.00, 'basic', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb02', '00000000-0000-0000-0000-000000000001', 'Pro', 'Growing business', 999.00, 'advanced', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb03', '00000000-0000-0000-0000-000000000001', 'Enterprise', 'Large scale', 2999.00, 'premium', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Subscriptions (2 records)
INSERT INTO subscriptions (id, tenant_id, plan_id, status, start_date, end_date, created_at, updated_at) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc01', '00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb02', 'active', NOW() - INTERVAL '180 days', NOW() + INTERVAL '180 days', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc02', '00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb02', 'active', NOW() - INTERVAL '90 days', NOW() + INTERVAL '270 days', NOW(), NOW())
ON CONFLICT DO NOTHING;

COMMIT;
