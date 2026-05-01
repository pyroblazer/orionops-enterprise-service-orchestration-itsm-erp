package com.orionops.config;

import org.flowable.engine.ProcessEngineConfiguration;
import org.flowable.spring.SpringProcessEngineConfiguration;
import org.flowable.spring.boot.EngineConfigurationConfigurer;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Flowable BPMN process engine configuration for OrionOps workflow orchestration.
 *
 * <p>OrionOps uses Flowable as its BPMN engine to drive incident escalation,
 * change approval workflows, SLA breach escalation, and other ITSM processes.
 * This configuration integrates Flowable with the primary PostgreSQL datasource
 * and disables automatic schema management (Flyway handles that).</p>
 */
@Configuration
@org.springframework.context.annotation.Profile("!test")
public class FlowableConfig implements EngineConfigurationConfigurer<SpringProcessEngineConfiguration> {

    @Override
    public void configure(SpringProcessEngineConfiguration engineConfig) {
        engineConfig.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_FALSE);
        engineConfig.setAsyncExecutorActivate(true);
        engineConfig.setHistoryLevel(org.flowable.common.engine.impl.history.HistoryLevel.FULL);

        // Use the same DataSource as JPA (managed by Spring Boot)
        engineConfig.setUseLockForDatabaseSchemaUpdate(false);

        // Custom async executor settings for better throughput
        engineConfig.setAsyncExecutorCorePoolSize(4);
        engineConfig.setAsyncExecutorMaxPoolSize(10);
        engineConfig.setAsyncExecutorThreadPoolQueueSize(50);

        // Enable async history for non-blocking historical data recording
        engineConfig.setAsyncHistoryEnabled(true);
        engineConfig.setAsyncHistoryExecutorActivate(true);
    }
}
