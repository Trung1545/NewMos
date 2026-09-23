package com.shoestore.mapper;

import com.shoestore.dto.response.AIFitProfileResponse;
import com.shoestore.entity.AIFitProfile;
import org.springframework.stereotype.Component;

@Component
public class AIFitProfileMapper {

    public AIFitProfileResponse toResponse(AIFitProfile profile) {
        if (profile == null) {
            return null;
        }

        return AIFitProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .profileName(profile.getProfileName())
                .footLengthCm(profile.getFootLengthCm())
                .footWidthCm(profile.getFootWidthCm())
                .archType(profile.getArchType())
                .footShape(profile.getFootShape())
                .preferredFit(profile.getPreferredFit())
                .recommendedSizeEu(profile.getRecommendedSizeEu())
                .recommendedSizeUs(profile.getRecommendedSizeUs())
                .scanConfidenceScore(profile.getScanConfidenceScore())
                .scanImageUrl(profile.getScanImageUrl())
                .fittingAdvice(profile.getFittingAdvice())
                .isDefault(profile.getIsDefault())
                .notes(profile.getNotes())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
