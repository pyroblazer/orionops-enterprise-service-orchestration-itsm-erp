-- Procurement enhancements: workflow and contract renewals
DO $$
BEGIN
    -- Check if workflow_instance_id column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'purchase_orders' AND column_name = 'workflow_instance_id'
    ) THEN
        ALTER TABLE purchase_orders ADD COLUMN workflow_instance_id VARCHAR(255);
        RAISE NOTICE 'Added workflow_instance_id column to purchase_orders';
    ELSE
        RAISE NOTICE 'workflow_instance_id column already exists in purchase_orders';
    END IF;

    -- Check if renewal_alert_days column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts' AND column_name = 'renewal_alert_days'
    ) THEN
        ALTER TABLE contracts ADD COLUMN renewal_alert_days INT DEFAULT 30;
        RAISE NOTICE 'Added renewal_alert_days column to contracts';
    ELSE
        RAISE NOTICE 'renewal_alert_days column already exists in contracts';
    END IF;

    -- Check if owner_id column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contracts' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE contracts ADD COLUMN owner_id UUID REFERENCES users(id);
        RAISE NOTICE 'Added owner_id column to contracts';
    ELSE
        RAISE NOTICE 'owner_id column already exists in contracts';
    END IF;
END
$$;
