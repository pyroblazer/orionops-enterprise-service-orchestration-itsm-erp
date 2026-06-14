package com.orionops.modules.workforce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class WorkforceDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EmployeeRequest {
        @NotBlank private String firstName; @NotBlank private String lastName; @NotBlank private String email;
        private String phone; private String department; private String title; private UUID userId; private String location;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class EmployeeResponse {
        private UUID id; private String firstName; private String lastName; private String email;
        private String phone; private String department; private String title; private UUID userId;
        private String employmentStatus; private String location; private List<String> skills;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SkillRequest {
        @NotBlank private String name; private String category; private String description;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SkillResponse {
        private UUID id; private String name; private String category; private String description; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CapacityPlanRequest {
        @NotBlank private String name; private String description;
        private LocalDateTime periodStart; private LocalDateTime periodEnd;
        private Integer totalCapacity; private Integer allocatedCapacity; private String department;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CapacityPlanResponse {
        private UUID id; private String name; private String description;
        private LocalDateTime periodStart; private LocalDateTime periodEnd;
        private Integer totalCapacity; private Integer allocatedCapacity;
        private Integer availableCapacity; private String department; private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CapacityOverview {
        private Integer totalEmployees; private Integer activeEmployees;
        private Integer totalCapacity; private Integer allocatedCapacity;
        private List<CapacityPlanResponse> plans;
    }
}
