-- Default tenant seed data
DO $$
DECLARE
    default_tenant_id UUID;
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Check if tenants table exists and has data
    IF NOT EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
        RAISE NOTICE 'No tenants found, creating default tenant...';

        -- Create default tenant
        INSERT INTO tenants (name, slug, domain, status, settings)
        VALUES ('Demo Company', 'demo-company', 'demo.orionops.com', 'active', '{}')
        RETURNING id INTO default_tenant_id;

        -- Create admin user
        INSERT INTO users (tenant_id, email, first_name, last_name, display_name, status, password_hash)
        VALUES (
            default_tenant_id,
            'admin@demo.com',
            'System',
            'Admin',
            'System Administrator',
            'active',
            '$2a$10$rOZXp7Gq6x9eYJ7JqJ5ZQu5F5j7j7j7j7j7j7j7j7j7j7j7j7j7j7j7j7j7' -- placeholder password
        ) RETURNING id INTO admin_user_id;

        -- Create admin role
        INSERT INTO roles (tenant_id, name, description, is_system)
        VALUES (default_tenant_id, 'admin', 'System Administrator', true)
        RETURNING id INTO admin_role_id;

        -- Assign admin role to admin user
        INSERT INTO user_roles (user_id, role_id)
        VALUES (admin_user_id, admin_role_id);

        -- Create default services
        INSERT INTO services (tenant_id, name, description, service_type, status, criticality)
        VALUES
        (default_tenant_id, 'Email Service', 'Company email system', 'technical', 'active', 'high'),
        (default_tenant_id, 'Help Desk', 'IT support ticket system', 'business', 'active', 'medium');

        -- Create default cost centers
        INSERT INTO cost_centers (tenant_id, name, owner_id, budget_amount, status)
        VALUES
        (default_tenant_id, 'IT Operations', admin_user_id, 100000.00, 'ACTIVE'),
        (default_tenant_id, 'Human Resources', admin_user_id, 75000.00, 'ACTIVE');

        RAISE NOTICE 'Default data created successfully';
    ELSE
        RAISE NOTICE 'Tenant data already exists, skipping seed creation';
    END IF;
END
$$;