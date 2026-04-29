package com.orionops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

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
public class OrionOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrionOpsApplication.class, args);
    }
}
