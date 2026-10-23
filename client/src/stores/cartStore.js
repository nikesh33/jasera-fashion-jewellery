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
    // Asynchronously sync with MySQL cart_items / carts if user is logged in (Item #3)
    const token = localStorage.getItem('suvarna_token');
    if (token) {
      api.post('/cart/sync', {
        items: items.map((i) => ({
          productId: i.productId || i.product?.id || i.id,
          variantId: i.variantId || null,
          quantity: i.quantity || 1,
        })),
      }).catch((e) => console.warn('Non-blocking: cart sync warning:', e.message));
    }
  } catch (e) {
    console.error('Failed to save cart', e);
  }
};

export const useCartStore = create((set, get) => ({
  items: loadLocalCart(),
  isDrawerOpen: false,
  coupon: null,
  discount: 0,
  shippingFee: 0,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  // Fetch server database cart on login (Item #3: carts & cart_items)
  syncFromServer: async () => {
    try {
      const res = await api.get('/cart');
      if (res?.data?.items?.length > 0) {
        const formatted = res.data.items.map((i) => ({
          id: `${i.productId}_${i.variantId || 'base'}`,
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          product: {
            id: i.productId,
            name: i.name,
            slug: i.slug,
            selling_price: i.price,
            mrp: i.mrp || i.price * 1.5,
            primary_image: i.image,
            material: i.size || 'Fashion Jewellery',
          },
        }));
        saveLocalCart(formatted);
        set({ items: formatted });
      }
    } catch (e) {
      console.warn('Cart server load warning:', e.message);
    }
  },

  addItem: (product, variant = null, quantity = 1) => {
    const currentItems = [...get().items];
    const variantId = variant ? variant.id : (product.variantId || null);
    const existingIndex = currentItems.findIndex(
      (item) => item.product.id === product.id && item.variantId === variantId
    );

    const price = variant?.price_override || product.selling_price || product.price;
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
    // Also clear server-side cart
    const token = localStorage.getItem('suvarna_token');
    if (token) {
      api.delete('/cart/clear').catch(() => {});
    }
  },

  // Dynamic Coupon Validation against coupons table in Database (Item #9, #10)
  applyCoupon: async (couponCode) => {
    const code = couponCode?.trim()?.toUpperCase();
    if (!code) return { success: false, message: 'Please enter a coupon code' };

    const subtotal = get().getSubtotal();

    try {
      const res = await api.post('/coupons/validate', {
        code,
        cartSubtotal: subtotal,
      });

      if (res?.success && res.data) {
        const discountAmount = Number(res.data.discountAmount) || 0;
        set({ coupon: res.data.code, discount: discountAmount });
        return {
          success: true,
          message: res.data.message || `Coupon ${res.data.code} applied! You saved ₹${discountAmount}.`,
        };
      }

      return { success: false, message: res?.message || 'Invalid coupon code' };
    } catch (err) {
      return { success: false, message: err.message || 'Coupon code not applicable for this cart' };
    }
  },

  removeCoupon: () => {
    set({ coupon: null, discount: 0 });
  },

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
