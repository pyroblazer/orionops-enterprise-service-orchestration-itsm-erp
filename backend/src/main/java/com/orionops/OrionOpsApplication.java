package com.orionops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Main entry point for the OrionOps Enterprise Service Orchestration Platform.
 *
 * <p>This is a modular monolith that orchestrates ITSM workflows, BPMN processes,
 * SLA tracking, and ERP-adjacent modules (asset management, billing, vendor management).
 * The architecture uses CQRS with Event Sourcing on core modules and standard
 * Spring Data JPA CRUD elsewhere.</p>
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class OrionOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrionOpsApplication.class, args);
    }

    /**
     * Bounded thread pool for @Async methods. Prevents unbounded thread creation
     * from Spring's default SimpleAsyncTaskExecutor.
     */
    @org.springframework.context.annotation.Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("orionops-async-");
        executor.setRejectedExecutionHandler(
                new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
