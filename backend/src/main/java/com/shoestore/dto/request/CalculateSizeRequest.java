package com.shoestore.dto.request;

import com.shoestore.enums.ArchType;
import com.shoestore.enums.FootShape;
import com.shoestore.enums.PreferredFit;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateSizeRequest {

    @NotNull(message = "Chiều dài bàn chân không được để trống")
    @Positive(message = "Chiều dài bàn chân phải là số dương")
    private Double footLengthCm;

    @NotNull(message = "Chiều rộng bàn chân không được để trống")
    @Positive(message = "Chiều rộng bàn chân phải là số dương")
    private Double footWidthCm;

    private String brand;
    private String brandName;

    @Builder.Default
    private PreferredFit preferredFit = PreferredFit.PERFECT;

    @Builder.Default
    private ArchType archType = ArchType.NORMAL;

    private FootShape footShape;

    public String getResolvedBrand() {
        return (brand != null && !brand.isBlank()) ? brand : brandName;
    }
}
