import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

// Cấu hình Base URL và Headers mặc định cho toàn bộ ứng dụng
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 1. Request Interceptor:
 * Tự động kiểm tra token trong localStorage (hoặc từ Zustand store) và đính kèm vào header Authorization: Bearer <token> nếu tồn tại.
 */
api.interceptors.request.use(
  (config) => {
    let token = null;

    // Ưu tiên 1: Lấy token từ Zustand useAuthStore
    try {
      token = useAuthStore.getState()?.token;
    } catch {
      // Bỏ qua nếu store chưa sẵn sàng
    }

    // Ưu tiên 2: Fallback lấy token từ localStorage
    if (!token && typeof window !== 'undefined') {
      token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token');
    }

    // Đính kèm header Authorization nếu tồn tại token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Chuẩn hóa: loại bỏ '/api' thừa ở đầu url nếu có
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 2. Response Interceptor:
 * Trích xuất trực tiếp response.data và bắt lỗi tập trung (ghi log lỗi rõ ràng, trả về Promise reject chuẩn).
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Bỏ qua chuyển hướng nếu request là tính size hoặc có cờ skipAuthRedirect
          const isSizeOrPublicRequest =
            error.config?.skipAuthRedirect ||
            error.config?.url?.includes('/size') ||
            error.config?.url?.includes('calculate');

          if (isSizeOrPublicRequest) {
            console.warn('[API 401] Bỏ qua chuyển hướng đăng nhập cho yêu cầu tính size công khai:', error.config?.url);
            break;
          }

          console.warn('[API 401] Phiên đăng nhập hết hạn hoặc không hợp lệ. Đang chuyển hướng...');
          try {
            useAuthStore.getState()?.logout();
          } catch {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('token');
            }
          }
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            window.location.href = '/auth';
          }
          break;

        case 403:
          console.error('[API 403] Bạn không có quyền truy cập vào tài nguyên này.');
          break;

        case 404:
          console.error('[API 404] Không tìm thấy tài nguyên yêu cầu:', error.config?.url);
          break;

        case 500:
          console.error(
            '[API 500] Lỗi máy chủ hệ thống Backend:',
            data?.message || 'Có lỗi xảy ra từ máy chủ, vui lòng thử lại sau.'
          );
          break;

        default:
          console.error(`[API Error ${status}]:`, data?.message || error.message);
          break;
      }
    } else if (error.request) {
      console.error(
        '[API Network Error] Không thể kết nối tới máy chủ Backend. Vui lòng kiểm tra dịch vụ Spring Boot.'
      );
    } else {
      console.error('[API Error]:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
