import api from './api';

/**
 * Service giao tiếp với User Profile APIs (/api/users)
 */
export const userService = {
  /**
   * Lấy thông tin tài khoản người dùng đang đăng nhập
   * @returns {Promise<any>}
   */
  getProfile: async () => {
    return api.get('/users/profile');
  },

  /**
   * Cập nhật thông tin tài khoản cá nhân (họ tên, số điện thoại, địa chỉ mặc định)
   * @param {Object} profileData - { fullName, phone, address, avatarUrl }
   * @returns {Promise<any>}
   */
  updateProfile: async (profileData) => {
    return api.put('/users/profile', profileData);
  },
};

export default userService;
