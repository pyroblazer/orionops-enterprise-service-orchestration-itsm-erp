-- Procurement enhancements: workflow and contract renewals
ALTER TABLE purchase_orders ADD COLUMN workflow_instance_id VARCHAR(255);

ALTER TABLE contracts ADD COLUMN renewal_alert_days INT DEFAULT 30;
ALTER TABLE contracts ADD COLUMN owner_id UUID REFERENCES users(id);
