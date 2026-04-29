package com.orionops.modules.integration.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import jakarta.mail.Session;
import jakarta.mail.Store;
import java.util.Properties;

/**
 * Email configuration for OrionOps platform.
 *
 * <p>Configures JavaMailSender for outbound SMTP email delivery and
 * provides IMAP Store connectivity for inbound email ingestion.
 * Thymeleaf template engine is configured for HTML email templates
 * located under classpath:templates/email/.</p>
 */
@Configuration
public class EmailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${spring.mail.port:587}")
    private int smtpPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${orionops.mail.imap.host:imap.gmail.com}")
    private String imapHost;

    @Value("${orionops.mail.imap.port:993}")
    private int imapPort;

    @Value("${orionops.mail.imap.username:}")
    private String imapUsername;

    @Value("${orionops.mail.imap.password:}")
    private String imapPassword;

    @Value("${orionops.mail.imap.protocol:imaps}")
    private String imapProtocol;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private String smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private String smtpStartTls;

    /**
     * JavaMailSender bean configured for SMTP with STARTTLS.
     */
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(smtpHost);
        mailSender.setPort(smtpPort);
        mailSender.setUsername(mailUsername);
        mailSender.setPassword(mailPassword);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", smtpAuth);
        props.put("mail.smtp.starttls.enable", smtpStartTls);
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.trust", smtpHost);
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        props.put("mail.debug", "false");

        return mailSender;
    }

    /**
     * Creates an IMAP Store session for connecting to the mail server
     * to ingest inbound emails. Called by EmailService for email polling.
     *
     * @return configured IMAP Store
     */
    @Bean
    public Store imapStore() {
        Properties props = new Properties();
        props.put("mail.store.protocol", imapProtocol);
        props.put("mail.imaps.host", imapHost);
        props.put("mail.imaps.port", String.valueOf(imapPort));
        props.put("mail.imaps.ssl.enable", "true");
        props.put("mail.imaps.ssl.trust", imapHost);
        props.put("mail.imaps.connectiontimeout", "10000");
        props.put("mail.imaps.timeout", "10000");

        Session session = Session.getInstance(props);
        try {
            Store store = session.getStore(imapProtocol);
            store.connect(imapHost, imapUsername, imapPassword);
            return store;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to connect to IMAP server: " + imapHost, e);
        }
    }

    /**
     * Thymeleaf template resolver for email templates located in classpath:templates/email/.
     */
    @Bean
    public ClassLoaderTemplateResolver emailTemplateResolver() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/email/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(true);
        resolver.setOrder(1);
        return resolver;
    }

    /**
     * Thymeleaf TemplateEngine bean for processing email templates.
     */
    @Bean
    public TemplateEngine emailTemplateEngine() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(emailTemplateResolver());
        engine.setEnableSpringELCompiler(true);
        return engine;
    }
}
