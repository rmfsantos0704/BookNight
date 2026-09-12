import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  editingBookmarkId: null,
  openEditModal: (bookmarkId) => set({ editingBookmarkId: bookmarkId }),
  closeEditModal: () => set({ editingBookmarkId: null }),
}));