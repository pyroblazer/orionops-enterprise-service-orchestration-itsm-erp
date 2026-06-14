package com.orionops.modules.notification.service;

import com.orionops.common.exception.ResourceNotFoundException;
import com.orionops.modules.notification.dto.NotificationResponse;
import com.orionops.modules.notification.entity.Notification;
import com.orionops.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        return mapToResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId);
        log.info("All notifications marked as read for user: {}", userId);
    }

    /**
     * Creates a new in-app notification for a user.
     *
     * @param userId        the recipient user ID
     * @param title         notification title
     * @param message       notification body
     * @param type          notification type (e.g. INCIDENT, SLA, CHANGE)
     * @param referenceId   optional reference to the related entity
     * @param referenceType optional type of the referenced entity
     * @return the created notification response
     */
    @Transactional
    public NotificationResponse createNotification(UUID userId, String title, String message,
                                                    String type, UUID referenceId, String referenceType) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();
        notification.setTenantId(com.orionops.common.tenant.TenantContextHolder.getCurrentTenantId());

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created: id={}, userId={}, type={}", saved.getId(), userId, type);
        return mapToResponse(saved);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).userId(n.getUserId()).title(n.getTitle())
                .message(n.getMessage()).type(n.getType()).referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType()).read(n.isRead())
                .readAt(n.getReadAt()).createdAt(n.getCreatedAt()).build();
    }
}
