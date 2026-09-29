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
   * Cập nhật thông tin tài khoản cá nhân (họ tên, số điện thoại, ngày sinh, giới tính, địa chỉ mặc định, avatar)
   * @param {Object} profileData - { fullName, phone, address, avatarUrl, gender, dateOfBirth }
   * @returns {Promise<any>}
   */
  updateProfile: async (profileData) => {
    return api.put('/users/profile', profileData);
  },

  /**
   * Đổi mật khẩu tài khoản người dùng
   * @param {Object} passwordData - { currentPassword, newPassword, confirmPassword }
   * @returns {Promise<any>}
   */
  changePassword: async (passwordData) => {
    return api.post('/users/change-password', passwordData);
  },

  /**
   * Tải lên file ảnh đại diện (avatar) cho người dùng
   * @param {File} file - Tập tin hình ảnh đại diện
   * @returns {Promise<any>}
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default userService;
