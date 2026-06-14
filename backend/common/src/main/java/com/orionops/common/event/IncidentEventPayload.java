package com.orionops.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentEventPayload {
    private UUID incidentId;
    private String title;
    private String category;
    private String priority;
    private String status;
    private UUID assigneeId;
    private UUID reporterId;
    private UUID newAssigneeId;
    private String escalationLevel;
    private String escalationReason;
    private UUID escalatedBy;
    private UUID resolvedBy;
    private String resolution;
    private String resolutionCode;
}
