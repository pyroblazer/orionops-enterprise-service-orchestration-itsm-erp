package com.orionops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
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
public class NotifierTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotifierTestApplication.class, args);
    }

}
