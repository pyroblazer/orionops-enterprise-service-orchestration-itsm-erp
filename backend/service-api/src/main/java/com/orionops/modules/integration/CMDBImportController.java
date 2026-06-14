package com.orionops.modules.integration.cmdb;

import com.orionops.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for CMDB import operations.
 *
 * <p>Provides endpoints for bulk importing Configuration Items from
 * external sources (CSV and JSON formats). Supports dry-run mode
 * for validation-only imports before committing changes.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/integrations/cmdb")
@RequiredArgsConstructor
@Tag(name = "CMDB Import", description = "CMDB bulk import operations")
public class CMDBImportController {

    private final CMDBImportService cmdbImportService;

    /**
     * Imports Configuration Items from an uploaded file.
     *
     * <p>Supports CSV and JSON formats. In dry-run mode, the file is validated
     * but no data is persisted, allowing users to preview import results.</p>
     *
     * @param file   the file to import (CSV or JSON)
     * @param format file format: "csv" or "json" (defaults to csv)
     * @param dryRun if true, only validate without persisting changes
     * @return ApiResponse with the import summary
     */
    @PostMapping("/import")
    @Operation(summary = "Import CIs from file",
            description = "Imports Configuration Items from a CSV or JSON file. "
                    + "Supports dry-run mode for validation-only imports.")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<CMDBImportService.ImportSummary>> importCIs(
            @Parameter(description = "File to import (CSV or JSON)", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "File format: csv or json")
            @RequestParam(value = "format", defaultValue = "csv") String format,
            @Parameter(description = "If true, only validate without saving")
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {

        log.info("CMDB import request: format={}, dryRun={}, fileName={}, size={}",
                format, dryRun, file.getOriginalFilename(), file.getSize());

        // Validate file is not empty
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Import file is empty"));
        }

        // Validate file format
        if (!"csv".equalsIgnoreCase(format) && !"json".equalsIgnoreCase(format)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Unsupported format: " + format
                            + ". Supported formats: csv, json"));
        }

        // Validate file extension matches declared format
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1);
            if (!extension.equalsIgnoreCase(format)) {
                log.warn("File extension ({}) does not match declared format ({})", extension, format);
            }
        }

        try {
            CMDBImportService.ImportSummary summary;

            if ("csv".equalsIgnoreCase(format)) {
                summary = cmdbImportService.importFromCSV(file, dryRun);
            } else {
                summary = cmdbImportService.importFromJSON(file, dryRun);
            }

            String message = dryRun
                    ? "Dry-run validation complete"
                    : "Import completed successfully";

            return ResponseEntity.ok(ApiResponse.success(summary, message));

        } catch (Exception e) {
            log.error("CMDB import failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Import failed: " + e.getMessage()));
        }
    }
}
