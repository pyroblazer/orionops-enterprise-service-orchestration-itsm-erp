-- Safe entity fixes to handle existing columns
DO $$
BEGIN
    -- Check if owner_id column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cost_centers' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE cost_centers ADD COLUMN owner_id UUID REFERENCES users(id);
        RAISE NOTICE 'Added owner_id column to cost_centers';
    ELSE
        RAISE NOTICE 'owner_id column already exists in cost_centers';
    END IF;

    -- Check if budget_amount column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cost_centers' AND column_name = 'budget_amount'
    ) THEN
        ALTER TABLE cost_centers ADD COLUMN budget_amount DECIMAL(15,2);
        RAISE NOTICE 'Added budget_amount column to cost_centers';
    ELSE
        RAISE NOTICE 'budget_amount column already exists in cost_centers';
    END IF;

    -- Check if status column exists, add if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cost_centers' AND column_name = 'status'
    ) THEN
        ALTER TABLE cost_centers ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';
        RAISE NOTICE 'Added status column to cost_centers';
    ELSE
        RAISE NOTICE 'status column already exists in cost_centers';
    END IF;
END
$$;