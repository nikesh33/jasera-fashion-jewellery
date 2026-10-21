import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSearchOpen: false,
  isMobileMenuOpen: false,
  activeQuickViewProduct: null,

  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  openQuickView: (product) => set({ activeQuickViewProduct: product }),
  closeQuickView: () => set({ activeQuickViewProduct: null }),
}));
