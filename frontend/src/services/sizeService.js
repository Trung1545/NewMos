import api from './api';

export const sizeService = {
  /**
   * Tính toán size giày chuẩn NewMos tức thì từ số đo cm và dáng bàn chân
   * @param {Object} data - { footLengthCm, footShape, shoeModel }
   */
  calculateSize: async (data) => {
    return await api.post('/size/calculate', data, { skipAuthRedirect: true });
  },
};

export default sizeService;
