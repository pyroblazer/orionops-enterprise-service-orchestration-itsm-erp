package com.orionops.modules.integration.email;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.File;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "orionops.email.enabled", havingValue = "true")
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine emailTemplateEngine;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private Store imapStore;

    @Value("${orionops.mail.from-address:noreply@orionops.io}")
    private String fromAddress;

    @Value("${orionops.mail.from-name:OrionOps Platform}")
    private String fromName;

    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables, String[] attachments) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);

            // Process template if available
            String htmlContent = subject; // Fallback
            try {
                if (emailTemplateEngine != null && templateName != null) {
                    Context context = new Context();
                    if (variables != null) {
                        context.setVariables(variables);
                    }
                    htmlContent = emailTemplateEngine.process(templateName, context);
                }
            } catch (Exception e) {
                log.debug("Could not process email template, using fallback: {}", e.getMessage());
            }

            helper.setText(htmlContent, true);

            // Add attachments if provided
            if (attachments != null) {
                for (String attachment : attachments) {
                    try {
                        File file = new File(attachment);
                        if (file.exists()) {
                            helper.addAttachment(file.getName(), file);
                        }
                    } catch (Exception e) {
                        log.warn("Could not attach file {}: {}", attachment, e.getMessage());
                    }
                }
            }

            javaMailSender.send(message);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    public void ingestEmailsAsIncidents() {
        if (imapStore == null) {
            log.debug("IMAP store not configured, skipping email ingestion");
            return;
        }

        try {
            log.info("Ingesting emails as incidents from IMAP");
            // Email ingestion logic would go here
        } catch (Exception e) {
            log.error("Failed to ingest emails: {}", e.getMessage(), e);
        }
    }
}
