-- ClickHouse OLAP Schema for OrionOps Analytics
-- Used for historical analysis, trend reporting, and executive dashboards

-- Incidents fact table (populated via CDC from PostgreSQL)
CREATE TABLE IF NOT EXISTS incidents_fact (
    id UUID,
    tenant_id UUID,
    incident_number String,
    title String,
    status LowCardinality(String),
    priority LowCardinality(String),
    impact LowCardinality(String),
    urgency LowCardinality(String),
    category LowCardinality(String),
    service_id UUID,
    service_name String,
    reporter_id UUID,
    assignee_id UUID,
    assignment_group_id UUID,
    created_at DateTime,
    resolved_at Nullable(DateTime),
    closed_at Nullable(DateTime),
    resolution_code Nullable(String),
    response_minutes Nullable(Float64),
    resolution_minutes Nullable(Float64),
    date Date MATERIALIZED toDate(created_at)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, date, incident_number)
TTL date + INTERVAL 3 YEAR;

-- SLA instances fact table
CREATE TABLE IF NOT EXISTS sla_instances_fact (
    id UUID,
    tenant_id UUID,
    sla_definition_id UUID,
    sla_name String,
    entity_type LowCardinality(String),
    entity_id UUID,
    status LowCardinality(String),
    response_target_at DateTime,
    resolution_target_at DateTime,
    responded_at Nullable(DateTime),
    resolved_at Nullable(DateTime),
    total_paused_minutes Float64 DEFAULT 0,
    response_minutes Nullable(Float64),
    resolution_minutes Nullable(Float64),
    breached UInt8 DEFAULT 0,
    response_breached UInt8 DEFAULT 0,
    created_at DateTime,
    date Date MATERIALIZED toDate(created_at)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, date, status, breached)
TTL date + INTERVAL 3 YEAR;

-- Change requests fact table
CREATE TABLE IF NOT EXISTS changes_fact (
    id UUID,
    tenant_id UUID,
    change_number String,
    title String,
    change_type LowCardinality(String),
    status LowCardinality(String),
    risk_level LowCardinality(String),
    impact_level LowCardinality(String),
    service_id UUID,
    service_name String,
    requester_id UUID,
    approver_id Nullable(UUID),
    scheduled_start Nullable(DateTime),
    scheduled_end Nullable(DateTime),
    implemented_at Nullable(DateTime),
    created_at DateTime,
    closed_at Nullable(DateTime),
    outcome Nullable(LowCardinality(String)),
    implementation_duration_minutes Nullable(Float64),
    approval_duration_minutes Nullable(Float64),
    date Date MATERIALIZED toDate(created_at)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, date, change_type, status)
TTL date + INTERVAL 3 YEAR;

-- Materialized view: Daily incident summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_incident_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, date, priority, status)
AS SELECT
    tenant_id,
    date,
    priority,
    status,
    count() AS incident_count,
    avg(resolution_minutes) AS avg_resolution_minutes,
    avg(response_minutes) AS avg_response_minutes,
    sumIf(1, breached = 1) AS breached_count
FROM incidents_fact
GROUP BY tenant_id, date, priority, status;

-- Materialized view: SLA compliance daily
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sla_compliance
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, date)
AS SELECT
    tenant_id,
    date,
    count() AS total_instances,
    sumIf(1, breached = 1) AS total_breached,
    sumIf(1, response_breached = 1) AS total_response_breached,
    avg(response_minutes) AS avg_response_minutes,
    avg(resolution_minutes) AS avg_resolution_minutes
FROM sla_instances_fact
GROUP BY tenant_id, date;
