import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken }) => set({
        user,
        accessToken,
        isAuthenticated: true,
      }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      }),

      getAccessToken: () => get().accessToken,
    }),
    {
      name: 'xp-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
