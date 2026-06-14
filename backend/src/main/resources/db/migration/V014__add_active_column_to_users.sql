-- Add missing columns to users table to match JPA entity
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS keycloak_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add missing index for keycloak_id
CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users (keycloak_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

COMMENT ON COLUMN users.keycloak_id IS 'Keycloak user ID for SSO sync';
COMMENT ON COLUMN users.username IS 'Unique username for local auth';
COMMENT ON COLUMN users.active IS 'Whether the user account is active';
