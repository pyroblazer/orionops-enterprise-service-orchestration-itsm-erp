package com.orionops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
@EnableJpaRepositories(considerNestedRepositories = true)
@ComponentScan(basePackages = {
    "com.orionops.modules.notification",
    "com.orionops.modules.integration.email",
    "com.orionops.modules.integration.chat",
    "com.orionops.modules.integration.webhook",
    "com.orionops.modules.integration.entra",
    "com.orionops.modules.integration.monitoring",
    "com.orionops.modules.integration.consumers",
    "com.orionops.config"
})
public class OrionOpsNotifierApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrionOpsNotifierApplication.class, args);
    }

}

