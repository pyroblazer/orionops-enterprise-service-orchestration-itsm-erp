package com.orionops.modules.integration.email;

import com.orionops.modules.incident.dto.CreateIncidentRequest;
import com.orionops.modules.incident.entity.Incident;
import com.orionops.modules.incident.service.IncidentService;
import jakarta.mail.BodyPart;
import jakarta.mail.Flags;
import jakarta.mail.Folder;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Store;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.search.FlagTerm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Email integration service for sending and receiving emails.
 *
 * <p>Handles outbound email delivery using JavaMailSender with Thymeleaf HTML templates,
 * and inbound email ingestion via IMAP to automatically create incidents from
 * incoming support emails.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final Store imapStore;
    private final TemplateEngine emailTemplateEngine;
    private final IncidentService incidentService;

    @Value("${orionops.mail.from-address:noreply@orionops.io}")
    private String fromAddress;

    @Value("${orionops.mail.from-name:OrionOps Platform}")
    private String fromName;

    @Value("${orionops.mail.imap.inbox-folder:INBOX}")
    private String inboxFolder;

    @Value("${orionops.mail.imap.processed-folder:Processed}")
    private String processedFolder;

    @Value("${orionops.mail.enabled:false}")
    private boolean emailEnabled;

    /**
     * Sends an HTML email using a Thymeleaf template.
     *
     * @param to          recipient email address
     * @param subject     email subject line
     * @param templateName Thymeleaf template name (without .html extension)
     * @param templateVariables variables to pass to the template
     * @param attachments optional file attachments
     */
    public void sendEmail(String to, String subject, String templateName,
                          java.util.Map<String, Object> templateVariables,
                          List<File> attachments) {
        if (!emailEnabled) {
            log.warn("Email sending is disabled. Would have sent to: {}", to);
            return;
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);

            Context context = new Context(Locale.getDefault(), templateVariables);
            String htmlContent = emailTemplateEngine.process(templateName, context);
            helper.setText(htmlContent, true);

            if (attachments != null) {
                for (File attachment : attachments) {
                    helper.addAttachment(attachment.getName(), new FileSystemResource(attachment));
                }
            }

            javaMailSender.send(message);
            log.info("Email sent successfully: to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Email delivery failed", e);
        }
    }

    /**
     * Sends a simple HTML email without template processing.
     *
     * @param to          recipient email address
     * @param subject     email subject line
     * @param body        HTML body content
     * @param attachments optional byte array attachments (name, content pairs)
     */
    public void sendEmail(String to, String subject, String body,
                          List<AttachmentData> attachments) {
        if (!emailEnabled) {
            log.warn("Email sending is disabled. Would have sent to: {}", to);
            return;
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            if (attachments != null) {
                for (AttachmentData att : attachments) {
                    helper.addAttachment(att.getName(),
                            new ByteArrayResource(att.getData()), att.getContentType());
                }
            }

            javaMailSender.send(message);
            log.info("Email sent successfully: to={}, subject={}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Email delivery failed", e);
        }
    }

    /**
     * Ingests unread emails from the configured IMAP inbox and creates incidents.
     * Scheduled to run every 60 seconds when email integration is enabled.
     */
    @Scheduled(fixedDelayString = "${orionops.mail.imap.poll-interval:60000}")
    public void ingestEmails() {
        if (!emailEnabled) {
            return;
        }

        Folder inbox = null;
        Folder processed = null;
        try {
            if (!imapStore.isConnected()) {
                imapStore.connect();
            }

            inbox = imapStore.getFolder(inboxFolder);
            inbox.open(Folder.READ_WRITE);

            Message[] unreadMessages = inbox.search(
                    new FlagTerm(new Flags(Flags.Flag.SEEN), false));

            if (unreadMessages.length == 0) {
                return;
            }

            log.info("Found {} unread emails to process", unreadMessages.length);

            processed = imapStore.getFolder(processedFolder);
            if (!processed.exists()) {
                processed.create(Folder.HOLDS_MESSAGES);
            }
            processed.open(Folder.READ_WRITE);

            for (Message message : unreadMessages) {
                try {
                    ParsedEmail parsed = parseEmail(message);
                    CreateIncidentRequest incidentRequest = parseEmailToIncident(parsed);
                    incidentService.createIncident(incidentRequest);
                    log.info("Incident created from email: subject={}", parsed.getSubject());

                    message.setFlag(Flags.Flag.SEEN, true);
                    inbox.copyMessages(new Message[]{message}, processed);
                    message.setFlag(Flags.Flag.DELETED, true);
                } catch (Exception e) {
                    log.error("Failed to process email: {}", e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.error("Email ingestion failed: {}", e.getMessage(), e);
        } finally {
            closeFolderQuietly(inbox);
            closeFolderQuietly(processed);
        }
    }

    /**
     * Parses a raw email message into a structured ParsedEmail object.
     */
    private ParsedEmail parseEmail(Message message) throws Exception {
        ParsedEmail parsed = new ParsedEmail();

        if (message.getFrom() != null && message.getFrom().length > 0) {
            InternetAddress from = (InternetAddress) message.getFrom()[0];
            parsed.setSenderEmail(from.getAddress());
            parsed.setSenderName(from.getPersonal());
        }

        parsed.setSubject(message.getSubject());
        parsed.setSentDate(message.getSentDate());

        StringBuilder textContent = new StringBuilder();
        StringBuilder htmlContent = new StringBuilder();
        extractContent(message, textContent, htmlContent);

        parsed.setTextBody(textContent.toString());
        parsed.setHtmlBody(htmlContent.toString());

        return parsed;
    }

    /**
     * Recursively extracts text and HTML content from a MIME message.
     */
    private void extractContent(Part part, StringBuilder text, StringBuilder html) throws Exception {
        if (part.isMimeType("text/plain")) {
            text.append(part.getContent().toString());
        } else if (part.isMimeType("text/html")) {
            html.append(part.getContent().toString());
        } else if (part.getContent() instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                extractContent(multipart.getBodyPart(i), text, html);
            }
        }
    }

    /**
     * Maps a parsed email to an incident creation request.
     * Extracts title from subject, description from body, and reporter from sender.
     */
    private CreateIncidentRequest parseEmailToIncident(ParsedEmail email) {
        String title = email.getSubject();
        if (title != null && title.length() > 255) {
            title = title.substring(0, 255);
        }

        String description = email.getTextBody();
        if ((description == null || description.isBlank()) && email.getHtmlBody() != null) {
            description = "Received as HTML email. Please view in the original email client.";
        }

        if (description != null && description.length() > 10000) {
            description = description.substring(0, 10000) + "\n\n[Truncated - original email was too long]";
        }

        return CreateIncidentRequest.builder()
                .title(title != null ? title : "Email Incident - " + LocalDateTime.now())
                .description(description)
                .priority(Incident.IncidentPriority.MEDIUM)
                .category("email")
                .reporterId(resolveReporterId(email.getSenderEmail()))
                .build();
    }

    /**
     * Attempts to resolve an email address to an existing user ID.
     * Falls back to null if user is not found (will be handled by IncidentService).
     */
    private UUID resolveReporterId(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        // In a production system, this would query the user repository by email
        // and return the matching user's UUID. For now, return null and let
        // IncidentService use the current security context or a default.
        return null;
    }

    private void closeFolderQuietly(Folder folder) {
        if (folder != null) {
            try {
                if (folder.isOpen()) {
                    folder.close(true);
                }
            } catch (Exception e) {
                log.warn("Failed to close mail folder: {}", e.getMessage());
            }
        }
    }

    /**
     * Internal DTO representing a parsed email.
     */
    @lombok.Data
    public static class ParsedEmail {
        private String senderEmail;
        private String senderName;
        private String subject;
        private String textBody;
        private String htmlBody;
        private java.util.Date sentDate;
    }

    /**
     * DTO for email attachment data.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class AttachmentData {
        private String name;
        private byte[] data;
        private String contentType;
    }
}
