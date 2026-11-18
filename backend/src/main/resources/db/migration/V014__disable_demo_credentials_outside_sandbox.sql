-- V014: Disable the demo username/password logins seeded by V006-V012 unless the
-- environment explicitly opts in (ORIONOPS_DEMO_CREDENTIALS=true, e.g. local sandbox).
-- Prevents admin/admin and similar well-known credentials from being usable in production.
UPDATE users
SET password_hash = NULL
WHERE username IN ('admin', 'agent', 'engineer', 'changemgr', 'sandbox')
  AND '${demo_credentials}' <> 'true';
