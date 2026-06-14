-- Billing chargeback support: cost center attribution
DO $$
BEGIN
    -- Check if cost_center_id column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'billing_records' AND column_name = 'cost_center_id'
    ) THEN
        ALTER TABLE billing_records ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id);
        RAISE NOTICE 'Added cost_center_id column to billing_records';
    ELSE
        RAISE NOTICE 'cost_center_id column already exists in billing_records';
    END IF;
END
$$;
