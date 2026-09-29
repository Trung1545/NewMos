import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AIFitResult {
  recommendedSizeEu?: string | number | null;
  recommendedSizeUs?: string | number | null;
  confidenceScore?: number | null;
  fittingAdvice?: string | null;
  fitAssessment?: string | null;
  footShape?: string | null;
  archType?: string | null;
  preferredFit?: string | null;
  footLengthCm?: number | null;
  footWidthCm?: number | null;
  brand?: string | null;
  profileId?: number | string | null;
  [key: string]: any;
}

export interface AIState {
  isModalOpen: boolean;
  isVisualSearchOpen: boolean;
  activeBrand: string | null;
  activeProductId: number | string | null;

  // Measurement state: Trạng thái ban đầu bắt buộc là null / rỗng
  footLength: number | null;
  footWidth: number | null;
  footShape: string | null;
  shoeModel: string | null;
  recommendedSize: number | string | null;

  // Detailed AI calculation results
  scanResults: AIFitResult | null;
  userProfile: any | null;

  setModalOpen: (open: boolean, brand?: string, productId?: number | string) => void;
  setVisualSearchOpen: (open: boolean) => void;
  setRecommendedSize: (size: number | string | null) => void;
  setMeasurements: (length: number | null, width?: number | null, shoeModel?: string, footShape?: string) => void;
  setScanResults: (results: AIFitResult | null) => void;
  setUserProfile: (profile: any) => void;
  clearProfile: () => void;
  resetAI: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      isModalOpen: false,
      isVisualSearchOpen: false,
      activeBrand: null,
      activeProductId: null,

      recommendedSize: null,
      footLength: null,
      footWidth: null,
      footShape: null,
      shoeModel: null,

      scanResults: null,
      userProfile: null,

      setModalOpen: (open, brand, productId) =>
        set((state) => ({
          isModalOpen: open,
          activeBrand: brand !== undefined ? brand : state.activeBrand,
          activeProductId: productId !== undefined ? productId : state.activeProductId,
        })),

      setVisualSearchOpen: (open) => set({ isVisualSearchOpen: open }),

      setRecommendedSize: (size) => set({ recommendedSize: size }),

      // Đảm bảo các hàm tính toán gợi ý size giày chỉ chạy khi giá trị chiều dài (length) hợp lệ (> 0)
      setMeasurements: (length, width, shoeModel, footShape) => {
        const numLength = typeof length === 'number' ? length : parseFloat(String(length));
        const numWidth = typeof width === 'number' ? width : parseFloat(String(width));

        if (isNaN(numLength) || numLength <= 0) {
          set({
            footLength: null,
            footWidth: null,
            footShape: null,
            shoeModel: null,
            recommendedSize: null,
          });
          return;
        }

        const validWidth = !isNaN(numWidth) && numWidth > 0 ? numWidth : null;

        // Tính size theo công thức chuẩn NewMos Runner Pro (36 - 40)
        let baseSize = 38;
        if (numLength <= 22.5) baseSize = 36;
        else if (numLength <= 23.0) baseSize = 37;
        else if (numLength <= 23.5) baseSize = 38;
        else if (numLength <= 24.0) baseSize = 39;
        else baseSize = 40;

        let rec = baseSize;
        if (footShape === 'WIDE') {
          rec = baseSize >= 40 ? 40 : baseSize + 1;
        }

        set({
          footLength: numLength,
          footWidth: validWidth,
          footShape: footShape || null,
          shoeModel: shoeModel || null,
          recommendedSize: rec,
        });
      },

      setScanResults: (results) => {
        if (!results || !results.footLengthCm || Number(results.footLengthCm) <= 0) {
          set({
            scanResults: null,
            recommendedSize: null,
            footLength: null,
            footWidth: null,
            footShape: null,
          });
          return;
        }

        set({
          scanResults: results,
          recommendedSize: results?.recommendedSizeEu || null,
          footLength: Number(results.footLengthCm),
          footWidth: results?.footWidthCm && Number(results.footWidthCm) > 0 ? Number(results.footWidthCm) : null,
          footShape: results?.footShape || null,
        });
      },

      setUserProfile: (profile) => {
        if (!profile || !profile.footLengthCm || Number(profile.footLengthCm) <= 0) {
          set({
            userProfile: null,
            recommendedSize: null,
            footLength: null,
            footWidth: null,
            footShape: null,
          });
          return;
        }

        set({
          userProfile: profile,
          recommendedSize: profile.recommendedSizeEu || null,
          footLength: Number(profile.footLengthCm),
          footWidth: profile.footWidthCm && Number(profile.footWidthCm) > 0 ? Number(profile.footWidthCm) : null,
          footShape: profile.footShape || null,
        });
      },

      clearProfile: () =>
        set({
          footLength: null,
          footWidth: null,
          footShape: null,
          shoeModel: null,
          recommendedSize: null,
          scanResults: null,
          userProfile: null,
        }),

      resetAI: () =>
        set({
          isModalOpen: false,
          isVisualSearchOpen: false,
          scanResults: null,
        }),
    }),
    {
      name: 'ai-fit-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (null as unknown as Storage))),
      partialize: (state) => {
        // Chỉ lưu vào local storage khi có số đo thực sự hợp lệ (> 0)
        if (!state.footLength || state.footLength <= 0) {
          return {
            recommendedSize: null,
            footLength: null,
            footWidth: null,
            footShape: null,
            scanResults: null,
            userProfile: null,
          };
        }
        return {
          recommendedSize: state.recommendedSize,
          footLength: state.footLength,
          footWidth: state.footWidth,
          footShape: state.footShape,
          scanResults: state.scanResults,
          userProfile: state.userProfile,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Xóa bỏ triệt để mock data cũ trong localStorage nếu không hợp lệ
          if (!state.footLength || state.footLength <= 0) {
            state.footLength = null;
            state.footWidth = null;
            state.footShape = null;
            state.recommendedSize = null;
            state.userProfile = null;
            state.scanResults = null;
          }
        }
      },
    }
  )
);

export default useAIStore;
