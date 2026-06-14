package com.orionops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
    "com.orionops.modules.workflow",
    "com.orionops.config"
})
public class WorkflowTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkflowTestApplication.class, args);
    }

}
