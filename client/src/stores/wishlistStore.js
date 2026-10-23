import { create } from 'zustand';
import { api } from '../lib/api';

const LOCAL_WISHLIST_KEY = 'suvarna_wishlist';

const loadLocalWishlist = () => {
  try {
    const data = localStorage.getItem(LOCAL_WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalWishlist = (items) => {
  try {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save wishlist to localStorage', e);
  }
};

export const useWishlistStore = create((set, get) => ({
  items: loadLocalWishlist(),

  // Sync from MySQL wishlists table on login (Item #26)
  syncFromServer: async () => {
    try {
      const res = await api.get('/wishlist');
      if (res?.data?.wishlist) {
        saveLocalWishlist(res.data.wishlist);
        set({ items: res.data.wishlist });
      }
    } catch (e) {
      console.warn('Wishlist server sync warning:', e.message);
    }
  },

  toggleItem: (product) => {
    const items = get().items;
    const exists = items.some((item) => item.id === product.id);
    let updated;

    if (exists) {
      updated = items.filter((item) => item.id !== product.id);
    } else {
      updated = [
        ...items,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          selling_price: product.selling_price,
          mrp: product.mrp,
          primary_image: product.primary_image || (product.images && product.images[0]?.url),
          material: product.material,
          addedAt: new Date().toISOString(),
        },
      ];
    }

    saveLocalWishlist(updated);
    set({ items: updated });

    // Sync to database if customer is authenticated (Item #26: wishlists table)
    const token = localStorage.getItem('suvarna_token');
    if (token) {
      api.post('/wishlist/toggle', { productId: product.id }).catch((e) => {
        console.warn('Server wishlist toggle error:', e.message);
      });
    }

    return !exists;
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.id === productId);
  },

  removeItem: (productId) => {
    const updated = get().items.filter((item) => item.id !== productId);
    saveLocalWishlist(updated);
    set({ items: updated });

    const token = localStorage.getItem('suvarna_token');
    if (token) {
      api.delete(`/wishlist/${productId}`).catch(() => {});
    }
  },

  clearWishlist: () => {
    saveLocalWishlist([]);
    set({ items: [] });
  },

  getItemCount: () => get().items.length,
}));
