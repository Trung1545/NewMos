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
public class ChatSuggestedProduct {
    private Long id;
    private String name;
    private BigDecimal price;
    private String imageUrl;
    private String slug;
}
