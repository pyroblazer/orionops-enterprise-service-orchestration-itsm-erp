-- Add audit columns (created_by, updated_by) to sla_instances table
ALTER TABLE sla_instances ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE sla_instances ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

COMMENT ON COLUMN sla_instances.created_by IS 'User ID who created this SLA instance';
COMMENT ON COLUMN sla_instances.updated_by IS 'User ID who last updated this SLA instance';
