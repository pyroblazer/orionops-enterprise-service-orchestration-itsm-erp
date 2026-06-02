package com.orionops.modules.procurement.service;

import com.orionops.common.exception.BusinessRuleException;
import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.notification.service.NotificationService;
import com.orionops.modules.procurement.dto.ProcurementRequest;
import com.orionops.modules.procurement.dto.ProcurementResponse;
import com.orionops.modules.procurement.entity.Contract;
import com.orionops.modules.procurement.entity.PurchaseOrder;
import com.orionops.modules.procurement.entity.PurchaseRequest;
import com.orionops.modules.procurement.entity.Vendor;
import com.orionops.modules.procurement.repository.ProcurementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ProcurementService}.
 * Covers PR lifecycle, PO creation business rules, vendor/contract CRUD,
 * and contract renewal alerts.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProcurementService")
class ProcurementServiceTest {

    @Mock
    private ProcurementRepository.PurchaseRequestRepository prRepository;

    @Mock
    private ProcurementRepository.PurchaseOrderRepository poRepository;

    @Mock
    private ProcurementRepository.VendorRepository vendorRepository;

    @Mock
    private ProcurementRepository.ContractRepository contractRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProcurementService procurementService;

    private UUID prId;
    private UUID vendorId;
    private UUID requestedBy;

    @BeforeEach
    void setUp() {
        prId = UUID.randomUUID();
        vendorId = UUID.randomUUID();
        requestedBy = UUID.randomUUID();
    }

    // ================================================================
    // Purchase Requests
    // ================================================================

    @Nested
    @DisplayName("createPR")
    class CreatePRTests {

