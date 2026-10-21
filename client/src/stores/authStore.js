import { create } from 'zustand';
import { api } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('suvarna_user') || 'null'),
  token: localStorage.getItem('suvarna_token') || null,
  isAuthenticated: !!localStorage.getItem('suvarna_token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', credentials);
      const { user, token } = res.data;
      localStorage.setItem('suvarna_token', token);
      localStorage.setItem('suvarna_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  adminLogin: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/admin/login', credentials);
      const { user, token } = res.data;
      localStorage.setItem('suvarna_token', token);
      localStorage.setItem('suvarna_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', userData);
      const { user, token } = res.data;
      if (token) {
        localStorage.setItem('suvarna_token', token);
        localStorage.setItem('suvarna_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return res.data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('suvarna_token');
    localStorage.removeItem('suvarna_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: (updatedData) => {
    const updatedUser = { ...get().user, ...updatedData };
    localStorage.setItem('suvarna_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));
