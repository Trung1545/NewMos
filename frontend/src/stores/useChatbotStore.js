import { create } from 'zustand';
import { chatbotService } from '../services/chatbotService';
import { useAIStore } from './useAIStore';

const INITIAL_BOT_MESSAGE = {
  id: 'welcome-bot-msg',
  sender: 'bot',
  text: 'Xin chào! Mình là Trợ lý NewMos AI 👟⚡. Mình có thể giúp bạn chọn size giày chuẩn xác cho 4 dòng NewMos (Runner X, Runner Pro, Air Speed, Apex Court), tìm kiếm mẫu giày phù hợp hoặc tra cứu mã đơn hàng. Bạn cần mình hỗ trợ gì ạ?',
  timestamp: new Date().toISOString(),
};

export const useChatbotStore = create((set, get) => ({
  isOpen: false,
  isTyping: false,
  productContext: null,
  messages: [INITIAL_BOT_MESSAGE],

  /**
   * Mở widget chat, tùy chọn truyền ngữ cảnh sản phẩm và tự động gửi tin nhắn mở đầu
   */
  openChat: async (initialQuery = null, context = null) => {
    if (context) {
      set({ productContext: context });
    }
    set({ isOpen: true });

    if (initialQuery && initialQuery.trim()) {
      await get().sendMessage(initialQuery.trim());
    }
  },

  closeChat: () => {
    set({ isOpen: false });
  },

  toggleChat: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },

  setProductContext: (context) => {
    set({ productContext: context });
  },

  clearProductContext: () => {
    set({ productContext: null });
  },

  /**
   * Xóa lịch sử và đưa về lời chào mặc định
   */
  clearMessages: () => {
    set({
      messages: [
        {
          id: `welcome-${Date.now()}`,
          sender: 'bot',
          text: 'Xin chào! Mình là Trợ lý NewMos AI 👟⚡. Bạn cần tư vấn chọn size, tìm mẫu giày hay tra cứu đơn hàng nào không ạ?',
          timestamp: new Date().toISOString(),
        },
      ],
      productContext: null,
    });
  },

  /**
   * Gửi tin nhắn đến bot và nhận phản hồi
   */
  sendMessage: async (text) => {
    if (!text || !text.trim() || get().isTyping) return;

    const trimmedText = text.trim();
    const userMessageId = `user-${Date.now()}`;

    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text: trimmedText,
      timestamp: new Date().toISOString(),
    };

    // 1. Cập nhật ngay tin nhắn của User vào giao diện
    set((state) => ({
      messages: [...state.messages, userMessage],
      isTyping: true,
    }));

    try {
      // Chuẩn bị conversationHistory (lấy 8 tin nhắn gần nhất)
      const currentMessages = get().messages;
      const conversationHistory = currentMessages.slice(-8).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      // Lấy productContext hiện tại nếu có
      const currentContext = get().productContext;
      const payload = {
        message: trimmedText,
        conversationHistory,
        productContext: currentContext
          ? {
              id: currentContext.id,
              name: currentContext.name,
              price: currentContext.price,
              imageUrl: currentContext.imageUrl,
              slug: currentContext.slug,
            }
          : null,
      };

      // 2. Gọi API Backend
      const response = await chatbotService.sendMessage(payload);

      const botMessageId = `bot-${Date.now()}`;
      const botMessage = {
        id: botMessageId,
        sender: 'bot',
        text: response?.reply || 'Cảm ơn bạn đã nhắn tin. Mình có thể giúp gì thêm cho bạn?',
        suggestedProducts: response?.suggestedProducts || [],
        action: response?.action || 'GENERAL',
        recommendedSize: response?.recommendedSize || null,
        timestamp: new Date().toISOString(),
      };

      // Nếu có kích thước khuyên dùng, đồng bộ với useAIStore để các component khác tự nhận diện
      if (response?.recommendedSize) {
        try {
          useAIStore.getState()?.setRecommendedSize(response.recommendedSize);
        } catch {
          // Store optional
        }
      }

      set((state) => ({
        messages: [...state.messages, botMessage],
        isTyping: false,
      }));
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn cho NewMos AI:', error);
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: 'Xin lỗi bạn, kết nối tới máy chủ AI đang gián đoạn một chút. Bạn vui lòng thử lại hoặc để lại lời nhắn nhé!',
        timestamp: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isTyping: false,
      }));
    }
  },
}));

export default useChatbotStore;
