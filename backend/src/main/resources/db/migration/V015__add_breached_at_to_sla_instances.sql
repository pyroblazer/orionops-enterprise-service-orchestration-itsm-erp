-- Add breached_at column to sla_instances table
ALTER TABLE sla_instances ADD COLUMN IF NOT EXISTS breached_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sla_instances.breached_at IS 'Timestamp when SLA was breached (violated)';
