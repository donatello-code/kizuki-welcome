import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Set to false to disable test prefill in production
const USE_PREFILL = false;

const PREFILL_DATA = {
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
  address: '123 Main Street',
  apt: 'Apt 4B',
  city: 'New York',
  state: 'NY',
  zip: '10001',
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// ─── Cart sync with backend ───────────────────────────────
async function syncCartToBackend(phone, cart) {
  if (!phone || phone.replace(/\D/g, '').length < 10) return;
  try {
    await fetch(`${BACKEND_URL}/api/cart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, cart }),
    });
  } catch (err) {
    console.warn('Cart sync failed (backend may be offline):', err.message);
  }
}

async function fetchCartFromBackend(phone) {
  if (!phone || phone.replace(/\D/g, '').length < 10) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/cart?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.cart || null;
  } catch (err) {
    console.warn('Cart fetch failed (backend may be offline):', err.message);
    return null;
  }
}

const useStore = create(
  persist(
    (set, get) => ({
      // State
      cart: [],
      userPhone: '',
      checkoutData: USE_PREFILL ? { ...PREFILL_DATA } : {
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
          let newCart;
          if (existing) {
            newCart = state.cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            newCart = [...state.cart, { ...product, quantity: 1 }];
          }
          // Sync to backend
          syncCartToBackend(state.userPhone, newCart);
          return { cart: newCart };
        }),

      removeFromCart: (productId) =>
        set((state) => {
          const existing = state.cart.find((item) => item.id === productId);
          let newCart;
          if (existing && existing.quantity > 1) {
            newCart = state.cart.map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            );
          } else {
            newCart = state.cart.filter((item) => item.id !== productId);
          }
          // Sync to backend
          syncCartToBackend(state.userPhone, newCart);
          return { cart: newCart };
        }),

      setAuth: async (phone) => {
        set({ userPhone: phone });
        // When phone is set, try to fetch existing cart from backend
        if (phone && phone.replace(/\D/g, '').length >= 10) {
          const backendCart = await fetchCartFromBackend(phone);
          if (backendCart && backendCart.length > 0) {
            set({ cart: backendCart });
          } else {
            // Sync current local cart to backend
            const currentCart = get().cart;
            if (currentCart.length > 0) {
              syncCartToBackend(phone, currentCart);
            }
          }
        }
      },

      setCheckoutData: (data) => set({ checkoutData: data }),

      clearCart: () =>
        set((state) => {
          syncCartToBackend(state.userPhone, []);
          return { cart: [] };
        }),
    }),
    {
      name: 'ecommerce-storage',
    }
  )
);

export default useStore;
