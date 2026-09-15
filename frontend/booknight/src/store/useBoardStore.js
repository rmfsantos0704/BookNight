import { create } from 'zustand';
import { api } from '../lib/api';

export const useBoardStore = create((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  bookmarks: [],
  loadingBookmarks: false,
  error: null,

  // Fully populated (owner/members with email+displayName) detail for
  // whichever workspace is currently open in the settings modal.
  workspaceDetail: null,
  loadingWorkspaceDetail: false,

  searchQuery: '',
  searchResults: [],
  searching: false,
  searchError: null,

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
  // If the URL is already saved in this workspace, the backend responds
  // with a duplicate error (not silently created) - pass allowDuplicate:true
  // to save it anyway once the caller has confirmed with the user.
  addBookmark: async (url, tags = [], allowDuplicate = false) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) throw new Error('No active workspace selected');

    const data = await api.createBookmark({
      url,
      workspaceId: activeWorkspaceId,
      tags,
      allowDuplicate,
    });
    set((state) => ({ bookmarks: [data.bookmark, ...state.bookmarks] }));
    get().pollBookmark(data.bookmark._id);
    return data.bookmark;
  },

  // Poll loop: checks for the external cron-triggered scrape to finish.
  // Latency is now minutes-scale (an external scheduler triggers processing
  // every 5-10 min), not the near-instant BullMQ latency this used to have -
  // so this polls less frequently but for much longer than before.
  pollBookmark: (bookmarkId) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 90; // ~15 minutes at 10s intervals
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const data = await api.getBookmark(bookmarkId);
        const stillWorking = data.bookmark.status === 'pending' || data.bookmark.status === 'processing';
        if (!stillWorking || attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          set((state) => ({
            bookmarks: state.bookmarks.map((b) => (b._id === bookmarkId ? data.bookmark : b)),
          }));
        }
      } catch {
        clearInterval(interval);
      }
    }, 10000);
  },

  removeBookmark: async (bookmarkId) => {
    await api.deleteBookmark(bookmarkId);
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b._id !== bookmarkId) }));
  },

  editBookmark: async (bookmarkId, updates) => {
    const data = await api.updateBookmark(bookmarkId, updates);
    set((state) => ({
      bookmarks: state.bookmarks.map((b) => (b._id === bookmarkId ? data.bookmark : b)),
      searchResults: state.searchResults.map((b) => (b._id === bookmarkId ? data.bookmark : b)),
    }));
    return data.bookmark;
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  runSearch: async (query) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId || !query.trim()) {
      set({ searchResults: [], searching: false, searchError: null });
      return;
    }
    set({ searching: true, searchError: null });
    try {
      const data = await api.searchBookmarks(activeWorkspaceId, query.trim());
      set({ searchResults: data.bookmarks, searching: false });
    } catch (err) {
      set({ searchError: err.message, searching: false, searchResults: [] });
    }
  },

  clearSearch: () => set({ searchQuery: '', searchResults: [], searchError: null }),

  loadWorkspaceDetail: async (workspaceId) => {
    set({ loadingWorkspaceDetail: true });
    try {
      const data = await api.getWorkspace(workspaceId);
      set({ workspaceDetail: data.workspace, loadingWorkspaceDetail: false });
    } catch (err) {
      set({ loadingWorkspaceDetail: false, error: err.message });
    }
  },

  clearWorkspaceDetail: () => set({ workspaceDetail: null }),

  renameWorkspace: async (workspaceId, name) => {
    const data = await api.updateWorkspace(workspaceId, { name });
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w._id === workspaceId ? data.workspace : w)),
      workspaceDetail:
        state.workspaceDetail?._id === workspaceId
          ? { ...state.workspaceDetail, name: data.workspace.name }
          : state.workspaceDetail,
    }));
  },

  // If the deleted workspace was the active one, falls back to whatever
  // workspace is now first in the list (or null if none remain).
  deleteWorkspace: async (workspaceId) => {
    await api.deleteWorkspace(workspaceId);
    set((state) => {
      const remaining = state.workspaces.filter((w) => w._id !== workspaceId);
      const wasActive = state.activeWorkspaceId === workspaceId;
      return {
        workspaces: remaining,
        activeWorkspaceId: wasActive ? null : state.activeWorkspaceId,
        bookmarks: wasActive ? [] : state.bookmarks,
        workspaceDetail: null,
      };
    });
    const { activeWorkspaceId, workspaces } = get();
    if (!activeWorkspaceId && workspaces.length > 0) {
      get().setActiveWorkspace(workspaces[0]._id);
    }
  },

  addWorkspaceMember: async (workspaceId, email) => {
    const data = await api.addWorkspaceMember(workspaceId, email);
    set({ workspaceDetail: data.workspace });
  },

  removeWorkspaceMember: async (workspaceId, memberId) => {
    const data = await api.removeWorkspaceMember(workspaceId, memberId);
    set({ workspaceDetail: data.workspace });
  },
}));