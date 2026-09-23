package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSizeRecommendationResponse {

    private Long productId;
    private String productName;
    private String brandName;
    private String recommendedSizeEu;
    private String recommendedSizeUs;
    private double confidenceScore;
    private String fittingAdvice;
    private String fitAssessment;
    private boolean isAvailableInStock;
    private Long matchedVariantId;
    private Double userFootLengthCm;
    private Double userFootWidthCm;
    private List<String> availableSizesInStock;
}
