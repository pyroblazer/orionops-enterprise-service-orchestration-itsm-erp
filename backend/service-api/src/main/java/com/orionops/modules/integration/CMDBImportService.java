package com.orionops.modules.integration.cmdb;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.orionops.modules.cmdb.entity.ConfigurationItem;
import com.orionops.modules.cmdb.repository.ConfigurationItemRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Service for importing Configuration Items (CIs) from external sources.
 *
 * <p>Supports importing CIs from CSV and JSON file uploads with comprehensive
 * validation, deduplication by name+type, dry-run mode for preview, and
 * detailed import summaries including created, updated, skipped, and error counts.</p>
 *
 * <p>All imports are audited through the BaseEntity auditing mechanism,
 * tracking who initiated the import and when.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CMDBImportService {

    private final ConfigurationItemRepository configurationItemRepository;
    private final ObjectMapper objectMapper;

    /**
     * Imports Configuration Items from a CSV file.
     *
     * <p>Expected CSV columns: name, description (optional), type, status (optional),
     * environment (optional), ownerId (optional), location (optional), version (optional),
     * attributes (optional, JSON string).</p>
     *
     * @param file   the CSV file to import
     * @param dryRun if true, validates without persisting
     * @return import summary with counts and error details
     */
    public ImportSummary importFromCSV(MultipartFile file, boolean dryRun) {
        log.info("Starting CSV import (dryRun={}, fileName={}, size={})",
                dryRun, file.getOriginalFilename(), file.getSize());

        List<ConfigurationItem> items = new ArrayList<>();
        List<String> parseErrors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader,
                     CSVFormat.Builder.create()
                             .setHeader()
                             .setSkipHeaderRecord(true)
                             .setTrim(true)
                             .setIgnoreEmptyLines(true)
                             .build())) {

            for (CSVRecord record : csvParser) {
                try {
                    ConfigurationItem item = mapCsvRecordToCI(record);
                    items.add(item);
                } catch (Exception e) {
                    parseErrors.add("Row " + record.getRecordNumber() + ": " + e.getMessage());
                    log.warn("Failed to parse CSV row {}: {}", record.getRecordNumber(), e.getMessage());
                }
            }

        } catch (IOException e) {
            log.error("Failed to read CSV file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to read CSV file: " + e.getMessage(), e);
        }

        log.info("Parsed {} items from CSV, {} parse errors", items.size(), parseErrors.size());
        return validateAndImport(items, dryRun, parseErrors);
    }

    /**
     * Imports Configuration Items from a JSON file.
     *
     * <p>Expected JSON format: an array of objects with fields matching
     * the ConfigurationItem entity (name, description, type, status, etc.).</p>
     *
     * @param file   the JSON file to import
     * @param dryRun if true, validates without persisting
     * @return import summary with counts and error details
     */
    public ImportSummary importFromJSON(MultipartFile file, boolean dryRun) {
        log.info("Starting JSON import (dryRun={}, fileName={}, size={})",
                dryRun, file.getOriginalFilename(), file.getSize());

        List<ConfigurationItem> items = new ArrayList<>();
        List<String> parseErrors = new ArrayList<>();

        try {
            byte[] content = file.getBytes();
            List<Map<String, Object>> rawItems = objectMapper.readValue(
                    content, new TypeReference<List<Map<String, Object>>>() {});

            for (int i = 0; i < rawItems.size(); i++) {
                try {
                    ConfigurationItem item = mapJsonToCI(rawItems.get(i));
                    items.add(item);
                } catch (Exception e) {
                    parseErrors.add("Item " + (i + 1) + ": " + e.getMessage());
                    log.warn("Failed to parse JSON item {}: {}", i + 1, e.getMessage());
                }
            }

        } catch (IOException e) {
            log.error("Failed to read JSON file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to read JSON file: " + e.getMessage(), e);
        }

        log.info("Parsed {} items from JSON, {} parse errors", items.size(), parseErrors.size());
        return validateAndImport(items, dryRun, parseErrors);
    }

    /**
     * Validates a list of CIs and imports them with deduplication and audit.
     *
     * <p>Validation checks:
     * - Required fields (name, type) are present
     * - Type values are valid enum values
     * - Deduplication by name + type combination (existing CIs are updated)
     * </p>
     *
     * <p>In dry-run mode, returns validation results without persisting any changes.</p>
     *
     * @param items       the list of CIs to validate and import
     * @param dryRun      if true, only validate without saving
     * @param parseErrors pre-existing parse errors to include in the summary
     * @return import summary with detailed results
     */
    @Transactional
    public ImportSummary validateAndImport(List<ConfigurationItem> items,
                                            boolean dryRun, List<String> parseErrors) {
        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>(parseErrors != null ? parseErrors : List.of());
        List<String> warnings = new ArrayList<>();

        // Track seen name+type combinations within this import to detect duplicates in the file
        Set<String> seenInImport = new HashSet<>();

        for (int i = 0; i < items.size(); i++) {
            ConfigurationItem item = items.get(i);

            // Validate required fields
            if (item.getName() == null || item.getName().isBlank()) {
                errors.add("Item " + (i + 1) + ": name is required");
                skipped++;
                continue;
            }

            if (item.getType() == null) {
                errors.add("Item " + (i + 1) + " (" + item.getName() + "): type is required");
                skipped++;
                continue;
            }

            // Validate name length
            if (item.getName().length() > 255) {
                errors.add("Item " + (i + 1) + ": name exceeds 255 characters");
                skipped++;
                continue;
            }

            // Check for duplicates within the import file
            String dedupeKey = item.getName().toLowerCase() + "|" + item.getType().name().toLowerCase();
            if (seenInImport.contains(dedupeKey)) {
                warnings.add("Item " + (i + 1) + " (" + item.getName() + "): duplicate in import file, skipping");
                skipped++;
                continue;
            }
            seenInImport.add(dedupeKey);

            // Skip persistence in dry-run mode
            if (dryRun) {
                // In dry-run, we count as if they would be created/updated
                // but we don't actually persist
                continue;
            }

            try {
                // Check for existing CI with same name and type for deduplication
                List<ConfigurationItem> existing = configurationItemRepository
                        .searchCIs(item.getTenantId(), item.getType(), null, item.getName());

                ConfigurationItem existingMatch = existing.stream()
                        .filter(ci -> ci.getName().equalsIgnoreCase(item.getName())
                                && ci.getType() == item.getType())
                        .findFirst()
                        .orElse(null);

                if (existingMatch != null) {
                    // Update existing CI
                    updateExistingCI(existingMatch, item);
                    configurationItemRepository.save(existingMatch);
                    updated++;
                    log.debug("Updated existing CI: {} ({})", item.getName(), item.getType());
                } else {
                    // Create new CI
                    if (item.getTenantId() == null) {
                        // Default tenant for imports without tenant context
                        item.setTenantId(UUID.fromString("00000000-0000-0000-0000-000000000000"));
                    }
                    configurationItemRepository.save(item);
                    created++;
                    log.debug("Created new CI: {} ({})", item.getName(), item.getType());
                }

            } catch (Exception e) {
                errors.add("Item " + (i + 1) + " (" + item.getName() + "): " + e.getMessage());
                skipped++;
                log.error("Failed to import CI {}: {}", item.getName(), e.getMessage(), e);
            }
        }

        ImportSummary summary = ImportSummary.builder()
                .totalItems(items.size())
                .created(dryRun ? 0 : created)
                .updated(dryRun ? 0 : updated)
                .skipped(skipped)
                .errors(errors)
                .warnings(warnings)
                .dryRun(dryRun)
                .build();

        if (dryRun) {
            summary.setValidItems(items.size() - skipped);
            summary.setValidationErrors(errors);
            log.info("Dry-run import validation complete: {} valid, {} errors, {} skipped",
                    summary.getValidItems(), errors.size(), skipped);
        } else {
            log.info("Import complete: {} created, {} updated, {} skipped, {} errors",
                    created, updated, skipped, errors.size());
        }

        return summary;
    }

    // ---- Private helpers ----

    /**
     * Maps a CSV record to a ConfigurationItem entity.
     */
    private ConfigurationItem mapCsvRecordToCI(CSVRecord record) {
        ConfigurationItem.ConfigurationItemBuilder builder = ConfigurationItem.builder();

        String name = record.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name field is required");
        }
        builder.name(name.trim());

        String description = getOptionalField(record, "description");
        if (description != null) {
            builder.description(description);
        }

        String typeStr = record.get("type");
        if (typeStr != null && !typeStr.isBlank()) {
            builder.type(parseCIType(typeStr.trim()));
        }

        String statusStr = getOptionalField(record, "status");
        if (statusStr != null) {
            builder.status(parseCIStatus(statusStr.trim()));
        }

        String environment = getOptionalField(record, "environment");
        if (environment != null) {
            builder.environment(environment);
        }

        String ownerId = getOptionalField(record, "ownerId");
        if (ownerId != null) {
            builder.ownerId(ownerId);
        }

        String location = getOptionalField(record, "location");
        if (location != null) {
            builder.location(location);
        }

        String version = getOptionalField(record, "version");
        if (version != null) {
            builder.version(version);
        }

        String attributes = getOptionalField(record, "attributes");
        if (attributes != null) {
            builder.attributes(attributes);
        }

        return builder.build();
    }

    /**
     * Maps a JSON map to a ConfigurationItem entity.
     */
    private ConfigurationItem mapJsonToCI(Map<String, Object> jsonItem) {
        ConfigurationItem.ConfigurationItemBuilder builder = ConfigurationItem.builder();

        Object name = jsonItem.get("name");
        if (name == null || name.toString().isBlank()) {
            throw new IllegalArgumentException("name field is required");
        }
        builder.name(name.toString().trim());

        Object description = jsonItem.get("description");
        if (description != null) {
            builder.description(description.toString());
        }

        Object type = jsonItem.get("type");
        if (type != null && !type.toString().isBlank()) {
            builder.type(parseCIType(type.toString().trim()));
        }

        Object status = jsonItem.get("status");
        if (status != null) {
            builder.status(parseCIStatus(status.toString().trim()));
        }

        Object environment = jsonItem.get("environment");
        if (environment != null) {
            builder.environment(environment.toString());
        }

        Object ownerId = jsonItem.get("ownerId");
        if (ownerId != null) {
            builder.ownerId(ownerId.toString());
        }

        Object location = jsonItem.get("location");
        if (location != null) {
            builder.location(location.toString());
        }

        Object version = jsonItem.get("version");
        if (version != null) {
            builder.version(version.toString());
        }

        Object attributes = jsonItem.get("attributes");
        if (attributes != null) {
            // If attributes is a map/object, serialize it to JSON string
            if (attributes instanceof Map) {
                try {
                    builder.attributes(objectMapper.writeValueAsString(attributes));
                } catch (Exception e) {
                    builder.attributes(attributes.toString());
                }
            } else {
                builder.attributes(attributes.toString());
            }
        }

        return builder.build();
    }

    /**
     * Gets an optional field from a CSV record, returning null if not present or blank.
     */
    private String getOptionalField(CSVRecord record, String fieldName) {
        try {
            String value = record.get(fieldName);
            return (value != null && !value.isBlank()) ? value.trim() : null;
        } catch (IllegalArgumentException e) {
            // Column not found in CSV - return null
            return null;
        }
    }

    /**
     * Parses a CI type string into the corresponding enum value.
     * Case-insensitive, throws if the value is not a valid type.
     */
    private ConfigurationItem.CIType parseCIType(String typeStr) {
        try {
            return ConfigurationItem.CIType.valueOf(typeStr.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid CI type: " + typeStr
                    + ". Valid types: " + List.of(ConfigurationItem.CIType.values()));
        }
    }

    /**
     * Parses a CI status string into the corresponding enum value.
     * Case-insensitive, defaults to ACTIVE if invalid.
     */
    private ConfigurationItem.CIStatus parseCIStatus(String statusStr) {
        try {
            return ConfigurationItem.CIStatus.valueOf(statusStr.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid CI status '{}', defaulting to ACTIVE", statusStr);
            return ConfigurationItem.CIStatus.ACTIVE;
        }
    }

    /**
     * Updates an existing CI with values from the imported item.
     * Only overwrites non-null fields from the import.
     */
    private void updateExistingCI(ConfigurationItem existing, ConfigurationItem imported) {
        if (imported.getDescription() != null) {
            existing.setDescription(imported.getDescription());
        }
        if (imported.getStatus() != null) {
            existing.setStatus(imported.getStatus());
        }
        if (imported.getEnvironment() != null) {
            existing.setEnvironment(imported.getEnvironment());
        }
        if (imported.getOwnerId() != null) {
            existing.setOwnerId(imported.getOwnerId());
        }
        if (imported.getLocation() != null) {
            existing.setLocation(imported.getLocation());
        }
        if (imported.getVersion() != null) {
            existing.setVersion(imported.getVersion());
        }
        if (imported.getAttributes() != null) {
            existing.setAttributes(imported.getAttributes());
        }
    }

    // ---- DTO ----

    /**
     * Summary of an import operation including counts and error details.
     */
    @Data
    @Builder
    public static class ImportSummary {
        private int totalItems;
        private int created;
        private int updated;
        private int skipped;
        private int validItems;
        private boolean dryRun;
        @Builder.Default
        private List<String> errors = new ArrayList<>();
        @Builder.Default
        private List<String> warnings = new ArrayList<>();
        @Builder.Default
        private List<String> validationErrors = new ArrayList<>();
    }
}
