-- ---------------------------------------------------------------------------
-- V013: Fix user_roles/user_groups for @ElementCollection and create webhook_delivery_logs
-- ---------------------------------------------------------------------------
-- The User JPA entity uses @ElementCollection which expects simple string-value tables:
--   user_roles(user_id uuid, role varchar)
--   user_groups(user_id uuid, group_name varchar)
-- But the DB had normalized FK join tables. This migration renames those and creates
-- the element-collection tables, populated from the reference data.
-- Also creates the missing webhook_delivery_logs table.
-- All statements are idempotent: safe to run on a DB where the fix was already applied.
-- ---------------------------------------------------------------------------

-- 1. Rename existing normalized FK tables out of the way (skip if already renamed or absent)
ALTER TABLE IF EXISTS user_roles RENAME TO user_roles_fk;
ALTER TABLE IF EXISTS user_groups RENAME TO user_groups_fk;

-- 2. Create the @ElementCollection tables the JPA User entity expects (skip if exists)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS user_groups (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, group_name)
);

-- 3. Populate from the renamed FK reference tables (skip rows that already exist)
INSERT INTO user_roles (user_id, role)
SELECT urf.user_id, r.name
FROM user_roles_fk urf
JOIN roles r ON r.id = urf.role_id
ON CONFLICT DO NOTHING;

INSERT INTO user_groups (user_id, group_name)
SELECT ugf.user_id, g.name
FROM user_groups_fk ugf
JOIN groups g ON g.id = ugf.group_id
ON CONFLICT DO NOTHING;

-- 4. Create the missing webhook_delivery_logs table
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
    id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    tenant_id UUID NOT NULL,
    webhook_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    payload TEXT,
    response_code INTEGER,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    signature TEXT,
    latency_ms INTEGER,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook_id ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_status ON webhook_delivery_logs(status);
