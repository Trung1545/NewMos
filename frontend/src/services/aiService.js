import api from './api';

export const aiService = {
  /**
   * Tính toán kích thước giày đề xuất bằng AI tức thì (Không cần đăng nhập)
   * @param {Object} payload - { footLengthCm, footWidthCm, brand, preferredFit, archType, footShape }
   */
  calculateSize: async (payload) => {
    return await api.post('/ai/calculate-size', payload);
  },

  /**
   * Lưu hồ sơ đo chân bàn chân vào tài khoản người dùng (Yêu cầu đăng nhập)
   * @param {Object} payload - { footLengthCm, footWidthCm, archType, footShape, preferredFit, brand, profileName, scanImageUrl }
   */
  saveProfile: async (payload) => {
    return await api.post('/ai/save-profile', payload);
  },

  /**
   * Lấy hồ sơ đo chân đã lưu của người dùng hiện tại (Yêu cầu đăng nhập)
   */
  getMyProfile: async () => {
    return await api.get('/ai/my-profile');
  },

  /**
   * Tự động đối chiếu số đo người dùng với sản phẩm cụ thể để đề xuất size chuẩn xác
   * @param {number|string} productId
   * @param {Object} params - { footLengthCm, footWidthCm, preferredFit }
   */
  recommendProductSize: async (productId, params = {}) => {
    return await api.get(`/ai/recommend-product-size/${productId}`, { params });
  },

  /**
   * Tìm kiếm sản phẩm bằng hình ảnh AI
   */
  visualSearch: async (imageUrl, queryText) => {
    return await api.post('/ai/visual-search', null, {
      params: { imageUrl, queryText },
    });
  },
};

export default aiService;
