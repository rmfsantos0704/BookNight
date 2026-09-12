import { create } from 'zustand';
import { api } from '../lib/api';

export const useBoardStore = create((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  bookmarks: [],
  loadingBookmarks: false,
  error: null,

  loadWorkspaces: async () => {
    const data = await api.listWorkspaces();
    set({ workspaces: data.workspaces });
    if (!get().activeWorkspaceId && data.workspaces.length > 0) {
      get().setActiveWorkspace(data.workspaces[0]._id);
    }
  },

  createWorkspace: async (name) => {
    const data = await api.createWorkspace({ name });
    set((state) => ({ workspaces: [data.workspace, ...state.workspaces] }));
    get().setActiveWorkspace(data.workspace._id);
  },

  setActiveWorkspace: (workspaceId) => {
    set({ activeWorkspaceId: workspaceId });
    get().loadBookmarks(workspaceId);
  },

  loadBookmarks: async (workspaceId) => {
    set({ loadingBookmarks: true, error: null });
    try {
      const data = await api.listBookmarks(workspaceId);
      set({ bookmarks: data.bookmarks, loadingBookmarks: false });
    } catch (err) {
      set({ error: err.message, loadingBookmarks: false });
    }
  },

  // Optimistic add - the backend returns the skeleton doc immediately, and
  // we poll it below until the worker finishes scraping metadata.
  addBookmark: async (url, tags = []) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) throw new Error('No active workspace selected');

    const data = await api.createBookmark({ url, workspaceId: activeWorkspaceId, tags });
    set((state) => ({ bookmarks: [data.bookmark, ...state.bookmarks] }));
    get().pollBookmark(data.bookmark._id);
    return data.bookmark;
  },

  // Simple poll loop: checks every 1.5s (up to 10 tries) for the worker to
  // flip status from pending -> completed/failed, then patches it into state.
  pollBookmark: (bookmarkId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const data = await api.getBookmark(bookmarkId);
        if (data.bookmark.status !== 'pending' || attempts >= 10) {
          clearInterval(interval);
          set((state) => ({
            bookmarks: state.bookmarks.map((b) => (b._id === bookmarkId ? data.bookmark : b)),
          }));
        }
      } catch {
        clearInterval(interval);
      }
    }, 1500);
  },

  removeBookmark: async (bookmarkId) => {
    await api.deleteBookmark(bookmarkId);
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b._id !== bookmarkId) }));
  },
}));
