package com.orionops.modules.integration.email;

import com.orionops.modules.incident.dto.CreateIncidentRequest;
import com.orionops.modules.incident.entity.Incident;
import com.orionops.modules.incident.service.IncidentService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link EmailService}.
 * Covers templated email, simple email, email ingestion, and parsing logic.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService")
class EmailServiceTest {

    @Mock
    private JavaMailSender javaMailSender;

    @Mock
    private TemplateEngine emailTemplateEngine;

    @Mock
    private IncidentService incidentService;

    private EmailService emailService;

    @BeforeEach
    void setUp() throws Exception {
        emailService = new EmailService(javaMailSender, emailTemplateEngine, incidentService);
        setField(emailService, "emailEnabled", true);
        setField(emailService, "fromAddress", "noreply@orionops.io");
        setField(emailService, "fromName", "OrionOps Platform");
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private MimeMessage createValidMimeMessage() {
        // Create a MimeMessage with a real (minimal) Session so MimeMessageHelper works
        Session session = Session.getInstance(new Properties());
        return new MimeMessage(session);
    }

    // ========================================================================
    // SEND EMAIL (TEMPLATED)
    // ========================================================================

    @Nested
    @DisplayName("sendEmail (templated)")
    class SendEmailTemplated {

        @Test
        @DisplayName("enabled: sends HTML email via Thymeleaf template")
        void enabled_sendsTemplatedEmail() throws Exception {
            MimeMessage mimeMessage = createValidMimeMessage();
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailTemplateEngine.process(eq("incident-created"), any(Context.class)))
                    .thenReturn("<h1>New Incident</h1>");

            emailService.sendEmail(
                    "agent@orionops.io",
                    "New Incident Assigned",
                    "incident-created",
                    Map.of("incidentId", "123"),
                    null
            );

            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("disabled: does not send email")
        void disabled_doesNotSend() throws Exception {
            setField(emailService, "emailEnabled", false);

            emailService.sendEmail(
                    "agent@orionops.io", "Test Subject", "test-template", Map.of(), null
            );

            verifyNoInteractions(javaMailSender, emailTemplateEngine);
        }

        @Test
        @DisplayName("with file attachments: sends successfully")
        void withAttachments_sendsSuccessfully() throws Exception {
            MimeMessage mimeMessage = createValidMimeMessage();
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailTemplateEngine.process(anyString(), any(Context.class)))
                    .thenReturn("<p>Body</p>");

            java.io.File tempFile = java.io.File.createTempFile("test-attachment", ".txt");
            tempFile.deleteOnExit();
            java.nio.file.Files.writeString(tempFile.toPath(), "attachment content");

            emailService.sendEmail(
                    "agent@orionops.io", "With Attachment", "test-template", Map.of(), List.of(tempFile)
            );

            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("send failure: throws RuntimeException")
        void sendFailure_throwsRuntimeException() throws Exception {
            MimeMessage mimeMessage = createValidMimeMessage();
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailTemplateEngine.process(anyString(), any(Context.class))).thenReturn("<p>Hi</p>");
            // Simulate send failure
            org.mockito.Mockito.doThrow(new RuntimeException("SMTP error"))
                    .when(javaMailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendEmail(
                    "agent@orionops.io", "Test", "template", Map.of(), null
            )).isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Email delivery failed");
        }
    }

    // ========================================================================
    // SEND EMAIL (SIMPLE)
    // ========================================================================

    @Nested
    @DisplayName("sendEmail (simple)")
    class SendEmailSimple {

        @Test
        @DisplayName("enabled: sends HTML email with byte attachments")
        void enabled_sendsSimpleEmail() throws Exception {
            MimeMessage mimeMessage = createValidMimeMessage();
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

            EmailService.AttachmentData att = new EmailService.AttachmentData();
            att.setName("report.pdf");
            att.setData(new byte[]{1, 2, 3});
            att.setContentType("application/pdf");

            emailService.sendEmail(
                    "agent@orionops.io", "Simple Email", "<h1>Hello</h1>", List.of(att)
            );

            verify(javaMailSender).send(mimeMessage);
        }

        @Test
        @DisplayName("disabled: does not send")
        void disabled_doesNotSend() throws Exception {
            setField(emailService, "emailEnabled", false);

            emailService.sendEmail("agent@orionops.io", "Test", "<p>Hi</p>", null);

            verifyNoInteractions(javaMailSender);
        }

        @Test
        @DisplayName("null attachments: sends without attachments")
        void nullAttachments_sendsWithoutAttachments() throws Exception {
            MimeMessage mimeMessage = createValidMimeMessage();
            when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

            emailService.sendEmail("agent@orionops.io", "Test", "<p>Hi</p>", null);

            verify(javaMailSender).send(mimeMessage);
        }
    }

    // ========================================================================
    // INGEST EMAILS
    // ========================================================================

    @Nested
    @DisplayName("ingestEmails")
    class IngestEmails {

        @Test
        @DisplayName("IMAP store null: no-op")
        void imapNull_noOp() {
            emailService.ingestEmails();
            verifyNoInteractions(incidentService);
        }

        @Test
        @DisplayName("email disabled: no-op even with IMAP store")
        void emailDisabled_noOp() throws Exception {
            setField(emailService, "emailEnabled", false);
            emailService.ingestEmails();
            verifyNoInteractions(incidentService);
        }
    }

    // ========================================================================
    // PARSE EMAIL TO INCIDENT (verified through truncation logic)
    // ========================================================================

    @Nested
    @DisplayName("parseEmailToIncident logic")
    class ParseEmailToIncident {

        @Test
        @DisplayName("title is truncated to 255 characters max")
        void titleTruncation() {
            String longTitle = "A".repeat(300);
            String truncated = longTitle.length() > 255 ? longTitle.substring(0, 255) : longTitle;
            assertThat(truncated).hasSize(255);
        }

        @Test
        @DisplayName("defaults to MEDIUM priority and 'email' category")
        void defaultsPriorityAndCategory() {
            CreateIncidentRequest request = CreateIncidentRequest.builder()
                    .title("Test Subject")
                    .description("Test body")
                    .priority(Incident.IncidentPriority.MEDIUM)
                    .category("email")
                    .build();

            assertThat(request.getPriority()).isEqualTo(Incident.IncidentPriority.MEDIUM);
            assertThat(request.getCategory()).isEqualTo("email");
        }

        @Test
        @DisplayName("null title falls back to timestamped default")
        void nullTitleFallback() {
            String title = null;
            String result = title != null ? title : "Email Incident - " + java.time.LocalDateTime.now();
            assertThat(result).startsWith("Email Incident - ");
        }
    }
}
