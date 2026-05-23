-- ============================================================================
-- V002__create_itsm_schema.sql
-- OrionOps Enterprise Service Orchestration Platform - ITSM Schema
-- ============================================================================
-- Creates: services, configuration_items, ci_relationships, incidents,
--          problems, change_requests, service_requests, sla_definitions,
--          sla_instances, knowledge_articles, workflow_definitions,
--          workflow_instances, approvals, assignments, comments, attachments
-- ============================================================================

-- ============================================================================
-- SERVICES (Service Catalog)
-- ============================================================================
CREATE TABLE services (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    service_type    VARCHAR(50),
    owner_id        UUID            REFERENCES users (id) ON DELETE SET NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'active',
    criticality     VARCHAR(50),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE services IS 'Business and IT services in the service catalog';
COMMENT ON COLUMN services.service_type IS 'Type of service: business, technical, supporting';
COMMENT ON COLUMN services.criticality IS 'Business criticality level: critical, high, medium, low';

CREATE INDEX idx_services_tenant_id    ON services (tenant_id);
CREATE INDEX idx_services_status       ON services (status);
CREATE INDEX idx_services_type         ON services (service_type);
CREATE INDEX idx_services_owner        ON services (owner_id);
CREATE INDEX idx_services_criticality  ON services (criticality);
CREATE INDEX idx_services_name         ON services (tenant_id, name);

CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CONFIGURATION_ITEMS (CMDB)
-- ============================================================================
CREATE TABLE configuration_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name            VARCHAR(255)    NOT NULL,
    ci_type         VARCHAR(100)    NOT NULL,
    description     TEXT,
    environment     VARCHAR(50),
    owner_id        UUID            REFERENCES users (id) ON DELETE SET NULL,
    service_id      UUID            REFERENCES services (id) ON DELETE SET NULL,
    attributes      JSONB,
    status          VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE configuration_items IS 'Configuration Items in the CMDB';
COMMENT ON COLUMN configuration_items.ci_type IS 'CI type: server, application, database, network_device, etc.';
COMMENT ON COLUMN configuration_items.environment IS 'Deployment environment: production, staging, development, etc.';
COMMENT ON COLUMN configuration_items.attributes IS 'Flexible CI attributes stored as JSONB';

CREATE INDEX idx_ci_tenant_id      ON configuration_items (tenant_id);
CREATE INDEX idx_ci_type           ON configuration_items (ci_type);
CREATE INDEX idx_ci_status         ON configuration_items (status);
CREATE INDEX idx_ci_environment    ON configuration_items (environment);
CREATE INDEX idx_ci_owner          ON configuration_items (owner_id);
CREATE INDEX idx_ci_service        ON configuration_items (service_id);
CREATE INDEX idx_ci_name           ON configuration_items (tenant_id, name);
CREATE INDEX idx_ci_attributes     ON configuration_items USING gin (attributes);

CREATE TRIGGER trg_configuration_items_updated_at BEFORE UPDATE ON configuration_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CI_RELATIONSHIPS
-- ============================================================================
CREATE TABLE ci_relationships (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_ci_id        UUID            NOT NULL REFERENCES configuration_items (id) ON DELETE CASCADE,
    target_ci_id        UUID            NOT NULL REFERENCES configuration_items (id) ON DELETE CASCADE,
    relationship_type   VARCHAR(100)    NOT NULL,
    description         TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ci_relationship UNIQUE (source_ci_id, target_ci_id, relationship_type)
);

COMMENT ON TABLE ci_relationships IS 'Relationships between Configuration Items';
COMMENT ON COLUMN ci_relationships.relationship_type IS 'Type: depends_on, hosts, connects_to, contains, etc.';

CREATE INDEX idx_ci_rel_source ON ci_relationships (source_ci_id);
CREATE INDEX idx_ci_rel_target ON ci_relationships (target_ci_id);
CREATE INDEX idx_ci_rel_type   ON ci_relationships (relationship_type);

-- ============================================================================
-- INCIDENTS
-- ============================================================================
CREATE TABLE incidents (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    incident_number         VARCHAR(50)     NOT NULL UNIQUE,
    title                   VARCHAR(500)    NOT NULL,
    description             TEXT,
    status                  VARCHAR(50)     NOT NULL DEFAULT 'open',
    priority                VARCHAR(50),
    impact                  VARCHAR(50),
    urgency                 VARCHAR(50),
    category                VARCHAR(100),
    subcategory             VARCHAR(100),
    service_id              UUID            REFERENCES services (id) ON DELETE SET NULL,
    ci_id                   UUID            REFERENCES configuration_items (id) ON DELETE SET NULL,
    reporter_id             UUID            REFERENCES users (id) ON DELETE SET NULL,
    assignee_id             UUID            REFERENCES users (id) ON DELETE SET NULL,
    assignment_group_id     UUID            REFERENCES groups (id) ON DELETE SET NULL,
    parent_incident_id      UUID            REFERENCES incidents (id) ON DELETE SET NULL,
    resolution_code         VARCHAR(50),
    resolution_notes        TEXT,
    resolved_at             TIMESTAMP WITH TIME ZONE,
    closed_at               TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE incidents IS 'ITIL Incident records for service disruption tracking';
COMMENT ON COLUMN incidents.incident_number IS 'Human-readable auto-incremented incident identifier';
COMMENT ON COLUMN incidents.priority IS 'Calculated priority based on impact and urgency matrix';
COMMENT ON COLUMN incidents.parent_incident_id IS 'Link to parent incident for major incident management';

CREATE INDEX idx_incidents_tenant           ON incidents (tenant_id);
CREATE INDEX idx_incidents_number           ON incidents (incident_number);
CREATE INDEX idx_incidents_status           ON incidents (status);
CREATE INDEX idx_incidents_priority         ON incidents (priority);
CREATE INDEX idx_incidents_service          ON incidents (service_id);
CREATE INDEX idx_incidents_ci               ON incidents (ci_id);
CREATE INDEX idx_incidents_reporter         ON incidents (reporter_id);
CREATE INDEX idx_incidents_assignee         ON incidents (assignee_id);
CREATE INDEX idx_incidents_group            ON incidents (assignment_group_id);
CREATE INDEX idx_incidents_parent           ON incidents (parent_incident_id);
CREATE INDEX idx_incidents_category         ON incidents (category);
CREATE INDEX idx_incidents_created          ON incidents (created_at DESC);
CREATE INDEX idx_incidents_tenant_status    ON incidents (tenant_id, status);
CREATE INDEX idx_incidents_resolved         ON incidents (resolved_at) WHERE resolved_at IS NOT NULL;

CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PROBLEMS
-- ============================================================================
CREATE TABLE problems (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    problem_number      VARCHAR(50)     NOT NULL UNIQUE,
    title               VARCHAR(500),
    description         TEXT,
    status              VARCHAR(50),
    priority            VARCHAR(50),
    category            VARCHAR(100),
    root_cause          TEXT,
    workaround          TEXT,
    known_error         BOOLEAN         NOT NULL DEFAULT false,
    service_id          UUID            REFERENCES services (id) ON DELETE SET NULL,
    assignee_id         UUID            REFERENCES users (id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE problems IS 'ITIL Problem records for root cause analysis';
COMMENT ON COLUMN problems.known_error IS 'Flag indicating if this problem is a documented known error';
COMMENT ON COLUMN problems.root_cause IS 'Root cause analysis findings';

CREATE INDEX idx_problems_tenant       ON problems (tenant_id);
CREATE INDEX idx_problems_number       ON problems (problem_number);
CREATE INDEX idx_problems_status       ON problems (status);
CREATE INDEX idx_problems_priority     ON problems (priority);
CREATE INDEX idx_problems_service      ON problems (service_id);
CREATE INDEX idx_problems_assignee     ON problems (assignee_id);
CREATE INDEX idx_problems_known_error  ON problems (known_error) WHERE known_error = true;

CREATE TRIGGER trg_problems_updated_at BEFORE UPDATE ON problems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CHANGE_REQUESTS
-- ============================================================================
CREATE TABLE change_requests (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    change_number       VARCHAR(50)     NOT NULL UNIQUE,
    title               VARCHAR(500),
    description         TEXT,
    change_type         VARCHAR(50)     NOT NULL DEFAULT 'normal',
    status              VARCHAR(50),
    risk_level          VARCHAR(50),
    impact_level        VARCHAR(50),
    reason              TEXT,
    implementation_plan TEXT,
    rollback_plan       TEXT,
    test_plan           TEXT,
    service_id          UUID            REFERENCES services (id) ON DELETE SET NULL,
    requester_id        UUID            REFERENCES users (id) ON DELETE SET NULL,
    assignee_id         UUID            REFERENCES users (id) ON DELETE SET NULL,
    scheduled_start     TIMESTAMP WITH TIME ZONE,
    scheduled_end       TIMESTAMP WITH TIME ZONE,
    implemented_at      TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE change_requests IS 'ITIL Change Request records for change management';
COMMENT ON COLUMN change_requests.change_type IS 'Type: standard, normal, emergency';
COMMENT ON COLUMN change_requests.risk_level IS 'Risk assessment: high, medium, low';

CREATE INDEX idx_change_req_tenant         ON change_requests (tenant_id);
CREATE INDEX idx_change_req_number         ON change_requests (change_number);
CREATE INDEX idx_change_req_status         ON change_requests (status);
CREATE INDEX idx_change_req_type           ON change_requests (change_type);
CREATE INDEX idx_change_req_service        ON change_requests (service_id);
CREATE INDEX idx_change_req_requester      ON change_requests (requester_id);
CREATE INDEX idx_change_req_assignee       ON change_requests (assignee_id);
CREATE INDEX idx_change_req_scheduled      ON change_requests (scheduled_start, scheduled_end);
CREATE INDEX idx_change_req_risk           ON change_requests (risk_level);

CREATE TRIGGER trg_change_requests_updated_at BEFORE UPDATE ON change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SERVICE_REQUESTS
-- ============================================================================
CREATE TABLE service_requests (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    request_number      VARCHAR(50)     NOT NULL UNIQUE,
    title               VARCHAR(500),
    description         TEXT,
    status              VARCHAR(50),
    priority            VARCHAR(50),
    catalog_item_id     UUID,
    service_id          UUID            REFERENCES services (id) ON DELETE SET NULL,
    requester_id        UUID            REFERENCES users (id) ON DELETE SET NULL,
    assignee_id         UUID            REFERENCES users (id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE service_requests IS 'Service request records from the service catalog';
COMMENT ON COLUMN service_requests.catalog_item_id IS 'Reference to the service catalog item being requested';

CREATE INDEX idx_service_req_tenant       ON service_requests (tenant_id);
CREATE INDEX idx_service_req_number       ON service_requests (request_number);
CREATE INDEX idx_service_req_status       ON service_requests (status);
CREATE INDEX idx_service_req_service      ON service_requests (service_id);
CREATE INDEX idx_service_req_requester    ON service_requests (requester_id);
CREATE INDEX idx_service_req_assignee     ON service_requests (assignee_id);

CREATE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SLA_DEFINITIONS
-- ============================================================================
CREATE TABLE sla_definitions (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name                        VARCHAR(255),
    description                 TEXT,
    service_id                  UUID            REFERENCES services (id) ON DELETE CASCADE,
    priority                    VARCHAR(50),
    target_response_minutes     INT,
    target_resolution_minutes   INT,
    calendar_id                 VARCHAR(100),
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sla_definitions IS 'SLA policy definitions mapping services/priorities to target times';
COMMENT ON COLUMN sla_definitions.calendar_id IS 'Reference to the business hours calendar for SLA calculations';
COMMENT ON COLUMN sla_definitions.target_response_minutes IS 'Target time in minutes for first response';
COMMENT ON COLUMN sla_definitions.target_resolution_minutes IS 'Target time in minutes for full resolution';

CREATE INDEX idx_sla_def_tenant    ON sla_definitions (tenant_id);
CREATE INDEX idx_sla_def_service   ON sla_definitions (service_id);
CREATE INDEX idx_sla_def_priority  ON sla_definitions (priority);

CREATE TRIGGER trg_sla_definitions_updated_at BEFORE UPDATE ON sla_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SLA_INSTANCES
-- ============================================================================
CREATE TABLE sla_instances (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    sla_definition_id       UUID            NOT NULL REFERENCES sla_definitions (id) ON DELETE CASCADE,
    entity_type             VARCHAR(100)    NOT NULL,
    entity_id               UUID            NOT NULL,
    status                  VARCHAR(50)     NOT NULL DEFAULT 'active',
    response_target_at      TIMESTAMP WITH TIME ZONE,
    resolution_target_at    TIMESTAMP WITH TIME ZONE,
    responded_at            TIMESTAMP WITH TIME ZONE,
    resolved_at             TIMESTAMP WITH TIME ZONE,
    paused_at               TIMESTAMP WITH TIME ZONE,
    total_paused_minutes    INT             NOT NULL DEFAULT 0,
    breach_notified         BOOLEAN         NOT NULL DEFAULT false,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sla_instances IS 'Active SLA tracking instances attached to tickets';
COMMENT ON COLUMN sla_instances.entity_type IS 'Type of entity: incident, service_request, etc.';
COMMENT ON COLUMN sla_instances.total_paused_minutes IS 'Cumulative pause time for SLA pause/calculation';
COMMENT ON COLUMN sla_instances.breach_notified IS 'Whether a breach warning notification has been sent';

CREATE INDEX idx_sla_inst_tenant        ON sla_instances (tenant_id);
CREATE INDEX idx_sla_inst_definition    ON sla_instances (sla_definition_id);
CREATE INDEX idx_sla_inst_entity        ON sla_instances (entity_type, entity_id);
CREATE INDEX idx_sla_inst_status        ON sla_instances (status);
CREATE INDEX idx_sla_inst_response_tgt  ON sla_instances (response_target_at) WHERE status = 'active';
CREATE INDEX idx_sla_inst_resolution_tgt ON sla_instances (resolution_target_at) WHERE status = 'active';
CREATE INDEX idx_sla_inst_breach        ON sla_instances (breach_notified) WHERE breach_notified = false AND status = 'active';

CREATE TRIGGER trg_sla_instances_updated_at BEFORE UPDATE ON sla_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- KNOWLEDGE_ARTICLES
-- ============================================================================
CREATE TABLE knowledge_articles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    title           VARCHAR(500),
    content         TEXT,
    article_type    VARCHAR(50),
    status          VARCHAR(50)     NOT NULL DEFAULT 'draft',
    category        VARCHAR(100),
    tags            TEXT[],
    author_id       UUID            REFERENCES users (id) ON DELETE SET NULL,
    reviewer_id     UUID            REFERENCES users (id) ON DELETE SET NULL,
    published_at    TIMESTAMP WITH TIME ZONE,
    views           INT             NOT NULL DEFAULT 0,
    helpful_count   INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE knowledge_articles IS 'Knowledge base articles for self-service and agent support';
COMMENT ON COLUMN knowledge_articles.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN knowledge_articles.helpful_count IS 'Count of positive feedback votes from users';

CREATE INDEX idx_kb_tenant       ON knowledge_articles (tenant_id);
CREATE INDEX idx_kb_status       ON knowledge_articles (status);
CREATE INDEX idx_kb_type         ON knowledge_articles (article_type);
CREATE INDEX idx_kb_category     ON knowledge_articles (category);
CREATE INDEX idx_kb_author       ON knowledge_articles (author_id);
CREATE INDEX idx_kb_tags         ON knowledge_articles USING gin (tags);
CREATE INDEX idx_kb_published    ON knowledge_articles (published_at DESC) WHERE status = 'published';
CREATE INDEX idx_kb_search       ON knowledge_articles USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

CREATE TRIGGER trg_knowledge_articles_updated_at BEFORE UPDATE ON knowledge_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORKFLOW_DEFINITIONS
-- ============================================================================
CREATE TABLE workflow_definitions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    name        VARCHAR(255)    NOT NULL,
    bpmn_xml    TEXT,
    version     INT             NOT NULL DEFAULT 1,
    status      VARCHAR(50)     NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workflow_definitions IS 'BPMN workflow definitions for process automation';
COMMENT ON COLUMN workflow_definitions.bpmn_xml IS 'BPMN 2.0 XML process definition';
COMMENT ON COLUMN workflow_definitions.version IS 'Version number incremented on each update';

CREATE INDEX idx_workflow_def_tenant   ON workflow_definitions (tenant_id);
CREATE INDEX idx_workflow_def_status   ON workflow_definitions (status);
CREATE INDEX idx_workflow_def_name_ver ON workflow_definitions (tenant_id, name, version);

CREATE TRIGGER trg_workflow_definitions_updated_at BEFORE UPDATE ON workflow_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WORKFLOW_INSTANCES
-- ============================================================================
CREATE TABLE workflow_instances (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    definition_id   UUID            NOT NULL REFERENCES workflow_definitions (id) ON DELETE CASCADE,
    business_key    VARCHAR(255),
    entity_type     VARCHAR(100),
    entity_id       UUID,
    status          VARCHAR(50)     NOT NULL DEFAULT 'running',
    started_at      TIMESTAMP WITH TIME ZONE,
    completed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE workflow_instances IS 'Running or completed workflow process instances';
COMMENT ON COLUMN workflow_instances.business_key IS 'Correlation key linking to the business entity';

CREATE INDEX idx_workflow_inst_tenant      ON workflow_instances (tenant_id);
CREATE INDEX idx_workflow_inst_definition  ON workflow_instances (definition_id);
CREATE INDEX idx_workflow_inst_status      ON workflow_instances (status);
CREATE INDEX idx_workflow_inst_entity      ON workflow_instances (entity_type, entity_id);
CREATE INDEX idx_workflow_inst_business    ON workflow_instances (business_key);

CREATE TRIGGER trg_workflow_instances_updated_at BEFORE UPDATE ON workflow_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- APPROVALS
-- ============================================================================
CREATE TABLE approvals (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_type         VARCHAR(100)    NOT NULL,
    entity_id           UUID            NOT NULL,
    approver_id         UUID            REFERENCES users (id) ON DELETE CASCADE,
    approver_group_id   UUID            REFERENCES groups (id) ON DELETE CASCADE,
    status              VARCHAR(50)     NOT NULL DEFAULT 'pending',
    comments            TEXT,
    requested_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    responded_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE approvals IS 'Approval records for change requests, purchase requests, etc.';
COMMENT ON COLUMN approvals.entity_type IS 'Type of entity requiring approval: change_request, purchase_request, etc.';
COMMENT ON COLUMN approvals.approver_id IS 'Individual user approver (NULL if group approval)';

CREATE INDEX idx_approvals_tenant        ON approvals (tenant_id);
CREATE INDEX idx_approvals_entity        ON approvals (entity_type, entity_id);
CREATE INDEX idx_approvals_approver      ON approvals (approver_id);
CREATE INDEX idx_approvals_group         ON approvals (approver_group_id);
CREATE INDEX idx_approvals_status        ON approvals (status);
CREATE INDEX idx_approvals_pending       ON approvals (status, approver_id) WHERE status = 'pending';

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================
CREATE TABLE assignments (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type         VARCHAR(100)    NOT NULL,
    entity_id           UUID            NOT NULL,
    assignee_id         UUID            REFERENCES users (id) ON DELETE CASCADE,
    assignee_group_id   UUID            REFERENCES groups (id) ON DELETE CASCADE,
    assignment_type     VARCHAR(50),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE assignments IS 'Assignment history records for ticket routing';
COMMENT ON COLUMN assignments.assignment_type IS 'Type: manual, auto, escalation, etc.';

CREATE INDEX idx_assignments_entity     ON assignments (entity_type, entity_id);
CREATE INDEX idx_assignments_assignee   ON assignments (assignee_id);
CREATE INDEX idx_assignments_group      ON assignments (assignee_group_id);
CREATE INDEX idx_assignments_type       ON assignments (assignment_type);

-- ============================================================================
-- COMMENTS
-- ============================================================================
CREATE TABLE comments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_type     VARCHAR(100)    NOT NULL,
    entity_id       UUID            NOT NULL,
    author_id       UUID            REFERENCES users (id) ON DELETE SET NULL,
    content         TEXT            NOT NULL,
    comment_type    VARCHAR(50)     NOT NULL DEFAULT 'comment',
    is_internal     BOOLEAN         NOT NULL DEFAULT false,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE comments IS 'Comments and activity entries on tickets and entities';
COMMENT ON COLUMN comments.comment_type IS 'Type: comment, system_note, resolution, etc.';
COMMENT ON COLUMN comments.is_internal IS 'If true, visible only to agents; not shown to end users';

CREATE INDEX idx_comments_tenant    ON comments (tenant_id);
CREATE INDEX idx_comments_entity    ON comments (entity_type, entity_id);
CREATE INDEX idx_comments_author    ON comments (author_id);
CREATE INDEX idx_comments_type      ON comments (comment_type);
CREATE INDEX idx_comments_created   ON comments (created_at DESC);

CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ATTACHMENTS
-- ============================================================================
CREATE TABLE attachments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
    entity_type     VARCHAR(100)    NOT NULL,
    entity_id       UUID            NOT NULL,
    file_name       VARCHAR(500)    NOT NULL,
    file_path       VARCHAR(1024)   NOT NULL,
    file_size       BIGINT          NOT NULL,
    mime_type       VARCHAR(255),
    uploaded_by     UUID            REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE attachments IS 'File attachments linked to any entity';
COMMENT ON COLUMN attachments.file_path IS 'Storage path or object key for the uploaded file';
COMMENT ON COLUMN attachments.file_size IS 'File size in bytes';

CREATE INDEX idx_attachments_tenant   ON attachments (tenant_id);
CREATE INDEX idx_attachments_entity   ON attachments (entity_type, entity_id);
CREATE INDEX idx_attachments_uploaded ON attachments (uploaded_by);
CREATE INDEX idx_attachments_created  ON attachments (created_at DESC);
