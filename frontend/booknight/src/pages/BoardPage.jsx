import { useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import Sidebar from '../components/layout/Sidebar';
import CaptureBar from '../components/bookmarks/CaptureBar';
import BentoGrid from '../components/bookmarks/BentoGrid';

export default function BoardPage() {
  const { workspaces, activeWorkspaceId, bookmarks, loadingBookmarks, loadWorkspaces } =
    useBoardStore();

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const activeWorkspace = workspaces.find((w) => w._id === activeWorkspaceId);

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
            <BentoGrid bookmarks={bookmarks} loading={loadingBookmarks} />
          </>
        )}
      </main>
    </div>
  );
}
