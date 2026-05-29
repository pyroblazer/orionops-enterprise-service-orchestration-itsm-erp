-- Add missing IF NOT EXISTS to indexes for safety
-- This migration updates indexes created in V001 to use IF NOT EXISTS

DO $$
BEGIN
    -- Re-create indexes with IF NOT EXISTS for safety
    CREATE INDEX IF NOT EXISTS idx_tenants_slug    ON tenants (slug);
    CREATE INDEX IF NOT EXISTS idx_tenants_domain  ON tenants (domain);
    CREATE INDEX IF NOT EXISTS idx_tenants_status  ON tenants (status);
    CREATE INDEX IF NOT EXISTS idx_tenants_deleted ON tenants (deleted_at) WHERE deleted_at IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_users_tenant_id    ON users (tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email);
    CREATE INDEX IF NOT EXISTS idx_users_status       ON users (status);
    CREATE INDEX IF NOT EXISTS idx_users_department   ON users (department);
    CREATE INDEX IF NOT EXISTS idx_users_deleted      ON users (deleted_at) WHERE deleted_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_name_search  ON users (tenant_id, first_name, last_name);

    CREATE INDEX IF NOT EXISTS idx_roles_tenant_id  ON roles (tenant_id);
    CREATE INDEX IF NOT EXISTS idx_roles_system     ON roles (is_system) WHERE is_system = true;

    CREATE INDEX IF NOT EXISTS idx_groups_tenant_id  ON groups (tenant_id);
    CREATE INDEX IF NOT EXISTS idx_groups_parent_id  ON groups (parent_id);
    CREATE INDEX IF NOT EXISTS idx_groups_type       ON groups (group_type);
    CREATE INDEX IF NOT EXISTS idx_groups_name       ON groups (tenant_id, name);

    CREATE INDEX IF NOT EXISTS idx_permissions_resource     ON permissions (resource);
    CREATE INDEX IF NOT EXISTS idx_permissions_action       ON permissions (action);

    CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
    CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups (group_id);

    CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);

    CREATE INDEX IF NOT EXISTS idx_audit_events_tenant        ON audit_events (tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_events_user          ON audit_events (user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_events_resource      ON audit_events (resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_events_action        ON audit_events (action);
    CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp     ON audit_events (timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_time   ON audit_events (tenant_id, timestamp DESC);

    RAISE NOTICE 'All indexes recreated with IF NOT EXISTS';
END
$$;