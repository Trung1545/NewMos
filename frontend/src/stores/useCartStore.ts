import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  variantId?: number | string;
  sku?: string;
  size: number | string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
  color?: string;
  brand?: string;
}

export interface CartProductInput {
  id: string;
  variantId?: number | string;
  sku?: string;
  price: number;
  name?: string;
  image?: string;
  color?: string;
  brand?: string;
  quantity?: number;
}

export interface CartState {
  // State
  cart: CartItem[];
  isOpen: boolean;

  // Actions
  addToCart: (product: CartProductInput, size: number | string) => void;
  removeFromCart: (id: string, size: number | string) => void;
  updateQuantity: (id: string, size: number | string, qty: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;

  // Backward compatibility helpers
  items: CartItem[];
  addItem: (item: CartItem & { variantId?: string }) => void;
  removeItem: (variantId: string) => void;
  totalQuantity: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // State
      cart: [],
      items: [],
      isOpen: false,

      // Actions
      addToCart: (product, size) => {
        set((state) => {
          const currentCart = state.cart && state.cart.length > 0 ? state.cart : (state.items || []);
          const itemIndex = currentCart.findIndex(
            (item) => item.id === product.id && String(item.size) === String(size)
          );

          let updatedCart: CartItem[];
          if (itemIndex > -1) {
            // Đã tồn tại: Tăng số lượng
            updatedCart = [...currentCart];
            const addQty = product.quantity && product.quantity > 0 ? product.quantity : 1;
            updatedCart[itemIndex] = {
              ...updatedCart[itemIndex],
              variantId: product.variantId || updatedCart[itemIndex].variantId,
              sku: product.sku || updatedCart[itemIndex].sku,
              quantity: updatedCart[itemIndex].quantity + addQty,
            };
          } else {
            // Chưa tồn tại: Thêm item mới với số lượng ban đầu
            const newItem: CartItem = {
              id: product.id,
              variantId: product.variantId,
              sku: product.sku,
              size: size,
              quantity: product.quantity && product.quantity > 0 ? product.quantity : 1,
              price: product.price,
              name: product.name,
              image: product.image,
              color: product.color,
              brand: product.brand,
            };
            updatedCart = [...currentCart, newItem];
          }

          return {
            cart: updatedCart,
            items: updatedCart,
            isOpen: true,
          };
        });
      },

      removeFromCart: (id, size) => {
        set((state) => {
          const currentCart = state.cart && state.cart.length > 0 ? state.cart : (state.items || []);
          const updated = currentCart.filter(
            (item) => !(item.id === id && String(item.size) === String(size))
          );
          return { cart: updated, items: updated };
        });
      },

      updateQuantity: (id, size, qty) => {
        set((state) => {
          const currentCart = state.cart && state.cart.length > 0 ? state.cart : (state.items || []);
          // Nếu số lượng <= 0, tự động xóa item khỏi giỏ hàng
          if (qty <= 0) {
            const updated = currentCart.filter(
              (item) => !(item.id === id && String(item.size) === String(size))
            );
            return { cart: updated, items: updated };
          }

          // Cập nhật số lượng mới (làm tròn số nguyên dương)
          const validQty = Math.floor(qty);
          const updated = currentCart.map((item) =>
            item.id === id && String(item.size) === String(size)
              ? { ...item, quantity: validQty }
              : item
          );
          return { cart: updated, items: updated };
        });
      },

      clearCart: () => {
        set({ cart: [], items: [] });
      },

      getTotalPrice: () => {
        const list = get().cart?.length ? get().cart : (get().items || []);
        return list.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        const list = get().cart?.length ? get().cart : (get().items || []);
        return list.reduce((total, item) => total + item.quantity, 0);
      },

      setIsOpen: (isOpen) => {
        set({ isOpen });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      // Backward compatibility implementations
      addItem: (item) => {
        get().addToCart(item, item.size);
      },

      removeItem: (variantId) => {
        set((state) => {
          const currentCart = state.cart && state.cart.length > 0 ? state.cart : (state.items || []);
          const updated = currentCart.filter(
            (item) => `${item.id}-size-${item.size}` !== variantId && String(item.variantId) !== String(variantId)
          );
          return { cart: updated, items: updated };
        });
      },

      totalQuantity: () => get().getTotalItems(),
      totalAmount: () => get().getTotalPrice(),
    }),
    {
      name: 'shoe-cart-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      // Lưu đồng bộ cả cart và items vào localStorage để tương thích tuyệt đối
      partialize: (state) => ({ cart: state.cart, items: state.cart }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const activeList = state.cart && state.cart.length > 0 ? state.cart : (state.items || []);
          state.cart = activeList;
          state.items = activeList;
        }
      },
    }
  )
);
