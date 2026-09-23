package com.shoestore.dto.response;

import com.shoestore.enums.ArchType;
import com.shoestore.enums.FootShape;
import com.shoestore.enums.PreferredFit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIFitProfileResponse {

    private Long id;
    private Long userId;
    private String profileName;
    private Double footLengthCm;
    private Double footWidthCm;
    private ArchType archType;
    private FootShape footShape;
    private PreferredFit preferredFit;
    private String recommendedSizeEu;
    private String recommendedSizeUs;
    private Double scanConfidenceScore;
    private String scanImageUrl;
    private String fittingAdvice;
    private Boolean isDefault;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
