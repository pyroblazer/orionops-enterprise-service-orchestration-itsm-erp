package com.orionops.modules.integration.entity;

import com.orionops.common.auditing.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "integration_endpoints")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationEndpoint extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private IntegrationType type;

    @Column(nullable = false)
    private String url;

    @Column
    private String method;

    @Column(columnDefinition = "TEXT")
    private String headers;

    @Column(columnDefinition = "TEXT")
    private String authConfig;

    @Column(columnDefinition = "TEXT")
    private String payloadTemplate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IntegrationStatus status = IntegrationStatus.ACTIVE;

    @Builder.Default
    @Column(nullable = false)
    private boolean verifySsl = true;

    @Column
    private Integer timeoutSeconds;

    public enum IntegrationType {
        WEBHOOK, REST_API, EMAIL, SLACK, TEAMS, JIRA, SERVICENOW, CUSTOM
    }

    public enum IntegrationStatus {
        ACTIVE, INACTIVE, ERROR
    }
}
