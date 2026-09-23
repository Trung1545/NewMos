package com.shoestore.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponse {

    private String reply;

    @Builder.Default
    private List<ChatSuggestedProduct> suggestedProducts = new ArrayList<>();

    private String action; // "RECOMMEND_SIZE", "SUGGEST_PRODUCTS", "TRACK_ORDER", "GENERAL"

    private Integer recommendedSize;
}
