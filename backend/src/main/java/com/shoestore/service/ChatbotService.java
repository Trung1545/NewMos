package com.shoestore.service;

import com.shoestore.dto.request.ChatMessageRequest;
import com.shoestore.dto.response.ChatbotResponse;

public interface ChatbotService {

    ChatbotResponse processMessage(ChatMessageRequest request);
}