        @Test
        @DisplayName("should create PR with DRAFT status")
        void shouldCreatePR_withDraftStatus() {
            ProcurementRequest.PRRequest request = ProcurementRequest.PRRequest.builder()
                    .title("New laptops")
                    .description("Purchase 10 laptops")
                    .estimatedCost(BigDecimal.valueOf(15000))
                    .requestedBy(requestedBy)
                    .vendorId(vendorId)
                    .build();

            when(prRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> {
                PurchaseRequest pr = inv.getArgument(0);
                pr.setId(prId);
                return pr;
            });

            ProcurementResponse.PRResponse response = procurementService.createPR(request);

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("New laptops");
            assertThat(response.getDescription()).isEqualTo("Purchase 10 laptops");
            assertThat(response.getEstimatedCost()).isEqualByComparingTo(BigDecimal.valueOf(15000));
            assertThat(response.getRequestedBy()).isEqualTo(requestedBy);
            assertThat(response.getVendorId()).isEqualTo(vendorId);
            assertThat(response.getStatus()).isEqualTo("DRAFT");

            ArgumentCaptor<PurchaseRequest> captor = ArgumentCaptor.forClass(PurchaseRequest.class);
            verify(prRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(PurchaseRequest.PRStatus.DRAFT);
        }

        @Test
        @DisplayName("should set tenantId on PR creation")
        void shouldSetTenantId_onCreate() {
            ProcurementRequest.PRRequest request = ProcurementRequest.PRRequest.builder()
                    .title("Test PR").estimatedCost(BigDecimal.TEN).build();

            when(prRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            procurementService.createPR(request);

            ArgumentCaptor<PurchaseRequest> captor = ArgumentCaptor.forClass(PurchaseRequest.class);
            verify(prRepository).save(captor.capture());
            assertThat(captor.getValue().getTenantId()).isNotNull();
        }
    }

    @Nested
    @DisplayName("listPRs")
    class ListPRsTests {

        @Test
        @DisplayName("should return PRs for tenant")
        void shouldReturnPRs_forTenant() {
            when(prRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Collections.emptyList());

            List<ProcurementResponse.PRResponse> result = procurementService.listPRs();

            assertThat(result).isEmpty();
            verify(prRepository).findByTenantIdAndDeletedAtIsNull(any(UUID.class));
        }
    }

    @Nested
    @DisplayName("getPR")
    class GetPRTests {

        @Test
        @DisplayName("should return PR when found")
        void shouldReturnPR_whenFound() {
            PurchaseRequest pr = buildTestPR();
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));

            ProcurementResponse.PRResponse response = procurementService.getPR(prId);

            assertThat(response.getId()).isEqualTo(prId);
            assertThat(response.getTitle()).isEqualTo("Test PR");
            assertThat(response.getStatus()).isEqualTo("DRAFT");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when PR not found")
        void shouldThrow_whenNotFound() {
            when(prRepository.findById(prId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> procurementService.getPR(prId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("PurchaseRequest");
        }

        @Test
        @DisplayName("should throw ResourceNotFoundException when PR is soft-deleted")
        void shouldThrow_whenSoftDeleted() {
            PurchaseRequest pr = buildTestPR();
            pr.softDelete();
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));

            assertThatThrownBy(() -> procurementService.getPR(prId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("submitPR")
    class SubmitPRTests {

        @Test
        @DisplayName("should submit PR when in DRAFT status")
        void shouldSubmit_whenDraft() {
            PurchaseRequest pr = buildTestPR();
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));
            when(prRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            ProcurementResponse.PRResponse response = procurementService.submitPR(prId);

            assertThat(response.getStatus()).isEqualTo("SUBMITTED");
            ArgumentCaptor<PurchaseRequest> captor = ArgumentCaptor.forClass(PurchaseRequest.class);
            verify(prRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(PurchaseRequest.PRStatus.SUBMITTED);
            assertThat(captor.getValue().getSubmittedAt()).isNotNull();
        }

        @Test
        @DisplayName("should throw BusinessRuleException when PR is not DRAFT")
        void shouldThrow_whenNotDraft() {
            PurchaseRequest pr = buildTestPR();
            pr.setStatus(PurchaseRequest.PRStatus.SUBMITTED);
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));

            assertThatThrownBy(() -> procurementService.submitPR(prId))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Only draft PRs");
        }

        @Test
        @DisplayName("should throw BusinessRuleException when PR is APPROVED")
        void shouldThrow_whenApproved() {
            PurchaseRequest pr = buildTestPR();
            pr.setStatus(PurchaseRequest.PRStatus.APPROVED);
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));

            assertThatThrownBy(() -> procurementService.submitPR(prId))
                    .isInstanceOf(BusinessRuleException.class);
        }
    }

    @Nested
    @DisplayName("createPOFromPR")
    class CreatePOFromPRTests {

        @Test
        @DisplayName("should create PO when PR is APPROVED")
        void shouldCreatePO_whenApprovedPR() {
            PurchaseRequest pr = buildTestPR();
            pr.setStatus(PurchaseRequest.PRStatus.APPROVED);
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));
            when(prRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(poRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> {
                PurchaseOrder po = inv.getArgument(0);
                po.setId(UUID.randomUUID());
                return po;
            });

            ProcurementRequest.PORequest poRequest = ProcurementRequest.PORequest.builder()
                    .poNumber("PO-2024-001")
                    .totalAmount(BigDecimal.valueOf(15000))
                    .terms("Net 30")
                    .build();

            ProcurementResponse.POResponse response = procurementService.createPOFromPR(prId, poRequest);

            assertThat(response).isNotNull();
            assertThat(response.getPoNumber()).isEqualTo("PO-2024-001");
            assertThat(response.getStatus()).isEqualTo("ISSUED");
            assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.valueOf(15000));

            // Verify PR status changed to ORDERED
            ArgumentCaptor<PurchaseRequest> prCaptor = ArgumentCaptor.forClass(PurchaseRequest.class);
            verify(prRepository).save(prCaptor.capture());
            assertThat(prCaptor.getValue().getStatus()).isEqualTo(PurchaseRequest.PRStatus.ORDERED);

            // Verify PO saved with ISSUED status
            ArgumentCaptor<PurchaseOrder> poCaptor = ArgumentCaptor.forClass(PurchaseOrder.class);
            verify(poRepository).save(poCaptor.capture());
            assertThat(poCaptor.getValue().getStatus()).isEqualTo(PurchaseOrder.POStatus.ISSUED);
        }

