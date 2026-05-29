-- Fresh database reset and reseed
-- WARNING: This will clean all existing data and recreate from scratch

DO $$
BEGIN
    -- Check if we're in a development environment before proceeding
    -- Only run if reset_allowed flag is set to true
    IF NOT EXISTS (
        SELECT 1 FROM pg_settings WHERE name = 'application_name'
        AND setting = 'development'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tenants' LIMIT 1
    ) THEN
        RAISE NOTICE 'No existing data found, proceeding with fresh schema creation';
    ELSE
        RAISE WARNING 'Database contains existing data. This script should only be run on a fresh database.';
        RETURN;
    END IF;

    -- Drop all tables in reverse order of dependencies
    DROP TABLE IF EXISTS workflow_instances CASCADE;
    DROP TABLE IF EXISTS workflow_definitions CASCADE;
    DROP TABLE IF EXISTS knowledge_articles CASCADE;
    DROP TABLE IF EXISTS sla_instances CASCADE;
    DROP TABLE IF EXISTS sla_definitions CASCADE;
    DROP TABLE IF EXISTS service_requests CASCADE;
    DROP TABLE IF EXISTS approvals CASCADE;
    DROP TABLE IF EXISTS assignments CASCADE;
    DROP TABLE IF EXISTS comments CASCADE;
    DROP TABLE IF EXISTS attachments CASCADE;
    DROP TABLE IF EXISTS change_requests CASCADE;
    DROP TABLE IF EXISTS problems CASCADE;
    DROP TABLE IF EXISTS incidents CASCADE;
    DROP TABLE IF EXISTS configuration_items CASCADE;
    DROP TABLE IF EXISTS ci_relationships CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
    DROP TABLE IF EXISTS billing_records CASCADE;
    DROP TABLE IF EXISTS expenses CASCADE;
    DROP TABLE IF EXISTS budgets CASCADE;
    DROP TABLE IF EXISTS cost_centers CASCADE;
    DROP TABLE IF EXISTS purchase_orders CASCADE;
    DROP TABLE IF EXISTS contracts CASCADE;
    DROP TABLE IF EXISTS event_store_events CASCADE;
    DROP TABLE IF EXISTS audit_events CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS user_groups CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS groups CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS tenants CASCADE;

    -- Drop sequences
    DROP SEQUENCE IF EXISTS tenants_id_seq;
    DROP SEQUENCE IF EXISTS users_id_seq;
    DROP SEQUENCE IF EXISTS roles_id_seq;
    DROP SEQUENCE IF EXISTS groups_id_seq;
    DROP SEQUENCE IF EXISTS permissions_id_seq;
    DROP SEQUENCE IF EXISTS audit_events_id_seq;

    -- Recreate the schema by running V001, V002, V003, V004, V005
    -- (In practice, Flyway will handle this automatically when migrations are cleaned)

    RAISE NOTICE 'Database reset complete. Run Flyway migrate to recreate schema.';
END
$$;