package com.orionops.modules.request.dto;

import com.orionops.modules.request.entity.ServiceRequest;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestDTO {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String category;
    private UUID assigneeId;
    private UUID serviceId;
}
