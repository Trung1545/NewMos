package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private Long id;
    private Long variantId;
    private String productName;
    private String sku;
    private String color;
    private String size;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String productImage;

    public Long getProductVariantId() {
        return variantId;
    }

    public BigDecimal getPrice() {
        return unitPrice;
    }
}
