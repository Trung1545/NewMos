package com.shoestore.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantStockUpdateDto implements Serializable {

    private Long productId;
    private Long variantId;
    private String size;
    private Integer remainingStock;

    @JsonProperty("isOutOfStock")
    private boolean isOutOfStock;
}
