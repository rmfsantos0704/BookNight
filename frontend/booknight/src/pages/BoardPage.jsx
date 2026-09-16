import { useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { useUIStore } from '../store/useUIStore';
import Sidebar from '../components/layout/Sidebar';
import CaptureBar from '../components/bookmarks/CaptureBar';
import SearchBar from '../components/bookmarks/SearchBar';
import BentoGrid from '../components/bookmarks/BentoGrid';
import EditBookmarkModal from '../components/bookmarks/EditbookmarkModal';
import WorkspaceSettingsModal from '../components/layout/Workspacesettingsmodal';

export default function BoardPage() {
  const {
    workspaces,
    activeWorkspaceId,
    bookmarks,
    loadingBookmarks,
    loadWorkspaces,
    searchQuery,
    searchResults,
    searching,
    searchError,
  } = useBoardStore();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      {/* Mobile-only top bar - the sidebar becomes an off-canvas drawer below
          the md breakpoint, so this is the only way to open it there. */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-line bg-canvas px-4 py-3 md:hidden">
        <button
          onClick={toggleSidebar}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-card border border-line text-ink"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-display text-lg text-ink truncate">
          {activeWorkspace?.name || 'Booknight'}
        </span>
      </div>

      <main className="flex-1 min-w-0 px-4 pt-20 pb-8 md:px-10 md:py-8 max-w-full">
        {workspaces.length === 0 ? (
          <p className="text-ink/60">Create a workspace from the sidebar to get started.</p>
        ) : (
          <>
            <h1 className="hidden md:block font-display text-2xl text-ink mb-6">
              {activeWorkspace?.name || 'Loading…'}
            </h1>
            <CaptureBar />
            <SearchBar />

            {isSearchActive && searchError && (
              <p className="text-sm text-red-600 mb-4">{searchError}</p>
            )}

            {isSearchActive ? (
              searching && searchResults.length === 0 ? (
                <p className="text-ink/50 text-sm">Searching…</p>
              ) : searchResults.length === 0 ? (
                <p className="text-ink/50 text-sm">No matches for "{searchQuery}".</p>
              ) : (
                <BentoGrid bookmarks={searchResults} loading={false} />
              )
            ) : (
              <BentoGrid bookmarks={bookmarks} loading={loadingBookmarks} />
            )}
          </>
        )}
      </main>
      <EditBookmarkModal />
      <WorkspaceSettingsModal />
    </div>
  );
}