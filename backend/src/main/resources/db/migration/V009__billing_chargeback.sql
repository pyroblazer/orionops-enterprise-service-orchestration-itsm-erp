-- Billing chargeback support: cost center attribution
ALTER TABLE billing_records ADD COLUMN cost_center_id UUID REFERENCES cost_centers(id);
