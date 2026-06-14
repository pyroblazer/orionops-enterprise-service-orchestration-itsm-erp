-- V012: Add keycloak_id, username columns and BCrypt password hashes for local login
-- Enables username/password authentication without Keycloak.
-- Passwords match usernames: admin/admin, agent/agent, engineer/engineer,
--   changemgr/changemgr, sandbox/sandbox

DO $$
BEGIN
    -- Add keycloak_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'keycloak_id'
    ) THEN
        ALTER TABLE users ADD COLUMN keycloak_id VARCHAR(255);
        RAISE NOTICE 'Added keycloak_id column to users';
    ELSE
        RAISE NOTICE 'keycloak_id column already exists in users';
    END IF;

    -- Add username column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(255);
        RAISE NOTICE 'Added username column to users';
    ELSE
        RAISE NOTICE 'username column already exists in users';
    END IF;
END;
$$;

-- Create unique index on keycloak_id (only if column was just added)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_keycloak_id ON users (keycloak_id);

-- Create index on username for login lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- Populate keycloak_id: for the 5 seed users, their UUID serves as both user ID and keycloak ID
UPDATE users SET keycloak_id = id::TEXT
WHERE keycloak_id IS NULL
  AND id IN (
    'a1a1a1a1-1111-1111-1111-111111111101',
    'a1a1a1a1-1111-1111-1111-111111111102',
    'a1a1a1a1-1111-1111-1111-111111111103',
    'a1a1a1a1-1111-1111-1111-111111111104',
    'a1a1a1a1-1111-1111-1111-111111111105'
  );

-- Populate username from email prefix for the seed users
UPDATE users SET username = split_part(email, '@', 1)
WHERE username IS NULL
  AND id IN (
    'a1a1a1a1-1111-1111-1111-111111111101',
    'a1a1a1a1-1111-1111-1111-111111111102',
    'a1a1a1a1-1111-1111-1111-111111111103',
    'a1a1a1a1-1111-1111-1111-111111111104',
    'a1a1a1a1-1111-1111-1111-111111111105'
  );

-- Set BCrypt password hashes (password = username for each seed user)
-- admin/admin
UPDATE users SET password_hash = '$2b$10$vDJm.5HDA72LA9e2PFpYHuVk2t9qiVCPLw779utODvf437PVoUblG'
WHERE id = 'a1a1a1a1-1111-1111-1111-111111111101';

-- agent/agent
UPDATE users SET password_hash = '$2b$10$z7ugWuKjmbHyOXI5kR0v8.p0RaZ3adXImP9iUVBHRO.C.6ywqRfPC'
WHERE id = 'a1a1a1a1-1111-1111-1111-111111111102';

-- engineer/engineer
UPDATE users SET password_hash = '$2b$10$4yvTSGTBJnGg2KETQYdUpeEoj2Fva8pQWneql9Dnp.j5PO4LxOzFu'
WHERE id = 'a1a1a1a1-1111-1111-1111-111111111103';

-- changemgr/changemgr
UPDATE users SET password_hash = '$2b$10$M1NHFC9tbp2Uwp7tBmcsJudQ8nshXdEbEKw.FkLDgwxMEI2ltwNwG'
WHERE id = 'a1a1a1a1-1111-1111-1111-111111111104';

-- sandbox/sandbox
UPDATE users SET password_hash = '$2b$10$KC3YvO1zl9IE9Bf1Z.aEr.jugA9t/H/lHjR9aM7aBwDnOUTyD6ywC'
WHERE id = 'a1a1a1a1-1111-1111-1111-111111111105';