        @Test
        @DisplayName("should throw BusinessRuleException when PR is not APPROVED")
        void shouldThrow_whenPRNotApproved() {
            PurchaseRequest pr = buildTestPR();
            pr.setStatus(PurchaseRequest.PRStatus.DRAFT);
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));

            ProcurementRequest.PORequest poRequest = ProcurementRequest.PORequest.builder()
                    .poNumber("PO-2024-001").totalAmount(BigDecimal.TEN).build();

            assertThatThrownBy(() -> procurementService.createPOFromPR(prId, poRequest))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("approved first");
        }

        @Test
        @DisplayName("should throw BusinessRuleException when PR is SUBMITTED")
        void shouldThrow_whenPRIsSubmitted() {
            PurchaseRequest pr = buildTestPR();
            pr.setStatus(PurchaseRequest.PRStatus.SUBMITTED);
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));

            assertThatThrownBy(() -> procurementService.createPOFromPR(prId,
                    ProcurementRequest.PORequest.builder().poNumber("X").build()))
                    .isInstanceOf(BusinessRuleException.class);
        }

        @Test
        @DisplayName("should fall back to PR vendorId when PO request has none")
        void shouldFallbackVendor_fromPR() {
            PurchaseRequest pr = buildTestPR();
            pr.setStatus(PurchaseRequest.PRStatus.APPROVED);
            pr.setVendorId(vendorId);
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));
            when(prRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(poRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> {
                PurchaseOrder po = inv.getArgument(0);
                po.setId(UUID.randomUUID());
                return po;
            });

            ProcurementRequest.PORequest poRequest = ProcurementRequest.PORequest.builder()
                    .poNumber("PO-001").totalAmount(BigDecimal.TEN).vendorId(null).build();

            ProcurementResponse.POResponse response = procurementService.createPOFromPR(prId, poRequest);

            ArgumentCaptor<PurchaseOrder> poCaptor = ArgumentCaptor.forClass(PurchaseOrder.class);
            verify(poRepository).save(poCaptor.capture());
            assertThat(poCaptor.getValue().getVendorId()).isEqualTo(vendorId);
        }

        @Test
        @DisplayName("should use PO request vendorId when provided")
        void shouldUsePOVendor_whenProvided() {
            UUID poVendorId = UUID.randomUUID();
            PurchaseRequest pr = buildTestPR();
            pr.setStatus(PurchaseRequest.PRStatus.APPROVED);
            pr.setVendorId(vendorId);
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));
            when(prRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
            when(poRepository.save(any(PurchaseOrder.class))).thenAnswer(inv -> {
                PurchaseOrder po = inv.getArgument(0);
                po.setId(UUID.randomUUID());
                return po;
            });

            ProcurementRequest.PORequest poRequest = ProcurementRequest.PORequest.builder()
                    .poNumber("PO-001").totalAmount(BigDecimal.TEN).vendorId(poVendorId).build();

            procurementService.createPOFromPR(prId, poRequest);

            ArgumentCaptor<PurchaseOrder> poCaptor = ArgumentCaptor.forClass(PurchaseOrder.class);
            verify(poRepository).save(poCaptor.capture());
            assertThat(poCaptor.getValue().getVendorId()).isEqualTo(poVendorId);
        }
    }

    @Nested
    @DisplayName("deletePR")
    class DeletePRTests {

        @Test
        @DisplayName("should soft-delete PR")
        void shouldSoftDelete() {
            PurchaseRequest pr = buildTestPR();
            when(prRepository.findById(prId)).thenReturn(Optional.of(pr));
            when(prRepository.save(any(PurchaseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            procurementService.deletePR(prId);

            ArgumentCaptor<PurchaseRequest> captor = ArgumentCaptor.forClass(PurchaseRequest.class);
            verify(prRepository).save(captor.capture());
            assertThat(captor.getValue().getDeletedAt()).isNotNull();
        }
    }

    // ================================================================
    // Vendors
    // ================================================================

    @Nested
    @DisplayName("Vendor CRUD")
    class VendorCRUDTests {

        @Test
        @DisplayName("should create vendor")
        void shouldCreateVendor() {
            ProcurementRequest.VendorRequest request = ProcurementRequest.VendorRequest.builder()
                    .name("Acme Corp").contactEmail("sales@acme.com")
                    .contactPhone("+1-555-0100").address("123 Main St").website("https://acme.com")
                    .build();
            when(vendorRepository.save(any(Vendor.class))).thenAnswer(inv -> {
                Vendor v = inv.getArgument(0);
                v.setId(UUID.randomUUID());
                return v;
            });

            ProcurementResponse.VendorResponse response = procurementService.createVendor(request);

            assertThat(response.getName()).isEqualTo("Acme Corp");
            assertThat(response.getContactEmail()).isEqualTo("sales@acme.com");
        }

        @Test
        @DisplayName("should list vendors for tenant")
        void shouldListVendors() {
            when(vendorRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Collections.emptyList());
            assertThat(procurementService.listVendors()).isEmpty();
        }

        @Test
        @DisplayName("should get vendor by ID")
        void shouldGetVendor() {
            Vendor vendor = Vendor.builder().name("Acme").contactEmail("a@b.com").active(true).build();
            vendor.setId(vendorId);
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));

            ProcurementResponse.VendorResponse response = procurementService.getVendor(vendorId);

            assertThat(response.getName()).isEqualTo("Acme");
            assertThat(response.isActive()).isTrue();
        }

        @Test
        @DisplayName("should throw when vendor not found")
        void shouldThrow_whenVendorNotFound() {
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> procurementService.getVendor(vendorId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ProcurementVendor");
        }

        @Test
        @DisplayName("should soft-delete vendor")
        void shouldSoftDeleteVendor() {
            Vendor vendor = Vendor.builder().name("Acme").active(true).build();
            vendor.setId(vendorId);
            when(vendorRepository.findById(vendorId)).thenReturn(Optional.of(vendor));
            when(vendorRepository.save(any(Vendor.class))).thenAnswer(inv -> inv.getArgument(0));

            procurementService.deleteVendor(vendorId);

            ArgumentCaptor<Vendor> captor = ArgumentCaptor.forClass(Vendor.class);
            verify(vendorRepository).save(captor.capture());
            assertThat(captor.getValue().getDeletedAt()).isNotNull();
        }
    }

    // ================================================================
    // Contracts
    // ================================================================

    @Nested
    @DisplayName("Contract CRUD")
    class ContractCRUDTests {

        @Test
        @DisplayName("should create contract")
        void shouldCreateContract() {
            ProcurementRequest.ContractRequest request = ProcurementRequest.ContractRequest.builder()
                    .title("Service Agreement").vendorId(vendorId)
                    .value(BigDecimal.valueOf(50000))
                    .startDate(LocalDateTime.now()).endDate(LocalDateTime.now().plusYears(1))
                    .terms("Annual renewal").build();
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> {
                Contract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                return c;
            });

            ProcurementResponse.ContractResponse response = procurementService.createContract(request);

            assertThat(response.getTitle()).isEqualTo("Service Agreement");
            assertThat(response.getValue()).isEqualByComparingTo(BigDecimal.valueOf(50000));
        }

        @Test
        @DisplayName("should list contracts for tenant")
        void shouldListContracts() {
            when(contractRepository.findByTenantIdAndDeletedAtIsNull(any(UUID.class)))
                    .thenReturn(Collections.emptyList());
            assertThat(procurementService.listContracts()).isEmpty();
        }

        @Test
        @DisplayName("should get contract by ID")
        void shouldGetContract() {
            Contract contract = Contract.builder().title("Agreement").vendorId(vendorId).build();
            contract.setId(UUID.randomUUID());
            when(contractRepository.findById(contract.getId())).thenReturn(Optional.of(contract));

            ProcurementResponse.ContractResponse response = procurementService.getContract(contract.getId());

            assertThat(response.getTitle()).isEqualTo("Agreement");
        }

        @Test
        @DisplayName("should soft-delete contract")
        void shouldSoftDeleteContract() {
            UUID contractId = UUID.randomUUID();
            Contract contract = Contract.builder().title("Agreement").build();
            contract.setId(contractId);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            procurementService.deleteContract(contractId);

            ArgumentCaptor<Contract> captor = ArgumentCaptor.forClass(Contract.class);
            verify(contractRepository).save(captor.capture());
            assertThat(captor.getValue().getDeletedAt()).isNotNull();
        }
    }

    // ================================================================
    // Contract Renewal Alerts
    // ================================================================

    @Nested
    @DisplayName("checkContractRenewals")
    class CheckContractRenewalsTests {

        @Test
        @DisplayName("should send notifications for contracts expiring within 30 days")
        void shouldSendNotifications_for30DayExpiring() {
            UUID ownerId = UUID.randomUUID();
            Contract contract = Contract.builder()
                    .title("Expiring Contract").vendorId(vendorId)
                    .endDate(LocalDateTime.now().plusDays(15))
                    .ownerId(ownerId).build();
            contract.setId(UUID.randomUUID());

            when(contractRepository.findByEndDateBetween(any(LocalDate.class), any(LocalDate.class)))
                    .thenAnswer(inv -> {
                        LocalDate start = inv.getArgument(0);
                        LocalDate end = inv.getArgument(1);
                        // Return the contract only for the 30-day window
                        LocalDate today = LocalDate.now();
                        LocalDate in30 = today.plusDays(30);
                        if (start.equals(today) && end.equals(in30)) {
                            return List.of(contract);
                        }
                        return Collections.emptyList();
                    });

            procurementService.checkContractRenewals();

            verify(notificationService).createNotification(
                    eq(ownerId),
                    eq("[URGENT] Contract Expiring in 30 Days: Expiring Contract"),
                    any(String.class),
                    eq("CONTRACT_EXPIRY_30"),
                    eq(contract.getId()),
                    eq("CONTRACT")
            );
        }

        @Test
        @DisplayName("should handle notification failure gracefully")
        void shouldHandleNotificationFailure_gracefully() {
            Contract contract = Contract.builder()
                    .title("Expiring Contract").vendorId(vendorId)
                    .endDate(LocalDateTime.now().plusDays(15))
                    .ownerId(UUID.randomUUID()).build();
            contract.setId(UUID.randomUUID());

            when(contractRepository.findByEndDateBetween(any(LocalDate.class), any(LocalDate.class)))
                    .thenAnswer(inv -> {
                        LocalDate start = inv.getArgument(0);
                        LocalDate end = inv.getArgument(1);
                        LocalDate today = LocalDate.now();
                        if (start.equals(today) && end.equals(today.plusDays(30))) {
                            return List.of(contract);
                        }
                        return Collections.emptyList();
                    });

            // Simulate notification failure
            when(notificationService.createNotification(any(), any(), any(), any(), any(), any()))
                    .thenThrow(new RuntimeException("Notification service unavailable"));

            // Should NOT propagate the exception
            procurementService.checkContractRenewals();

            // Verify we attempted to notify
            verify(notificationService).createNotification(any(), any(), any(), any(), any(), any());
        }
    }

    // ================================================================
    // Purchase Orders
    // ================================================================

    @Nested
    @DisplayName("getPO")
    class GetPOTests {

        @Test
        @DisplayName("should throw ResourceNotFoundException when PO not found")
        void shouldThrow_whenPONotFound() {
            UUID poId = UUID.randomUUID();
            when(poRepository.findById(poId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> procurementService.getPO(poId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("PurchaseOrder");
        }
    }

    // ================================================================
    // Helpers
    // ================================================================

    private PurchaseRequest buildTestPR() {
        PurchaseRequest pr = PurchaseRequest.builder()
                .title("Test PR")
                .description("Test description")
                .estimatedCost(BigDecimal.valueOf(1000))
                .requestedBy(requestedBy)
                .vendorId(vendorId)
                .status(PurchaseRequest.PRStatus.DRAFT)
                .build();
        pr.setId(prId);
        return pr;
    }
}
