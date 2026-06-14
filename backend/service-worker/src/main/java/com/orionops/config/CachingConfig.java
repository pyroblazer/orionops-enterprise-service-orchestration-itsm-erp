package com.orionops.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CachingConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
            "vendors",           // Vendor master data (1h TTL)
            "chartOfAccounts",   // GL accounts (24h TTL)
            "unitsOfMeasure",    // UoM (24h TTL)
            "approvalRules",     // Approval authorities (1h TTL)
            "slaDefinitions",    // SLA definitions (24h TTL)
            "reportCache",       // Report summaries (15m TTL)
            "users",             // User data (1h TTL)
            "vendors_performance", // Vendor performance scores (1h TTL)
            "productCatalog",    // Product master (1h TTL)
            "budgets"            // Budget details (30m TTL)
        );
    }
}
