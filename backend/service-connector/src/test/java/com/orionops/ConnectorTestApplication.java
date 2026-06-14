package com.orionops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.orionops.modules.integration.connector",
    "com.orionops.modules.integration.service",
    "com.orionops.modules.integration.controller",
    "com.orionops.modules.integration.entity",
    "com.orionops.modules.integration.repository",
    "com.orionops.modules.integration.dto",
    "com.orionops.config"
})
public class ConnectorTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConnectorTestApplication.class, args);
    }

}
