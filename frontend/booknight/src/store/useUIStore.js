import { create } from 'zustand';

export const useUIStore = create((set) => ({
  mobileSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

  editingBookmarkId: null,
  openEditModal: (bookmarkId) => set({ editingBookmarkId: bookmarkId }),
  closeEditModal: () => set({ editingBookmarkId: null }),

  managingWorkspaceId: null,
  openWorkspaceSettings: (workspaceId) => set({ managingWorkspaceId: workspaceId }),
  closeWorkspaceSettings: () => set({ managingWorkspaceId: null }),

  viewingBookmarkId: null,
  openViewModal: (bookmarkId) => set({ viewingBookmarkId: bookmarkId }),
  closeViewModal: () => set({ viewingBookmarkId: null }),
}));