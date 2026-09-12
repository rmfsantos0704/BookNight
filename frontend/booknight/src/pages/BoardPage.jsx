import { useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import Sidebar from '../components/layout/Sidebar';
import CaptureBar from '../components/bookmarks/CaptureBar';
import SearchBar from '../components/bookmarks/SearchBar';
import BentoGrid from '../components/bookmarks/BentoGrid';
import EditBookmarkModal from '../components/bookmarks/EditBookmarkModal';

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

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <main className="flex-1 px-10 py-8 max-w-6xl">
        {workspaces.length === 0 ? (
          <p className="text-ink/60">Create a workspace from the sidebar to get started.</p>
        ) : (
          <>
            <h1 className="font-display text-2xl text-ink mb-6">
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
    </div>
  );
}