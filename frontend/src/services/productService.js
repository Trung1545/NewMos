import api from './api';

/**
 * Service giao tiếp với Catalog Backend APIs (/api/products)
 */
export const productService = {
  /**
   * Gọi GET /products với object params chứa:
   * @param {Object} params - { page, size, brand, category, minPrice, maxPrice, search, q, pageSize, sortBy }
   * @returns {Promise<any>}
   */
  getAllProducts: async (params = {}) => {
    const queryParams = { ...params };

    // Map alias 'search' -> 'q' theo định dạng Backend ProductFilterRequest
    if (queryParams.search && !queryParams.q) {
      queryParams.q = queryParams.search;
    }
    // Map alias 'size' -> 'pageSize' theo định dạng Spring Data
    if (queryParams.size && !queryParams.pageSize) {
      queryParams.pageSize = queryParams.size;
    }

    return api.get('/products', { params: queryParams });
  },

  /**
   * Gọi GET /products/${id} để lấy toàn bộ thông tin chi tiết một đôi giày kèm danh sách biến thể size/màu và tồn kho.
   * @param {number|string} id - ID sản phẩm
   * @returns {Promise<any>}
   */
  getProductById: async (id) => {
    if (!id) {
      throw new Error('Product ID is required');
    }
    return api.get(`/products/${id}`);
  },

  /**
   * Gọi GET /products/featured để lấy danh sách sản phẩm nổi bật/mới nhất cho trang chủ
   * @returns {Promise<any>}
   */
  getFeaturedProducts: async () => {
    return api.get('/products/featured');
  },

  /**
   * Gọi GET /products/slug/${slug} lấy chi tiết theo slug thân thiện SEO
   * @param {string} slug
   * @returns {Promise<any>}
   */
  getProductBySlug: async (slug) => {
    if (!slug) {
      throw new Error('Product Slug is required');
    }
    return api.get(`/products/slug/${slug}`);
  },
};

export const { getAllProducts, getProductById, getProductBySlug, getFeaturedProducts } = productService;
export default productService;
