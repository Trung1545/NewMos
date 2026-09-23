import api from './api';

/**
 * Service giao tiếp với AI Chatbot Backend (/api/chat)
 */
export const chatbotService = {
  /**
   * Gửi tin nhắn đến Trợ lý NewMos AI
   * @param {Object} payload
   * @param {string} payload.message - Nội dung tin nhắn của người dùng
   * @param {Array} [payload.conversationHistory] - Lịch sử hội thoại gần nhất
   * @param {Object} [payload.productContext] - Ngữ cảnh sản phẩm đang xem
   * @returns {Promise<{ reply: string, suggestedProducts: Array, action: string, recommendedSize: number }>}
   */
  sendMessage: async (payload) => {
    return await api.post('/chat/message', payload);
  },
};

export default chatbotService;
