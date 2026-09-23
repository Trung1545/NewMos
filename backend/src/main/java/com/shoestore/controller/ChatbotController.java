package com.shoestore.controller;

import com.shoestore.dto.request.ChatMessageRequest;
import com.shoestore.dto.response.ChatbotResponse;
import com.shoestore.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chatbot Assistant", description = "API hội thoại tư vấn bán hàng, chọn size và tra cứu đơn hàng NewMos")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/message")
    @Operation(summary = "Gửi tin nhắn hội thoại đến NewMos AI Assistant để tư vấn sản phẩm, chọn size hoặc tra cứu đơn hàng")
    public ResponseEntity<ChatbotResponse> sendMessage(@Valid @RequestBody ChatMessageRequest request) {
        ChatbotResponse response = chatbotService.processMessage(request);
        return ResponseEntity.ok(response);
    }
}
