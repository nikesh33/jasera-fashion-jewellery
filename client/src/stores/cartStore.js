import { create } from 'zustand';
import { api } from '../lib/api';

const LOCAL_CART_KEY = 'suvarna_cart';

const loadLocalCart = () => {
  try {
    const data = localStorage.getItem(LOCAL_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalCart = (items) => {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
};

export const useCartStore = create((set, get) => ({
  items: loadLocalCart(),
  isDrawerOpen: false,
  coupon: null,
  discount: 0,
  shippingFee: 0, // Free delivery for jewellery

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  addItem: (product, variant = null, quantity = 1) => {
    const currentItems = [...get().items];
    const variantId = variant ? variant.id : null;
    const existingIndex = currentItems.findIndex(
      (item) => item.product.id === product.id && item.variantId === variantId
    );

    const price = variant?.price_override || product.selling_price;
    const mrp = product.mrp;
    const image = variant?.image_url || product.primary_image || (product.images && product.images[0]?.url) || '';

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity;
    } else {
      currentItems.push({
        id: `${product.id}_${variantId || 'base'}`,
        productId: product.id,
        variantId,
        variant,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          selling_price: price,
          mrp: mrp,
          primary_image: image,
          material: product.material,
        },
        quantity,
      });
    }

    saveLocalCart(currentItems);
    set({ items: currentItems, isDrawerOpen: true });
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    const currentItems = get().items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
    saveLocalCart(currentItems);
    set({ items: currentItems });
  },

  removeItem: (itemId) => {
    const currentItems = get().items.filter((item) => item.id !== itemId);
    saveLocalCart(currentItems);
    set({ items: currentItems });
  },

  clearCart: () => {
    saveLocalCart([]);
    set({ items: [], coupon: null, discount: 0 });
  },

  applyCoupon: async (couponCode) => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return { success: false, message: 'Please enter a coupon code' };

    // Standard coupons: SUVARNA10 (10% off), WELCOME500 (flat ₹500 off), ROYAL15 (15% off)
    const subtotal = get().getSubtotal();
    let discountAmount = 0;

    if (code === 'SUVARNA10') {
      discountAmount = Math.round(subtotal * 0.1);
    } else if (code === 'WELCOME500') {
      discountAmount = Math.min(500, subtotal);
    } else if (code === 'ROYAL15') {
      discountAmount = Math.round(subtotal * 0.15);
    } else {
      return { success: false, message: 'Invalid or expired coupon code' };
    }

    set({ coupon: code, discount: discountAmount });
    return { success: true, message: `Coupon ${code} applied successfully!` };
  },

  removeCoupon: () => {
    set({ coupon: null, discount: 0 });
  },

  // Computed values
  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.product.selling_price * item.quantity, 0);
  },

  getMrpTotal: () => {
    return get().items.reduce((total, item) => total + (item.product.mrp || item.product.selling_price) * item.quantity, 0);
  },

  getTax: () => {
    // 3% GST on Gold/Silver Jewellery
    const taxableAmount = Math.max(0, get().getSubtotal() - get().discount);
    return Math.round(taxableAmount * 0.03);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    const tax = get().getTax();
    return Math.max(0, subtotal - discount + tax + get().shippingFee);
  },
}));
