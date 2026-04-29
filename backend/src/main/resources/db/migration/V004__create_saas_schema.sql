-- ============================================================================
-- V004__create_saas_schema.sql
-- OrionOps Enterprise Service Orchestration Platform - SaaS Schema
-- ============================================================================
-- Creates: plans, subscriptions, payments, notifications, integration_endpoints
-- ============================================================================

-- ============================================================================
-- PLANS
-- ============================================================================
CREATE TABLE plans (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)    NOT NULL UNIQUE,
    description     TEXT,
    price_monthly   DECIMAL(10, 2),
    price_yearly    DECIMAL(10, 2),
    currency        VARCHAR(3)      NOT NULL DEFAULT 'USD',
    features        JSONB,
    limits          JSONB,
    is_active       BOOLEAN         NOT NULL DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE plans IS 'SaaS subscription plan definitions';
COMMENT ON COLUMN plans.price_monthly IS 'Monthly subscription price';
COMMENT ON COLUMN plans.price_yearly IS 'Annual subscription price (billed yearly)';
COMMENT ON COLUMN plans.features IS 'JSONB array of feature flags and entitlements';
COMMENT ON COLUMN plans.limits IS 'JSONB object of usage limits (e.g., max_users, max_incidents)';

CREATE INDEX IF NOT EXISTS idx_plans_name       ON plans (name);
CREATE INDEX IF NOT EXISTS idx_plans_active     ON plans (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plans_features   ON plans USING gin (features);
CREATE INDEX IF NOT EXISTS idx_plans_limits     ON plans USING gin (limits);

CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE subscriptions (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    plan_id                 UUID            NOT NULL REFERENCES plans (id) ON DELETE CASCADE,
    stripe_customer_id      VARCHAR(255),
    stripe_subscription_id  VARCHAR(255),
    status                  VARCHAR(50)     NOT NULL DEFAULT 'active',
    current_period_start    TIMESTAMP WITH TIME ZONE,
    current_period_end      TIMESTAMP WITH TIME ZONE,
    trial_ends_at           TIMESTAMP WITH TIME ZONE,
    cancelled_at            TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Tenant subscription records linked to billing plans';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer identifier for payment processing';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription identifier for sync';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'Trial period end timestamp; NULL if no trial';

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant        ON subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan          ON subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status        ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_cust   ON subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub    ON subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end    ON subscriptions (current_period_end) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial         ON subscriptions (trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancelled     ON subscriptions (cancelled_at) WHERE cancelled_at IS NOT NULL;

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE TABLE payments (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    subscription_id     UUID            NOT NULL REFERENCES subscriptions (id) ON DELETE CASCADE,
    stripe_payment_id   VARCHAR(255),
    amount              DECIMAL(15, 2)  NOT NULL,
    currency            VARCHAR(3)      NOT NULL DEFAULT 'USD',
    status              VARCHAR(50),
    payment_method      VARCHAR(50),
    paid_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'Payment transaction records for subscription billing';
COMMENT ON COLUMN payments.stripe_payment_id IS 'Stripe payment intent or charge identifier';
COMMENT ON COLUMN payments.payment_method IS 'Method: card, bank_transfer, invoice, etc.';

CREATE INDEX IF NOT EXISTS idx_payments_tenant        ON payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription  ON payments (subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe        ON payments (stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at       ON payments (paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_method        ON payments (payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created       ON payments (created_at DESC);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE notifications (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    user_id             UUID            NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    notification_type   VARCHAR(100)    NOT NULL,
    title               VARCHAR(500)    NOT NULL,
    message             TEXT,
    entity_type         VARCHAR(100),
    entity_id           UUID,
    channel             VARCHAR(50)     NOT NULL DEFAULT 'in_app',
    status              VARCHAR(50)     NOT NULL DEFAULT 'unread',
    read_at             TIMESTAMP WITH TIME ZONE,
    sent_at             TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'User notification records across channels';
COMMENT ON COLUMN notifications.notification_type IS 'Type: incident_assigned, sla_breach, approval_required, etc.';
COMMENT ON COLUMN notifications.entity_type IS 'Related entity type: incident, change_request, etc.';
COMMENT ON COLUMN notifications.entity_id IS 'UUID of the related entity';
COMMENT ON COLUMN notifications.channel IS 'Delivery channel: in_app, email, sms, webhook';

CREATE INDEX IF NOT EXISTS idx_notifications_tenant    ON notifications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type      ON notifications (notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_status    ON notifications (status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel   ON notifications (channel);
CREATE INDEX IF NOT EXISTS idx_notifications_entity    ON notifications (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON notifications (user_id, status) WHERE status = 'unread';
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at   ON notifications (sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON notifications (created_at DESC);

-- ============================================================================
-- INTEGRATION_ENDPOINTS
-- ============================================================================
CREATE TABLE integration_endpoints (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name                VARCHAR(255)    NOT NULL,
    endpoint_type       VARCHAR(50),
    url                 VARCHAR(2048),
    method              VARCHAR(10),
    headers             JSONB,
    auth_type           VARCHAR(50),
    auth_config         JSONB,
    is_active           BOOLEAN         NOT NULL DEFAULT true,
    last_triggered_at   TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE integration_endpoints IS 'Webhook and integration endpoint configurations';
COMMENT ON COLUMN integration_endpoints.endpoint_type IS 'Type: webhook, email, slack, teams, custom';
COMMENT ON COLUMN integration_endpoints.auth_type IS 'Authentication type: none, basic, bearer, api_key, oauth2';
COMMENT ON COLUMN integration_endpoints.auth_config IS 'Authentication configuration stored as JSONB (credentials masked)';

CREATE INDEX IF NOT EXISTS idx_int_endpoints_tenant      ON integration_endpoints (tenant_id);
CREATE INDEX IF NOT EXISTS idx_int_endpoints_type        ON integration_endpoints (endpoint_type);
CREATE INDEX IF NOT EXISTS idx_int_endpoints_active      ON integration_endpoints (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_int_endpoints_triggered   ON integration_endpoints (last_triggered_at);

CREATE TRIGGER trg_integration_endpoints_updated_at BEFORE UPDATE ON integration_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
