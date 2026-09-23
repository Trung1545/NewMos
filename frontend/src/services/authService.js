import api from './api';
import { useAuthStore } from '../stores/useAuthStore';

export const authService = {
  /**
   * Đăng nhập người dùng bằng email hoặc số điện thoại
   * @param {Object} credentials - { identifier, password } hoặc { email, password }
   */
  login: async (credentials) => {
    // Chuẩn hóa payload hỗ trợ cả identifier và email
    const payload = {
      email: credentials.identifier || credentials.email,
      identifier: credentials.identifier || credentials.email,
      password: credentials.password,
    };
    return await api.post('/auth/login', payload);
  },

  /**
   * Đăng ký tài khoản thành viên mới
   * @param {Object} userData - { fullName, email, password, phone }
   */
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  /**
   * Lấy thông tin tài khoản người dùng hiện tại đang đăng nhập
   */
  getCurrentUser: async () => {
    return await api.get('/auth/me');
  },

  /**
   * Làm mới Access Token
   * @param {string} refreshToken
   */
  refreshToken: async (refreshToken) => {
    return await api.post('/auth/refresh', null, {
      params: { refreshToken },
    });
  },

  /**
   * Đăng xuất phiên làm việc
   */
  logout: () => {
    useAuthStore.getState().logout();
  },
};

export default authService;
