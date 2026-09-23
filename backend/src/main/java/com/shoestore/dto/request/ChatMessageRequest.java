package com.shoestore.dto.request;

import jakarta.validation.constraints.NotBlank;
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
public class ChatMessageRequest {

    @NotBlank(message = "Tin nhắn không được để trống")
    private String message;

    @Builder.Default
    private List<ChatMessageItem> conversationHistory = new ArrayList<>();

    private ProductContextDto productContext;
}
