package com.shoestore.dto.response;

import com.shoestore.enums.ArchType;
import com.shoestore.enums.FootShape;
import com.shoestore.enums.FootType;
import com.shoestore.enums.PreferredFit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AISizeResponse {

    private String recommendedSizeEu;
    private String recommendedSizeUs;
    private double confidenceScore;
    private String fittingAdvice;
    private String fitAssessment;
    private FootShape footShape;
    private ArchType archType;
    private PreferredFit preferredFit;
    private FootType footType;
    private double footLengthCm;
    private double footWidthCm;
    private String brand;
    private Long profileId;
}
