import { create } from 'zustand';

let toastId = 0;

export const useUIStore = create((set, get) => ({
  // ── Assistant panel ──────────────────────────────────────────────────────────
  assistantOpen: false,
  activeEventId: null,

  toggleAssistant: () => set((s) => ({ assistantOpen: !s.assistantOpen })),
  openAssistant: () => set({ assistantOpen: true }),
  closeAssistant: () => set({ assistantOpen: false }),
  setActiveEventId: (id) => set((s) => (s.activeEventId === id ? s : { activeEventId: id })),

  // ── Desktop sidebar (collapse/expand) ────────────────────────────────────────
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ── Mobile sidebar (slide-over on small screens) ─────────────────────────────
  mobileSidebarOpen: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

  // ── Toasts ───────────────────────────────────────────────────────────────────
  toasts: [],

  addToast: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, type, title, message, duration }] }));
    return id;
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── Convenience helpers ──────────────────────────────────────────────────────
  toast: {
    success: (title, message, duration) => {
      useUIStore.getState().addToast({ type: 'success', title, message, duration });
    },
    error: (title, message, duration) => {
      useUIStore.getState().addToast({ type: 'error', title, message, duration });
    },
    warning: (title, message, duration) => {
      useUIStore.getState().addToast({ type: 'warning', title, message, duration });
    },
    info: (title, message, duration) => {
      useUIStore.getState().addToast({ type: 'info', title, message, duration });
    },
  },
}));

// ── Standalone toast helper object ───────────────────────────────────────────
export const toast = {
  success: (title, message, duration) => {
    useUIStore.getState().addToast({ type: 'success', title, message, duration });
  },
  error: (title, message, duration) => {
    useUIStore.getState().addToast({ type: 'error', title, message, duration });
  },
  warning: (title, message, duration) => {
    useUIStore.getState().addToast({ type: 'warning', title, message, duration });
  },
  info: (title, message, duration) => {
    useUIStore.getState().addToast({ type: 'info', title, message, duration });
  },
};
