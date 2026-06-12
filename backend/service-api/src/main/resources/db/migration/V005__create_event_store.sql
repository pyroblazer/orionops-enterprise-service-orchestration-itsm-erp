-- ============================================================================
-- V005__create_event_store.sql
-- OrionOps Enterprise Service Orchestration Platform - Event Store
-- ============================================================================
-- Creates: event_store (event-sourcing / CQRS append-only log)
-- ============================================================================

-- ============================================================================
-- EVENT_STORE
-- ============================================================================
CREATE TABLE event_store (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type  VARCHAR(100)    NOT NULL,
    aggregate_id    UUID            NOT NULL,
    event_type      VARCHAR(100)    NOT NULL,
    event_version   INT             NOT NULL,
    payload         JSONB           NOT NULL,
    metadata        JSONB,
    sequence_number BIGSERIAL,
    timestamp       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_event_store_aggregate_seq UNIQUE (aggregate_id, sequence_number)
);

COMMENT ON TABLE event_store IS 'Append-only event store for event sourcing and CQRS';
COMMENT ON COLUMN event_store.aggregate_type IS 'Type of aggregate root: incident, change_request, purchase_order, etc.';
COMMENT ON COLUMN event_store.aggregate_id IS 'UUID of the aggregate root instance';
COMMENT ON COLUMN event_store.event_type IS 'Specific event type: incident_created, status_changed, etc.';
COMMENT ON COLUMN event_store.event_version IS 'Schema version of the event for backward compatibility';
COMMENT ON COLUMN event_store.payload IS 'Event payload data stored as JSONB';
COMMENT ON COLUMN event_store.metadata IS 'Optional metadata (correlation_id, causation_id, user_id, etc.)';
COMMENT ON COLUMN event_store.sequence_number IS 'Monotonically increasing sequence for ordering events within an aggregate';

-- Indexes for common event store query patterns
CREATE INDEX IF NOT EXISTS idx_event_store_aggregate ON event_store (aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_event_store_sequence  ON event_store (aggregate_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_event_store_type      ON event_store (event_type);
CREATE INDEX IF NOT EXISTS idx_event_store_timestamp ON event_store (timestamp);

-- Additional indexes for event store operations
CREATE INDEX IF NOT EXISTS idx_event_store_agg_type     ON event_store (aggregate_type);
CREATE INDEX IF NOT EXISTS idx_event_store_version      ON event_store (event_version);
CREATE INDEX IF NOT EXISTS idx_event_store_payload      ON event_store USING gin (payload);
CREATE INDEX IF NOT EXISTS idx_event_store_metadata     ON event_store USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_event_store_seq_global   ON event_store (sequence_number);
CREATE INDEX IF NOT EXISTS idx_event_store_type_time    ON event_store (event_type, timestamp DESC);
