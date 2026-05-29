-- ============================================================================
-- V001__create_platform_schema.sql
-- OrionOps Enterprise Service Orchestration Platform - Core Platform Schema
-- ============================================================================
-- Creates: tenants, users, roles, groups, permissions, user_roles,
--          user_groups, role_permissions, audit_events
-- ============================================================================

-- Enable UUID generation (PostgreSQL 13+ has gen_random_uuid() built-in,
-- but we ensure the extension is available for older versions)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS
-- ============================================================================
COMMENT ON SCHEMA public IS 'OrionOps Platform - Core Schema';

CREATE TABLE tenants (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255)    NOT NULL,
    slug        VARCHAR(100)     UNIQUE,
    domain      VARCHAR(255),
    status      VARCHAR(50)      NOT NULL DEFAULT 'active',
    settings    JSONB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE          -- soft delete
);

COMMENT ON TABLE tenants IS 'Multi-tenant organizations using the platform';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly unique identifier for the tenant';
COMMENT ON COLUMN tenants.domain IS 'Custom domain for tenant access';
COMMENT ON COLUMN tenants.settings IS 'Tenant-specific configuration as JSONB';
COMMENT ON COLUMN tenants.deleted_at IS 'Soft delete timestamp; NULL means active';

CREATE INDEX idx_tenants_slug    ON tenants (slug);
CREATE INDEX idx_tenants_domain  ON tenants (domain);
CREATE INDEX idx_tenants_status  ON tenants (status);
CREATE INDEX idx_tenants_deleted ON tenants (deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    email           VARCHAR(320)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    first_name      VARCHAR(100),
    last_name       VARCHAR(100),
    display_name    VARCHAR(255),
    avatar_url      VARCHAR(1024),
    phone           VARCHAR(50),
    department      VARCHAR(255),
    title           VARCHAR(255),
    status          VARCHAR(50)     NOT NULL DEFAULT 'active',
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP WITH TIME ZONE  -- soft delete
);

COMMENT ON TABLE users IS 'Platform users belonging to a tenant';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt or Argon2 hashed password';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp; NULL means active';

CREATE INDEX idx_users_tenant_id    ON users (tenant_id);
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_status       ON users (status);
CREATE INDEX idx_users_department   ON users (department);
CREATE INDEX idx_users_deleted      ON users (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_users_name_search  ON users (tenant_id, first_name, last_name);

-- ============================================================================
-- ROLES
-- ============================================================================
CREATE TABLE roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name        VARCHAR(100)    NOT NULL,
    description TEXT,
    is_system   BOOLEAN         NOT NULL DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_roles_tenant_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE roles IS 'Role definitions for RBAC within a tenant';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be modified or deleted';

CREATE INDEX idx_roles_tenant_id  ON roles (tenant_id);
CREATE INDEX idx_roles_system     ON roles (is_system) WHERE is_system = true;

-- ============================================================================
-- GROUPS
-- ============================================================================
CREATE TABLE groups (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name        VARCHAR(255)    NOT NULL,
    description TEXT,
    group_type  VARCHAR(50)     NOT NULL DEFAULT 'team',
    parent_id   UUID            REFERENCES groups (id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE groups IS 'Organizational groups (teams, departments, etc.)';
COMMENT ON COLUMN groups.group_type IS 'Type of group: team, department, division, etc.';
COMMENT ON COLUMN groups.parent_id IS 'Parent group for hierarchical structures';

CREATE INDEX idx_groups_tenant_id  ON groups (tenant_id);
CREATE INDEX idx_groups_parent_id  ON groups (parent_id);
CREATE INDEX idx_groups_type       ON groups (group_type);
CREATE INDEX idx_groups_name       ON groups (tenant_id, name);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
CREATE TABLE permissions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255)    NOT NULL UNIQUE,
    resource    VARCHAR(100)    NOT NULL,
    action      VARCHAR(50)     NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action)
);

COMMENT ON TABLE permissions IS 'Granular permission definitions (resource:action)';
COMMENT ON COLUMN permissions.resource IS 'The resource being accessed (e.g., incidents, users)';
COMMENT ON COLUMN permissions.action IS 'The action permitted (e.g., create, read, update, delete)';

CREATE INDEX idx_permissions_resource     ON permissions (resource);
CREATE INDEX idx_permissions_action       ON permissions (action);

-- ============================================================================
-- USER_ROLES (junction table)
-- ============================================================================
CREATE TABLE user_roles (
    user_id     UUID    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id     UUID    NOT NULL REFERENCES roles (id) ON DELETE CASCADE,

    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Maps users to their assigned roles';

CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

-- ============================================================================
-- USER_GROUPS (junction table)
-- ============================================================================
CREATE TABLE user_groups (
    user_id     UUID    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    group_id    UUID    NOT NULL REFERENCES groups (id) ON DELETE CASCADE,

    PRIMARY KEY (user_id, group_id)
);

COMMENT ON TABLE user_groups IS 'Maps users to their group memberships';

CREATE INDEX idx_user_groups_group_id ON user_groups (group_id);

-- ============================================================================
-- ROLE_PERMISSIONS (junction table)
-- ============================================================================
CREATE TABLE role_permissions (
    role_id         UUID    NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission_id   UUID    NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,

    PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Maps roles to their granted permissions';

CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);

-- ============================================================================
-- AUDIT_EVENTS (immutable append-only log)
-- ============================================================================
CREATE TABLE audit_events (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    user_id         UUID            REFERENCES users (id) ON DELETE SET NULL,
    action          VARCHAR(100)    NOT NULL,
    resource_type   VARCHAR(100)    NOT NULL,
    resource_id     UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    timestamp       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_events IS 'Immutable audit trail of all significant platform events';
COMMENT ON COLUMN audit_events.action IS 'The action performed (e.g., create, update, delete, login)';
COMMENT ON COLUMN audit_events.resource_type IS 'Type of resource affected (e.g., incident, user)';
COMMENT ON COLUMN audit_events.old_values IS 'Previous state of the resource before the action (JSONB)';
COMMENT ON COLUMN audit_events.new_values IS 'New state of the resource after the action (JSONB)';
COMMENT ON COLUMN audit_events.ip_address IS 'IPv4 or IPv6 address of the client';

-- High-performance indexes for audit queries
CREATE INDEX idx_audit_events_tenant        ON audit_events (tenant_id);
CREATE INDEX idx_audit_events_user          ON audit_events (user_id);
CREATE INDEX idx_audit_events_resource      ON audit_events (resource_type, resource_id);
CREATE INDEX idx_audit_events_action        ON audit_events (action);
CREATE INDEX idx_audit_events_timestamp     ON audit_events (timestamp DESC);
CREATE INDEX idx_audit_events_tenant_time   ON audit_events (tenant_id, timestamp DESC);

-- Prevent updates and deletes on audit_events (append-only)
-- Using a trigger to enforce immutability at the database level
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_events table is immutable: % operations are not permitted', TG_OP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_prevent_audit_delete
    BEFORE DELETE ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================================
-- HELPER: updated_at trigger function (reusable across all tables)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_roles_updated_at   BEFORE UPDATE ON roles   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_groups_updated_at  BEFORE UPDATE ON groups  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
