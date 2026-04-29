package com.orionops.modules.cmdb.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.cmdb.dto.CIRelationshipResponse;
import com.orionops.modules.cmdb.dto.CIRequest;
import com.orionops.modules.cmdb.dto.CIResponse;
import com.orionops.modules.cmdb.entity.CIRelationship;
import com.orionops.modules.cmdb.entity.ConfigurationItem;
import com.orionops.modules.cmdb.repository.CIRelationshipRepository;
import com.orionops.modules.cmdb.repository.ConfigurationItemRepository;
import com.orionops.modules.cmdb.repository.ServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link CMDBService}.
 * Covers CRUD for configuration items, relationships, and impact analysis.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CMDBService")
class CMDBServiceTest {

    @Mock
    private ConfigurationItemRepository ciRepository;

    @Mock
    private CIRelationshipRepository relationshipRepository;

    @Mock
    private ServiceRepository serviceRepository;

    @InjectMocks
    private CMDBService cmdbService;

    private ConfigurationItem testCI;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        testCI = ConfigurationItem.builder()
                .name("prod-web-server-01")
                .description("Production web server")
                .type(ConfigurationItem.CIType.SERVER)
                .status(ConfigurationItem.CIStatus.ACTIVE)
                .environment("production")
                .ownerId("team-infra")
                .location("DC-East")
                .tenantId(tenantId)
                .build();
        testCI.setId(UUID.randomUUID());
        testCI.setCreatedAt(LocalDateTime.now());
        testCI.setUpdatedAt(LocalDateTime.now());
        testCI.setCreatedBy("admin");
    }

    @Nested
    @DisplayName("createCI")
    class CreateCITests {

        @Test
        @DisplayName("should create configuration item")
        void shouldCreateCI_whenValidRequest_givenAllFields() {
            CIRequest request = CIRequest.builder()
                    .name("db-server-01")
                    .description("Database server")
                    .type(ConfigurationItem.CIType.DATABASE)
                    .status(ConfigurationItem.CIStatus.ACTIVE)
                    .environment("production")
                    .ownerId("team-dba")
                    .location("DC-West")
                    .build();

            when(ciRepository.save(any(ConfigurationItem.class))).thenAnswer(invocation -> {
                ConfigurationItem ci = invocation.getArgument(0);
                ci.setId(UUID.randomUUID());
                ci.setCreatedAt(LocalDateTime.now());
                ci.setUpdatedAt(LocalDateTime.now());
                return ci;
            });

            CIResponse response = cmdbService.createCI(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("db-server-01");
            assertThat(response.getType()).isEqualTo(ConfigurationItem.CIType.DATABASE);
            assertThat(response.getStatus()).isEqualTo(ConfigurationItem.CIStatus.ACTIVE);
        }
    }

    @Nested
    @DisplayName("getCI")
    class GetCITests {

        @Test
        @DisplayName("should return CI by ID")
        void shouldReturnCI_whenFound_givenValidId() {
            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));

            CIResponse response = cmdbService.getCI(testCI.getId());

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("prod-web-server-01");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when not found")
        void shouldThrowNotFoundException_whenNotFound_givenInvalidId() {
            UUID randomId = UUID.randomUUID();
            when(ciRepository.findById(randomId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> cmdbService.getCI(randomId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ConfigurationItem");
        }
    }

    @Nested
    @DisplayName("updateCI")
    class UpdateCITests {

        @Test
        @DisplayName("should update CI fields")
        void shouldUpdateCI_whenValidRequest_givenExistingCI() {
            CIRequest request = CIRequest.builder()
                    .name("updated-server-name")
                    .environment("staging")
                    .build();

            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));
            when(ciRepository.save(any(ConfigurationItem.class))).thenReturn(testCI);

            CIResponse response = cmdbService.updateCI(testCI.getId(), request);

            assertThat(response).isNotNull();
            verify(ciRepository).save(any(ConfigurationItem.class));
        }
    }

    @Nested
    @DisplayName("deleteCI")
    class DeleteCITests {

        @Test
        @DisplayName("should soft delete CI")
        void shouldSoftDelete_whenDeleting_givenExistingCI() {
            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));
            when(ciRepository.save(any(ConfigurationItem.class))).thenReturn(testCI);

            cmdbService.deleteCI(testCI.getId());

            assertThat(testCI.isDeleted()).isTrue();
        }
    }

    @Nested
    @DisplayName("createRelationship")
    class CreateRelationshipTests {

        @Test
        @DisplayName("should create relationship between two CIs")
        void shouldCreateRelationship_whenValid_givenSourceAndTarget() {
            ConfigurationItem targetCI = ConfigurationItem.builder()
                    .name("prod-lb-01")
                    .type(ConfigurationItem.CIType.NETWORK_DEVICE)
                    .status(ConfigurationItem.CIStatus.ACTIVE)
                    .tenantId(tenantId)
                    .build();
            targetCI.setId(UUID.randomUUID());
            targetCI.setCreatedAt(LocalDateTime.now());
            targetCI.setCreatedBy("admin");

            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));
            when(ciRepository.findById(targetCI.getId())).thenReturn(Optional.of(targetCI));
            when(relationshipRepository.save(any(CIRelationship.class))).thenAnswer(invocation -> {
                CIRelationship rel = invocation.getArgument(0);
                rel.setId(UUID.randomUUID());
                rel.setCreatedAt(LocalDateTime.now());
                return rel;
            });
            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));
            when(ciRepository.findById(targetCI.getId())).thenReturn(Optional.of(targetCI));

            CIRelationshipResponse response = cmdbService.createRelationship(
                    testCI.getId(), targetCI.getId(), "DEPENDS_ON", "Web server depends on load balancer");

            assertThat(response).isNotNull();
            verify(relationshipRepository).save(any(CIRelationship.class));
        }
    }

    @Nested
    @DisplayName("getRelationships")
    class GetRelationshipsTests {

        @Test
        @DisplayName("should return relationships for a CI")
        void shouldReturnRelationships_whenFound_givenCIId() {
            ConfigurationItem relatedCI = ConfigurationItem.builder()
                    .name("related-server").type(ConfigurationItem.CIType.SERVER)
                    .status(ConfigurationItem.CIStatus.ACTIVE).tenantId(tenantId).build();
            relatedCI.setId(UUID.randomUUID());
            relatedCI.setCreatedBy("admin");

            CIRelationship rel = CIRelationship.builder()
                    .sourceCiId(testCI.getId())
                    .targetCiId(relatedCI.getId())
                    .relationshipType("DEPENDS_ON")
                    .description("Depends on")
                    .tenantId(tenantId)
                    .build();
            rel.setId(UUID.randomUUID());

            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));
            when(relationshipRepository.findByCiId(testCI.getId())).thenReturn(List.of(rel));
            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));
            when(ciRepository.findById(relatedCI.getId())).thenReturn(Optional.of(relatedCI));

            List<CIRelationshipResponse> relationships = cmdbService.getRelationships(testCI.getId());

            assertThat(relationships).hasSize(1);
            assertThat(relationships.get(0).getRelationshipType()).isEqualTo("DEPENDS_ON");
        }
    }

    @Nested
    @DisplayName("getImpactAnalysis")
    class ImpactAnalysisTests {

        @Test
        @DisplayName("should perform BFS traversal of relationship graph")
        void shouldReturnImpactedCIs_whenAnalysing_givenRelationshipGraph() {
            ConfigurationItem ci2 = ConfigurationItem.builder()
                    .name("app-server").type(ConfigurationItem.CIType.APPLICATION)
                    .status(ConfigurationItem.CIStatus.ACTIVE).tenantId(tenantId).build();
            ci2.setId(UUID.randomUUID());
            ci2.setCreatedBy("admin");

            ConfigurationItem ci3 = ConfigurationItem.builder()
                    .name("db-server").type(ConfigurationItem.CIType.DATABASE)
                    .status(ConfigurationItem.CIStatus.ACTIVE).tenantId(tenantId).build();
            ci3.setId(UUID.randomUUID());
            ci3.setCreatedBy("admin");

            // testCI -> ci2 -> ci3 (transitive dependency chain)
            CIRelationship rel1 = CIRelationship.builder()
                    .sourceCiId(testCI.getId()).targetCiId(ci2.getId())
                    .relationshipType("DEPENDS_ON").tenantId(tenantId).build();
            rel1.setId(UUID.randomUUID());

            CIRelationship rel2 = CIRelationship.builder()
                    .sourceCiId(ci2.getId()).targetCiId(ci3.getId())
                    .relationshipType("DEPENDS_ON").tenantId(tenantId).build();
            rel2.setId(UUID.randomUUID());

            when(ciRepository.findById(testCI.getId())).thenReturn(Optional.of(testCI));
            when(relationshipRepository.findByCiId(testCI.getId())).thenReturn(List.of(rel1));
            when(relationshipRepository.findByCiId(ci2.getId())).thenReturn(List.of(rel2));
            when(ciRepository.findAllById(any(Iterable.class)))
                    .thenReturn(List.of(ci2, ci3));

            List<CIResponse> impacted = cmdbService.getImpactAnalysis(testCI.getId());

            assertThat(impacted).isNotEmpty();
            assertThat(impacted).hasSizeGreaterThanOrEqualTo(2);
        }
    }
}
