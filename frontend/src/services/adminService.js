import api from './api';

export const adminService = {
  /**
   * Lấy danh sách toàn bộ đơn hàng (hỗ trợ lọc theo trạng thái)
   * @param {string} [status] - PENDING, CONFIRMED, SHIPPING, DELIVERED, COMPLETED, CANCELLED
   */
  getOrders: async (status = null) => {
    const params = status && status !== 'ALL' ? { status } : {};
    return api.get('/admin/orders', { params });
  },

  /**
   * Cập nhật trạng thái của đơn hàng theo ID
   * @param {number|string} orderId 
   * @param {string} status 
   */
  updateOrderStatus: async (orderId, status) => {
    return api.put(`/admin/orders/${orderId}/status`, { status });
  },

  /**
   * Duyệt đơn hàng (chuyển trạng thái từ PENDING sang CONFIRMED)
   * @param {number|string} orderId
   */
  approveOrder: async (orderId) => {
    return api.put(`/admin/orders/${orderId}/approve`);
  },

  /**
   * Xác nhận giao hàng (chuyển sang SHIPPING)
   * @param {number|string} orderId
   */
  shipOrder: async (orderId) => {
    return api.put(`/admin/orders/${orderId}/ship`);
  },

  /**
   * Xác nhận giao hàng thành công (chuyển sang DELIVERED)
   * @param {number|string} orderId
   */
  completeOrder: async (orderId) => {
    return api.put(`/admin/orders/${orderId}/complete`);
  },

  /**
   * Hủy đơn hàng kèm lý do, tự động hoàn lại số lượng tồn kho (restock)
   * @param {number|string} orderId
   * @param {string} [reason]
   */
  cancelOrder: async (orderId, reason = null) => {
    return api.put(`/admin/orders/${orderId}/cancel`, { reason });
  },

  /**
   * Lấy danh sách kiểm soát tồn kho toàn bộ sản phẩm và các biến thể size
   */
  getInventory: async () => {
    return api.get('/admin/inventory');
  },

  /**
   * Cập nhật nhanh số lượng tồn kho của một biến thể
   * @param {number|string} variantId
   * @param {number} stockQuantity
   */
  updateVariantStock: async (variantId, stockQuantity) => {
    return api.put(`/admin/variants/${variantId}/stock`, { stockQuantity: Number(stockQuantity) });
  },

  /**
   * Thêm sản phẩm mới kèm 5 size chuẩn (36 - 40)
   * @param {Object} productData
   */
  createProduct: async (productData) => {
    return api.post('/admin/products', productData);
  },

  /**
   * Cập nhật thông tin chi tiết sản phẩm
   * @param {number|string} productId
   * @param {Object} productData
   */
  updateProduct: async (productId, productData) => {
    return api.put(`/admin/products/${productId}`, productData);
  },

  /**
   * Xóa hoặc chuyển trạng thái ẩn/hiện sản phẩm
   * @param {number|string} productId
   * @param {boolean} [permanent]
   */
  deleteProduct: async (productId, permanent = false) => {
    return api.delete(`/admin/products/${productId}`, { params: { permanent } });
  },

  /**
   * Lấy dữ liệu thống kê doanh thu và chỉ số đơn hàng theo chuẩn kế toán
   */
  getDashboardAnalytics: async () => {
    return api.get('/admin/analytics/dashboard');
  },
};

export default adminService;
