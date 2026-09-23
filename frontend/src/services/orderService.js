import api from './api';

/**
 * Service giao tiếp với Order Backend APIs (/api/orders)
 */
export const orderService = {
  /**
   * Tạo đơn hàng mới (Gọi POST /api/orders)
   * @param {Object} orderPayload - Thông tin đơn hàng & danh sách sản phẩm
   * @returns {Promise<any>}
   */
  createOrder: async (orderPayload) => {
    return api.post('/orders', orderPayload);
  },

  /**
   * Lấy chi tiết đơn hàng theo mã đơn (Gọi GET /api/orders/track/${orderCode})
   * @param {string} orderCode - Mã đơn hàng dạng NM-XXXXXX
   * @returns {Promise<any>}
   */
  getOrderByCode: async (orderCode) => {
    return api.get(`/orders/track/${encodeURIComponent(orderCode)}`);
  },

  /**
   * Tra cứu đơn hàng theo mã đơn (Hỗ trợ alias)
   * @param {string} orderCode
   * @param {string} [phone]
   * @returns {Promise<any>}
   */
  trackOrder: async (orderCode, phone = '') => {
    if (orderCode) {
      return api.get(`/orders/track/${encodeURIComponent(orderCode)}`);
    }
    return api.get('/orders/track', { params: { orderCode, phone } });
  },

  /**
   * Lấy lịch sử đơn hàng của người dùng đang đăng nhập (Gọi GET /api/orders/my-orders)
   * @param {number} [page]
   * @param {number} [size]
   * @returns {Promise<any>}
   */
  getMyOrders: async (page, size) => {
    const params = {};
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    return api.get('/orders/my-orders', { params });
  },

  /**
   * Cập nhật trạng thái đơn hàng (Dành cho Quản trị viên / Nhân viên)
   * @param {number|string} id
   * @param {string} status - PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED
   * @returns {Promise<any>}
   */
  updateOrderStatus: async (id, status) => {
    return api.put(`/orders/${id}/status`, null, { params: { status } });
  },
};

export const {
  createOrder,
  getOrderByCode,
  trackOrder,
  getMyOrders,
  updateOrderStatus,
} = orderService;

export default orderService;
