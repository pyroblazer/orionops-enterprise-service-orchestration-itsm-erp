package com.orionops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.orionops.modules.integration.consumers",
    "com.orionops.modules.search",
    "com.orionops.config"
})
public class WorkerTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkerTestApplication.class, args);
    }

}
