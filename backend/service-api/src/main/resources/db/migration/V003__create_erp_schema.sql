-- ============================================================================
-- V003__create_erp_schema.sql
-- OrionOps Enterprise Service Orchestration Platform - ERP Schema
-- ============================================================================
-- Creates: cost_centers, budgets, expenses, invoices, payment_records,
--          vendors, contracts, purchase_requests, purchase_orders,
--          warehouses, inventory_items, assets, stock_movements,
--          vendor_slas, vendor_performances, employees, skills,
--          employee_skills, capacity_plans, service_usages,
--          billing_records, cost_models
-- ============================================================================

-- ============================================================================
-- COST_CENTERS
-- ============================================================================
CREATE TABLE cost_centers (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    code            VARCHAR(100)    NOT NULL UNIQUE,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    owner_id        UUID            REFERENCES users (id) ON DELETE SET NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'active',
    budget_amount   DECIMAL(15, 2),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cost_centers IS 'Cost centers for budget allocation and expense tracking';
COMMENT ON COLUMN cost_centers.code IS 'Unique cost center code within the tenant';
COMMENT ON COLUMN cost_centers.budget_amount IS 'Annual budget allocation for this cost center';

CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant    ON cost_centers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_code      ON cost_centers (code);
CREATE INDEX IF NOT EXISTS idx_cost_centers_status    ON cost_centers (status);
CREATE INDEX IF NOT EXISTS idx_cost_centers_owner     ON cost_centers (owner_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_name      ON cost_centers (tenant_id, name);

CREATE TRIGGER trg_cost_centers_updated_at BEFORE UPDATE ON cost_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUDGETS
-- ============================================================================
CREATE TABLE budgets (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name                VARCHAR(255)    NOT NULL,
    cost_center_id      UUID            NOT NULL REFERENCES cost_centers (id) ON DELETE CASCADE,
    fiscal_year         INT             NOT NULL,
    allocated_amount    DECIMAL(15, 2)  NOT NULL,
    spent_amount        DECIMAL(15, 2)  NOT NULL DEFAULT 0,
    remaining_amount    DECIMAL(15, 2)  NOT NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE budgets IS 'Budget allocations per fiscal year and cost center';
COMMENT ON COLUMN budgets.fiscal_year IS 'Fiscal year for the budget (e.g., 2026)';
COMMENT ON COLUMN budgets.remaining_amount IS 'Computed remaining budget: allocated_amount - spent_amount';

CREATE INDEX IF NOT EXISTS idx_budgets_tenant        ON budgets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_cost_center   ON budgets (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status        ON budgets (status);
CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year   ON budgets (fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_cc_year       ON budgets (cost_center_id, fiscal_year);

CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VENDORS
-- ============================================================================
CREATE TABLE vendors (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    code            VARCHAR(100)    NOT NULL UNIQUE,
    contact_email   VARCHAR(320),
    contact_phone   VARCHAR(50),
    address         TEXT,
    website         VARCHAR(1024),
    vendor_type     VARCHAR(50),
    status          VARCHAR(50)     NOT NULL DEFAULT 'active',
    rating          DECIMAL(3, 2),
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendors IS 'Vendor and supplier master data';
COMMENT ON COLUMN vendors.vendor_type IS 'Type of vendor: supplier, contractor, consultant, etc.';
COMMENT ON COLUMN vendors.rating IS 'Overall vendor rating from 0.00 to 5.00';

CREATE INDEX IF NOT EXISTS idx_vendors_tenant    ON vendors (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_code      ON vendors (code);
CREATE INDEX IF NOT EXISTS idx_vendors_status    ON vendors (status);
CREATE INDEX IF NOT EXISTS idx_vendors_type      ON vendors (vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_name      ON vendors (tenant_id, name);

CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- EXPENSES
-- ============================================================================
CREATE TABLE expenses (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    description     VARCHAR(500),
    amount          DECIMAL(15, 2)  NOT NULL,
    currency        VARCHAR(3)      NOT NULL DEFAULT 'USD',
    expense_date    DATE            NOT NULL,
    category        VARCHAR(100),
    cost_center_id  UUID            REFERENCES cost_centers (id) ON DELETE SET NULL,
    service_id      UUID            REFERENCES services (id) ON DELETE SET NULL,
    incident_id     UUID            REFERENCES incidents (id) ON DELETE SET NULL,
    submitted_by    UUID            REFERENCES users (id) ON DELETE SET NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'pending',
    receipt_url     VARCHAR(1024),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE expenses IS 'Expense records linked to cost centers, services, or incidents';
COMMENT ON COLUMN expenses.currency IS 'ISO 4217 currency code (e.g., USD, EUR, GBP)';
COMMENT ON COLUMN expenses.receipt_url IS 'URL or storage path to the uploaded receipt file';

CREATE INDEX IF NOT EXISTS idx_expenses_tenant        ON expenses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_cost_center   ON expenses (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_expenses_service       ON expenses (service_id);
CREATE INDEX IF NOT EXISTS idx_expenses_incident      ON expenses (incident_id);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by  ON expenses (submitted_by);
CREATE INDEX IF NOT EXISTS idx_expenses_status        ON expenses (status);
CREATE INDEX IF NOT EXISTS idx_expenses_category      ON expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_date          ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_currency      ON expenses (currency);

CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INVOICES
-- ============================================================================
CREATE TABLE invoices (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    invoice_number  VARCHAR(100)    NOT NULL UNIQUE,
    vendor_id       UUID            REFERENCES vendors (id) ON DELETE SET NULL,
    amount          DECIMAL(15, 2)  NOT NULL,
    currency        VARCHAR(3)      NOT NULL DEFAULT 'USD',
    status          VARCHAR(50)     NOT NULL DEFAULT 'draft',
    due_date        DATE,
    paid_date       DATE,
    line_items      JSONB,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE invoices IS 'Invoices for vendor billing and accounts payable';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number for reference';
COMMENT ON COLUMN invoices.line_items IS 'Invoice line items stored as JSONB array';

CREATE INDEX IF NOT EXISTS idx_invoices_tenant        ON invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number        ON invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor        ON invoices (vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status        ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date      ON invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_date     ON invoices (paid_date) WHERE paid_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_line_items    ON invoices USING gin (line_items);

CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PAYMENT_RECORDS
-- ============================================================================
CREATE TABLE payment_records (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    invoice_id      UUID            NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
    amount          DECIMAL(15, 2)  NOT NULL,
    payment_method  VARCHAR(50),
    payment_ref     VARCHAR(255),
    status          VARCHAR(50),
    paid_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payment_records IS 'Payment transactions linked to invoices';
COMMENT ON COLUMN payment_records.payment_method IS 'Method: bank_transfer, credit_card, check, etc.';
COMMENT ON COLUMN payment_records.payment_ref IS 'External payment reference or transaction ID';

CREATE INDEX IF NOT EXISTS idx_payment_records_tenant    ON payment_records (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_invoice   ON payment_records (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status    ON payment_records (status);
CREATE INDEX IF NOT EXISTS idx_payment_records_paid_at   ON payment_records (paid_at);
CREATE INDEX IF NOT EXISTS idx_payment_records_method    ON payment_records (payment_method);

-- ============================================================================
-- CONTRACTS
-- ============================================================================
CREATE TABLE contracts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    vendor_id       UUID            NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    contract_type   VARCHAR(50),
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    value           DECIMAL(15, 2),
    status          VARCHAR(50)     NOT NULL DEFAULT 'active',
    terms           TEXT,
    auto_renew      BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contracts IS 'Vendor contracts and agreements';
COMMENT ON COLUMN contracts.contract_type IS 'Type: fixed_price, time_materials, subscription, etc.';
COMMENT ON COLUMN contracts.auto_renew IS 'Whether the contract automatically renews at end_date';

CREATE INDEX IF NOT EXISTS idx_contracts_tenant    ON contracts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor    ON contracts (vendor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status    ON contracts (status);
CREATE INDEX IF NOT EXISTS idx_contracts_type      ON contracts (contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_dates     ON contracts (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_auto_renew ON contracts (auto_renew) WHERE auto_renew = true;

CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PURCHASE_REQUESTS
-- ============================================================================
CREATE TABLE purchase_requests (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    pr_number           VARCHAR(100)    NOT NULL UNIQUE,
    title               VARCHAR(255)    NOT NULL,
    description         TEXT,
    priority            VARCHAR(50),
    status              VARCHAR(50)     NOT NULL DEFAULT 'draft',
    requester_id        UUID            REFERENCES users (id) ON DELETE SET NULL,
    assigned_buyer_id   UUID            REFERENCES users (id) ON DELETE SET NULL,
    cost_center_id      UUID            REFERENCES cost_centers (id) ON DELETE SET NULL,
    estimated_cost      DECIMAL(15, 2),
    actual_cost         DECIMAL(15, 2),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE purchase_requests IS 'Purchase requisition requests submitted by employees';
COMMENT ON COLUMN purchase_requests.pr_number IS 'Unique purchase request number';
COMMENT ON COLUMN purchase_requests.assigned_buyer_id IS 'Procurement team member assigned to fulfill the request';

CREATE INDEX IF NOT EXISTS idx_purchase_req_tenant        ON purchase_requests (tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_req_number        ON purchase_requests (pr_number);
CREATE INDEX IF NOT EXISTS idx_purchase_req_status        ON purchase_requests (status);
CREATE INDEX IF NOT EXISTS idx_purchase_req_priority      ON purchase_requests (priority);
CREATE INDEX IF NOT EXISTS idx_purchase_req_requester     ON purchase_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_purchase_req_buyer         ON purchase_requests (assigned_buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_req_cost_center   ON purchase_requests (cost_center_id);

CREATE TRIGGER trg_purchase_requests_updated_at BEFORE UPDATE ON purchase_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PURCHASE_ORDERS
-- ============================================================================
CREATE TABLE purchase_orders (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    po_number               VARCHAR(100)    NOT NULL UNIQUE,
    purchase_request_id     UUID            REFERENCES purchase_requests (id) ON DELETE SET NULL,
    vendor_id               UUID            REFERENCES vendors (id) ON DELETE SET NULL,
    status                  VARCHAR(50)     NOT NULL DEFAULT 'draft',
    total_amount            DECIMAL(15, 2)  NOT NULL,
    currency                VARCHAR(3)      NOT NULL DEFAULT 'USD',
    order_date              DATE,
    expected_delivery       DATE,
    line_items              JSONB,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE purchase_orders IS 'Purchase orders issued to vendors';
COMMENT ON COLUMN purchase_orders.po_number IS 'Unique purchase order number';
COMMENT ON COLUMN purchase_orders.line_items IS 'PO line items stored as JSONB array';

CREATE INDEX IF NOT EXISTS idx_purchase_ord_tenant        ON purchase_orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_ord_number        ON purchase_orders (po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_ord_request       ON purchase_orders (purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_ord_vendor        ON purchase_orders (vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_ord_status        ON purchase_orders (status);
CREATE INDEX IF NOT EXISTS idx_purchase_ord_order_date    ON purchase_orders (order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_ord_delivery      ON purchase_orders (expected_delivery);
CREATE INDEX IF NOT EXISTS idx_purchase_ord_line_items    ON purchase_orders USING gin (line_items);

CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WAREHOUSES
-- ============================================================================
CREATE TABLE warehouses (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name        VARCHAR(255)    NOT NULL,
    location    VARCHAR(500),
    code        VARCHAR(100)    NOT NULL UNIQUE,
    status      VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE warehouses IS 'Warehouse and storage locations for inventory management';
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse code for identification';

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant    ON warehouses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_code      ON warehouses (code);
CREATE INDEX IF NOT EXISTS idx_warehouses_status    ON warehouses (status);
CREATE INDEX IF NOT EXISTS idx_warehouses_location  ON warehouses (location);

CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INVENTORY_ITEMS
-- ============================================================================
CREATE TABLE inventory_items (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name                VARCHAR(255)    NOT NULL,
    sku                 VARCHAR(100),
    description         TEXT,
    category            VARCHAR(100),
    warehouse_id        UUID            REFERENCES warehouses (id) ON DELETE SET NULL,
    quantity            INT             NOT NULL DEFAULT 0,
    minimum_quantity    INT             NOT NULL DEFAULT 0,
    unit_cost           DECIMAL(15, 2),
    status              VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory_items IS 'Inventory items tracked across warehouses';
COMMENT ON COLUMN inventory_items.sku IS 'Stock Keeping Unit identifier';
COMMENT ON COLUMN inventory_items.minimum_quantity IS 'Reorder threshold quantity';

CREATE INDEX IF NOT EXISTS idx_inventory_tenant       ON inventory_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku          ON inventory_items (sku);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse    ON inventory_items (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status       ON inventory_items (status);
CREATE INDEX IF NOT EXISTS idx_inventory_category     ON inventory_items (category);
CREATE INDEX IF NOT EXISTS idx_inventory_name         ON inventory_items (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock    ON inventory_items (quantity, minimum_quantity) WHERE quantity <= minimum_quantity;

CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ASSETS
-- ============================================================================
CREATE TABLE assets (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    asset_tag           VARCHAR(100)    NOT NULL UNIQUE,
    name                VARCHAR(255)    NOT NULL,
    description         TEXT,
    asset_type          VARCHAR(50),
    status              VARCHAR(50)     NOT NULL DEFAULT 'in_storage',
    acquisition_date    DATE,
    purchase_cost       DECIMAL(15, 2),
    current_value       DECIMAL(15, 2),
    depreciation_rate   DECIMAL(5, 2),
    assigned_to_id      UUID            REFERENCES users (id) ON DELETE SET NULL,
    location            VARCHAR(500),
    ci_id               UUID            REFERENCES configuration_items (id) ON DELETE SET NULL,
    warranty_expiry     DATE,
    vendor_id           UUID            REFERENCES vendors (id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE assets IS 'Fixed assets and IT asset management tracking';
COMMENT ON COLUMN assets.asset_tag IS 'Unique asset tag for physical identification';
COMMENT ON COLUMN assets.depreciation_rate IS 'Annual depreciation rate as a percentage';
COMMENT ON COLUMN assets.ci_id IS 'Link to corresponding Configuration Item in the CMDB';

CREATE INDEX IF NOT EXISTS idx_assets_tenant        ON assets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_tag           ON assets (asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_type          ON assets (asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status        ON assets (status);
CREATE INDEX IF NOT EXISTS idx_assets_assigned_to   ON assets (assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_assets_ci            ON assets (ci_id);
CREATE INDEX IF NOT EXISTS idx_assets_vendor        ON assets (vendor_id);
CREATE INDEX IF NOT EXISTS idx_assets_location      ON assets (location);
CREATE INDEX IF NOT EXISTS idx_assets_warranty      ON assets (warranty_expiry) WHERE warranty_expiry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_acquisition   ON assets (acquisition_date);

CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STOCK_MOVEMENTS
-- ============================================================================
CREATE TABLE stock_movements (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    inventory_item_id   UUID            NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
    movement_type       VARCHAR(50)     NOT NULL,
    quantity            INT             NOT NULL,
    from_warehouse_id   UUID            REFERENCES warehouses (id) ON DELETE SET NULL,
    to_warehouse_id     UUID            REFERENCES warehouses (id) ON DELETE SET NULL,
    reference_type      VARCHAR(100),
    reference_id        UUID,
    performed_by        UUID            REFERENCES users (id) ON DELETE SET NULL,
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE stock_movements IS 'Inventory stock movement audit trail';
COMMENT ON COLUMN stock_movements.movement_type IS 'Type: in, out, transfer, adjustment, return';
COMMENT ON COLUMN stock_movements.reference_type IS 'Referencing entity type: purchase_order, incident, etc.';
COMMENT ON COLUMN stock_movements.reference_id IS 'UUID of the referencing entity';

CREATE INDEX IF NOT EXISTS idx_stock_mov_tenant        ON stock_movements (tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_item          ON stock_movements (inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_type          ON stock_movements (movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_mov_from_wh       ON stock_movements (from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_to_wh         ON stock_movements (to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_performed_by  ON stock_movements (performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_mov_reference     ON stock_movements (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_mov_created       ON stock_movements (created_at DESC);

-- ============================================================================
-- VENDOR_SLAS
-- ============================================================================
CREATE TABLE vendor_slas (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    vendor_id           UUID            NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
    contract_id         UUID            REFERENCES contracts (id) ON DELETE SET NULL,
    metric              VARCHAR(100)    NOT NULL,
    target_value        DECIMAL(10, 2),
    actual_value        DECIMAL(10, 2),
    measurement_period  VARCHAR(50),
    status              VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendor_slas IS 'Vendor SLA metric definitions and tracking';
COMMENT ON COLUMN vendor_slas.metric IS 'SLA metric name: on_time_delivery, defect_rate, etc.';
COMMENT ON COLUMN vendor_slas.measurement_period IS 'Period: daily, weekly, monthly, quarterly, annually';

CREATE INDEX IF NOT EXISTS idx_vendor_slas_tenant       ON vendor_slas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_slas_vendor       ON vendor_slas (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_slas_contract     ON vendor_slas (contract_id);
CREATE INDEX IF NOT EXISTS idx_vendor_slas_status       ON vendor_slas (status);
CREATE INDEX IF NOT EXISTS idx_vendor_slas_metric       ON vendor_slas (metric);

CREATE TRIGGER trg_vendor_slas_updated_at BEFORE UPDATE ON vendor_slas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VENDOR_PERFORMANCES
-- ============================================================================
CREATE TABLE vendor_performances (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    vendor_id               UUID            NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
    period_start            DATE            NOT NULL,
    period_end              DATE            NOT NULL,
    on_time_delivery_pct    DECIMAL(5, 2),
    quality_score           DECIMAL(5, 2),
    responsiveness_score    DECIMAL(5, 2),
    overall_score           DECIMAL(5, 2),
    notes                   TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendor_performances IS 'Periodic vendor performance evaluations';
COMMENT ON COLUMN vendor_performances.on_time_delivery_pct IS 'On-time delivery percentage (0.00-100.00)';
COMMENT ON COLUMN vendor_performances.overall_score IS 'Weighted composite score (0.00-100.00)';

CREATE INDEX IF NOT EXISTS idx_vendor_perf_tenant       ON vendor_performances (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_perf_vendor       ON vendor_performances (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_perf_period       ON vendor_performances (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_vendor_perf_overall      ON vendor_performances (overall_score);

-- ============================================================================
-- EMPLOYEES
-- ============================================================================
CREATE TABLE employees (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    user_id             UUID            REFERENCES users (id) ON DELETE SET NULL,
    employee_number     VARCHAR(100)    NOT NULL UNIQUE,
    department          VARCHAR(255),
    job_title           VARCHAR(255),
    hire_date           DATE,
    termination_date    DATE,
    manager_id          UUID            REFERENCES employees (id) ON DELETE SET NULL,
    status              VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE employees IS 'Employee records linked to platform users';
COMMENT ON COLUMN employees.employee_number IS 'Unique employee identifier within the tenant';
COMMENT ON COLUMN employees.manager_id IS 'Self-referencing FK to the employee record of the manager';

CREATE INDEX IF NOT EXISTS idx_employees_tenant        ON employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user          ON employees (user_id);
CREATE INDEX IF NOT EXISTS idx_employees_number        ON employees (employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department    ON employees (department);
CREATE INDEX IF NOT EXISTS idx_employees_manager       ON employees (manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status        ON employees (status);
CREATE INDEX IF NOT EXISTS idx_employees_hire_date     ON employees (hire_date);

CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SKILLS
-- ============================================================================
CREATE TABLE skills (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name        VARCHAR(255)    NOT NULL,
    category    VARCHAR(100),
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE skills IS 'Skills and competency definitions';
COMMENT ON COLUMN skills.category IS 'Skill category: technical, soft_skill, certification, etc.';

CREATE INDEX IF NOT EXISTS idx_skills_tenant    ON skills (tenant_id);
CREATE INDEX IF NOT EXISTS idx_skills_category  ON skills (category);
CREATE INDEX IF NOT EXISTS idx_skills_name      ON skills (tenant_id, name);

-- ============================================================================
-- EMPLOYEE_SKILLS (junction table)
-- ============================================================================
CREATE TABLE employee_skills (
    employee_id         UUID            NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
    skill_id            UUID            NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    proficiency_level   VARCHAR(50),

    PRIMARY KEY (employee_id, skill_id)
);

COMMENT ON TABLE employee_skills IS 'Maps employees to their skills with proficiency levels';
COMMENT ON COLUMN employee_skills.proficiency_level IS 'Skill proficiency: beginner, intermediate, advanced, expert';

CREATE INDEX IF NOT EXISTS idx_employee_skills_skill ON employee_skills (skill_id);

-- ============================================================================
-- CAPACITY_PLANS
-- ============================================================================
CREATE TABLE capacity_plans (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    team_id             UUID            NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    period_start        DATE            NOT NULL,
    period_end          DATE            NOT NULL,
    available_hours     DECIMAL(8, 2)   NOT NULL,
    allocated_hours     DECIMAL(8, 2)   NOT NULL DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE capacity_plans IS 'Team capacity planning per time period';
COMMENT ON COLUMN capacity_plans.team_id IS 'Reference to the group (team) for capacity planning';
COMMENT ON COLUMN capacity_plans.available_hours IS 'Total available team hours for the period';
COMMENT ON COLUMN capacity_plans.allocated_hours IS 'Sum of hours already allocated to work items';

CREATE INDEX IF NOT EXISTS idx_capacity_plans_tenant   ON capacity_plans (tenant_id);
CREATE INDEX IF NOT EXISTS idx_capacity_plans_team     ON capacity_plans (team_id);
CREATE INDEX IF NOT EXISTS idx_capacity_plans_period   ON capacity_plans (period_start, period_end);

CREATE TRIGGER trg_capacity_plans_updated_at BEFORE UPDATE ON capacity_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SERVICE_USAGES
-- ============================================================================
CREATE TABLE service_usages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    service_id      UUID            NOT NULL REFERENCES services (id) ON DELETE CASCADE,
    usage_type      VARCHAR(100),
    quantity        DECIMAL(12, 2)  NOT NULL,
    unit            VARCHAR(50),
    recorded_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    recorded_by     UUID            REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_usages IS 'Service usage metering records for billing';
COMMENT ON COLUMN service_usages.usage_type IS 'Type of usage metric: api_calls, storage_gb, hours, etc.';
COMMENT ON COLUMN service_usages.unit IS 'Unit of measurement: count, GB, hours, etc.';

CREATE INDEX IF NOT EXISTS idx_service_usages_tenant      ON service_usages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_usages_service     ON service_usages (service_id);
CREATE INDEX IF NOT EXISTS idx_service_usages_type        ON service_usages (usage_type);
CREATE INDEX IF NOT EXISTS idx_service_usages_recorded_at ON service_usages (recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_usages_recorded_by ON service_usages (recorded_by);

-- ============================================================================
-- BILLING_RECORDS
-- ============================================================================
CREATE TABLE billing_records (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    service_usage_id        UUID            NOT NULL REFERENCES service_usages (id) ON DELETE CASCADE,
    amount                  DECIMAL(15, 2)  NOT NULL,
    currency                VARCHAR(3)      NOT NULL DEFAULT 'USD',
    billing_period_start    DATE            NOT NULL,
    billing_period_end      DATE            NOT NULL,
    status                  VARCHAR(50)     NOT NULL DEFAULT 'pending',
    invoice_id              UUID            REFERENCES invoices (id) ON DELETE SET NULL,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE billing_records IS 'Billing records derived from service usage';
COMMENT ON COLUMN billing_records.invoice_id IS 'Link to the invoice once the billing record is invoiced';

CREATE INDEX IF NOT EXISTS idx_billing_records_tenant        ON billing_records (tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_usage         ON billing_records (service_usage_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_status        ON billing_records (status);
CREATE INDEX IF NOT EXISTS idx_billing_records_period        ON billing_records (billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_billing_records_invoice       ON billing_records (invoice_id);

CREATE TRIGGER trg_billing_records_updated_at BEFORE UPDATE ON billing_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COST_MODELS
-- ============================================================================
CREATE TABLE cost_models (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    model_type      VARCHAR(50),
    parameters      JSONB,
    service_id      UUID            REFERENCES services (id) ON DELETE SET NULL,
    effective_from  DATE,
    effective_to    DATE,
    status          VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cost_models IS 'Cost calculation models for service pricing and chargebacks';
COMMENT ON COLUMN cost_models.model_type IS 'Type: fixed, variable, tiered, usage_based, etc.';
COMMENT ON COLUMN cost_models.parameters IS 'Model-specific parameters stored as JSONB';

CREATE INDEX IF NOT EXISTS idx_cost_models_tenant    ON cost_models (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_models_service   ON cost_models (service_id);
CREATE INDEX IF NOT EXISTS idx_cost_models_status    ON cost_models (status);
CREATE INDEX IF NOT EXISTS idx_cost_models_type      ON cost_models (model_type);
CREATE INDEX IF NOT EXISTS idx_cost_models_effective ON cost_models (effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_cost_models_params    ON cost_models USING gin (parameters);

CREATE TRIGGER trg_cost_models_updated_at BEFORE UPDATE ON cost_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
