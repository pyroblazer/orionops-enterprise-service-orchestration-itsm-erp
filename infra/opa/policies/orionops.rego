package orionops

import future.keywords.in
import future.keywords.every

# Default: deny all access
default allow = false

# ---------------------------------------------------------------------------
# RBAC Rules
# ---------------------------------------------------------------------------

# Admin can do everything
allow {
    input.user.roles[_] == "admin"
}

# Service Desk Agent permissions
allow {
    input.action in {"create", "read", "update", "assign", "escalate", "resolve", "close"}
    input.resource.type in {"incident", "service_request"}
    input.user.roles[_] == "service_desk_agent"
}

# Resolver Engineer: read + update incidents/problems assigned to them
allow {
    input.action in {"read", "update"}
    input.resource.type in {"incident", "problem"}
    input.user.roles[_] == "resolver_engineer"
    input.resource.assignee_id == input.user.id
}

# Change Manager: manage changes and approvals
allow {
    input.action in {"create", "read", "update", "approve", "reject", "implement", "close"}
    input.resource.type == "change_request"
    input.user.roles[_] == "change_manager"
}

# Service Owner: read all, update services and SLAs
allow {
    input.action == "read"
    input.user.roles[_] in {"service_owner", "service_desk_agent", "resolver_engineer", "change_manager", "viewer"}
}

allow {
    input.action in {"create", "update"}
    input.resource.type in {"service", "sla_definition"}
    input.user.roles[_] == "service_owner"
}

# Viewer: read only
allow {
    input.action == "read"
    input.user.roles[_] == "viewer"
}

# ---------------------------------------------------------------------------
# Tenant Isolation (ABAC)
# ---------------------------------------------------------------------------

# Users can only access resources in their own tenant
allow {
    input.user.tenant_id == input.resource.tenant_id
}

# Deny cross-tenant access
deny_cross_tenant {
    input.user.tenant_id != input.resource.tenant_id
}

# ---------------------------------------------------------------------------
# Field-Level Access Control
# ---------------------------------------------------------------------------

# Only finance role can access financial data
allow_field {
    input.resource.type in {"budget", "expense", "invoice", "payment_record", "cost_center"}
    input.user.roles[_] in {"admin", "finance_manager"}
}

# Only managers can approve high-risk changes
allow_field {
    input.action == "approve"
    input.resource.type == "change_request"
    input.resource.risk_level == "high"
    input.user.roles[_] in {"admin", "change_manager"}
}

# ---------------------------------------------------------------------------
# Context-Aware: Emergency Changes
# ---------------------------------------------------------------------------

# Only on-call personnel can approve emergency changes
allow {
    input.action == "approve"
    input.resource.type == "change_request"
    input.resource.change_type == "emergency"
    input.user.roles[_] in {"admin", "change_manager"}
    input.user.on_call == true
}

# Emergency changes skip normal approval if user is on-call manager
allow {
    input.action == "auto_approve"
    input.resource.type == "change_request"
    input.resource.change_type == "emergency"
    input.user.roles[_] in {"admin", "change_manager"}
    input.user.on_call == true
}

# ---------------------------------------------------------------------------
# Row-Level Security: Groups
# ---------------------------------------------------------------------------

# Users can view incidents assigned to their groups
allow {
    input.action == "read"
    input.resource.type == "incident"
    input.resource.assignment_group_id in input.user.group_ids
}

# Users can view all incidents if they have service_desk_agent or above role
allow {
    input.action == "read"
    input.resource.type == "incident"
    input.user.roles[_] in {"admin", "service_desk_agent", "change_manager"}
}
