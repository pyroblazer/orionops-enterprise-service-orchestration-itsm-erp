-- Phase 2 entity fixes: CostCenter, Expenses, Problems
ALTER TABLE cost_centers ADD COLUMN owner_id UUID REFERENCES users(id);
ALTER TABLE cost_centers ADD COLUMN budget_amount DECIMAL(15,2);
ALTER TABLE cost_centers ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

ALTER TABLE expenses ADD COLUMN budget_id UUID REFERENCES budgets(id);

ALTER TABLE problems ADD COLUMN known_error BOOLEAN NOT NULL DEFAULT FALSE;
