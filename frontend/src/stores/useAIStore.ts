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

  // Measurement state
  footLength: number | null;
  footWidth: number | null;
  shoeModel: string | null;
  recommendedSize: number | string | null;

  // Detailed AI calculation results
  scanResults: AIFitResult | null;
  userProfile: any | null;

  setModalOpen: (open: boolean, brand?: string, productId?: number | string) => void;
  setVisualSearchOpen: (open: boolean) => void;
  setRecommendedSize: (size: number | string | null) => void;
  setMeasurements: (length: number, width: number, shoeModel?: string) => void;
  setScanResults: (results: AIFitResult | null) => void;
  setUserProfile: (profile: any) => void;
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

      setMeasurements: (length, width, shoeModel) => {
        const baseEU = Math.round((length + 1.5) * 1.5);
        set({
          footLength: length,
          footWidth: width,
          shoeModel: shoeModel || null,
          recommendedSize: baseEU,
        });
      },

      setScanResults: (results) => {
        set({
          scanResults: results,
          recommendedSize: results?.recommendedSizeEu || null,
          footLength: results?.footLengthCm || null,
          footWidth: results?.footWidthCm || null,
        });
      },

      setUserProfile: (profile) => {
        set({
          userProfile: profile,
          recommendedSize: profile?.recommendedSizeEu || null,
          footLength: profile?.footLengthCm || null,
          footWidth: profile?.footWidthCm || null,
        });
      },

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
      partialize: (state) => ({
        recommendedSize: state.recommendedSize,
        footLength: state.footLength,
        footWidth: state.footWidth,
        scanResults: state.scanResults,
        userProfile: state.userProfile,
      }),
    }
  )
);

export default useAIStore;
