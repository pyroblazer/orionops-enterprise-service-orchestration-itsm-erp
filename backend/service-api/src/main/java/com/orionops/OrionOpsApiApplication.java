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
    "com.orionops.modules",
    "com.orionops.config",
    "com.orionops.common"
})
public class OrionOpsApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrionOpsApiApplication.class, args);
    }

}
