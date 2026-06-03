package com.orionops.modules.notification.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.common.tenant.TenantContextHolder;
import com.orionops.modules.notification.dto.NotificationResponse;
import com.orionops.modules.notification.entity.Notification;
import com.orionops.modules.notification.repository.NotificationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
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
 * Unit tests for {@link NotificationService}.
 * Covers notification CRUD, read status management, and bulk operations.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private UUID tenantId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        userId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        TenantContextHolder.setCurrentTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private Notification buildNotification(UUID id, String title, boolean read) {
        Notification notif = Notification.builder()
                .userId(userId)
                .title(title)
                .message("Notification message")
                .type("INCIDENT")
                .referenceId(UUID.randomUUID())
                .referenceType("Incident")
                .build();
        notif.setId(id);
        notif.setTenantId(tenantId);
        notif.setRead(read);
        return notif;
    }

    // ========================================================================
    // GET USER NOTIFICATIONS
    // ========================================================================

    @Nested
    @DisplayName("getUserNotifications")
    class GetUserNotifications {

        @Test
        @DisplayName("returns paginated notifications ordered by createdAt DESC")
        void returnsPaginatedNotifications() {
            Notification n1 = buildNotification(UUID.randomUUID(), "Notification 1", false);
            Notification n2 = buildNotification(UUID.randomUUID(), "Notification 2", true);
            Page<Notification> page = new PageImpl<>(List.of(n1, n2));

            when(notificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(eq(userId), any()))
                    .thenReturn(page);

            Page<NotificationResponse> result = notificationService.getUserNotifications(userId, 0, 10);

            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("filters out deleted notifications")
        void filtersDeletedNotifications() {
            Page<Notification> emptyPage = new PageImpl<>(List.of());

            when(notificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(eq(userId), any()))
                    .thenReturn(emptyPage);

            Page<NotificationResponse> result = notificationService.getUserNotifications(userId, 0, 10);

            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("returns empty page when user has no notifications")
        void returnsEmptyPage() {
            Page<Notification> emptyPage = new PageImpl<>(List.of());

            when(notificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(eq(userId), any()))
                    .thenReturn(emptyPage);

            Page<NotificationResponse> result = notificationService.getUserNotifications(userId, 0, 10);

            assertThat(result.getContent()).isEmpty();
        }
    }

    // ========================================================================
    // MARK AS READ
    // ========================================================================

    @Nested
    @DisplayName("markAsRead")
    class MarkAsRead {

        @Test
        @DisplayName("marks notification as read with readAt timestamp")
        void marksAsRead() {
            UUID id = UUID.randomUUID();
            Notification notif = buildNotification(id, "Test", false);
            when(notificationRepository.findById(id)).thenReturn(Optional.of(notif));
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            NotificationResponse response = notificationService.markAsRead(id);

            assertThat(response.isRead()).isTrue();
            assertThat(response.getReadAt()).isNotNull();
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for missing notification")
        void throwsForMissing() {
            UUID id = UUID.randomUUID();
            when(notificationRepository.findById(id)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markAsRead(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException for soft-deleted notification")
        void throwsForSoftDeleted() {
            UUID id = UUID.randomUUID();
            Notification notif = buildNotification(id, "Deleted", false);
            notif.softDelete();
            when(notificationRepository.findById(id)).thenReturn(Optional.of(notif));

            assertThatThrownBy(() -> notificationService.markAsRead(id))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ========================================================================
    // MARK ALL AS READ
    // ========================================================================

    @Nested
    @DisplayName("markAllAsRead")
    class MarkAllAsRead {

        @Test
        @DisplayName("bulk updates all user notifications to read")
        void marksAllAsRead() {
            notificationService.markAllAsRead(userId);

            verify(notificationRepository).markAllAsRead(userId);
        }
    }

    // ========================================================================
    // CREATE NOTIFICATION
    // ========================================================================

    @Nested
    @DisplayName("createNotification")
    class CreateNotification {

        @Test
        @DisplayName("creates notification with tenantId from context")
        void createsNotification() {
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(invocation -> {
                        Notification n = invocation.getArgument(0);
                        n.setId(UUID.randomUUID());
                        return n;
                    });

            UUID refId = UUID.randomUUID();
            NotificationResponse response = notificationService.createNotification(
                    userId, "Test Title", "Test Message", "INCIDENT", refId, "Incident"
            );

            assertThat(response.getUserId()).isEqualTo(userId);
            assertThat(response.getTitle()).isEqualTo("Test Title");
            assertThat(response.getType()).isEqualTo("INCIDENT");
        }

        @Test
        @DisplayName("handles null referenceId and referenceType")
        void handlesNullReferences() {
            when(notificationRepository.save(any(Notification.class)))
                    .thenAnswer(invocation -> {
                        Notification n = invocation.getArgument(0);
                        n.setId(UUID.randomUUID());
                        return n;
                    });

            NotificationResponse response = notificationService.createNotification(
                    userId, "Title", "Message", "TYPE", null, null
            );

            assertThat(response.getReferenceId()).isNull();
            assertThat(response.getReferenceType()).isNull();
        }
    }
}
