-- ============================================================================
-- Keycloak Schema Setup
-- Creates a dedicated "keycloak" schema in the same Supabase database
-- for Keycloak to store its tables, separate from OrionOps tables.
-- ============================================================================

-- Create the keycloak schema
CREATE SCHEMA IF NOT EXISTS keycloak;

-- Grant full access to the postgres user (used by Keycloak)
GRANT ALL ON SCHEMA keycloak TO postgres;
GRANT ALL ON SCHEMA keycloak TO anon;
GRANT ALL ON SCHEMA keycloak TO authenticated;
GRANT ALL ON SCHEMA keycloak TO service_role;

-- Set default privileges so all future tables in keycloak schema
-- are accessible to the postgres role
ALTER DEFAULT PRIVILEGES IN SCHEMA keycloak
    GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA keycloak
    GRANT ALL ON SEQUENCES TO postgres;

-- Ensure the search_path for the keycloak schema includes it
-- Keycloak will use KC_DB_SCHEMA=keycloak to target this schema
