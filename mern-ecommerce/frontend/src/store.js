import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // State
      cart: [],
      userPhone: '',
      checkoutData: {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        apt: '',
        city: '',
        state: '',
        zip: '',
      },

      // Actions
      addToCart: (product) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { ...product, quantity: 1 }] };
        }),

      removeFromCart: (productId) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === productId);
          if (existing && existing.quantity > 1) {
            return {
              cart: state.cart.map((item) =>
                item.id === productId
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              ),
            };
          }
          return { cart: state.cart.filter((item) => item.id !== productId) };
        }),

      setAuth: (phone) => set({ userPhone: phone }),

      setCheckoutData: (data) => set({ checkoutData: data }),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'ecommerce-storage',
    }
  )
);

export default useStore;
