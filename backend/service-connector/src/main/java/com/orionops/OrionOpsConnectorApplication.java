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
    "com.orionops.modules.integration.connector",
    "com.orionops.modules.integration.service",
    "com.orionops.modules.integration.controller",
    "com.orionops.modules.integration.entity",
    "com.orionops.modules.integration.repository",
    "com.orionops.modules.integration.dto",
    "com.orionops.config"
})
public class OrionOpsConnectorApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrionOpsConnectorApplication.class, args);
    }

}
