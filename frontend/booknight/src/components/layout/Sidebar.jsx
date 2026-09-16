import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBoardStore } from '../../store/useBoardStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, createWorkspace } = useBoardStore();
  const openWorkspaceSettings = useUIStore((s) => s.openWorkspaceSettings);
  const sidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { user, logout } = useAuth();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createWorkspace(name.trim());
    setName('');
    setCreating(false);
  };

  const handleSelectWorkspace = (id) => {
    setActiveWorkspace(id);
    toggleSidebar(); // close the drawer after picking a workspace, mobile only
  };

  return (
    <>
      {/* Backdrop - mobile only, closes the drawer on tap */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-graphite flex flex-col px-4 py-6 transition-transform duration-200 md:sticky md:top-0 md:z-0 md:h-screen md:w-60 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="font-display text-2xl text-canvas">Booknight</span>
          <button
            onClick={toggleSidebar}
            aria-label="Close menu"
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-card text-line hover:bg-graphite-soft"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <p className="text-xs uppercase tracking-wide text-line-dark mb-2 px-2">Workspaces</p>
          {workspaces.map((ws) => (
            <div key={ws._id} className="group flex items-center gap-2">
              <button
                onClick={() => handleSelectWorkspace(ws._id)}
                className={`flex-1 min-w-0 text-left px-3 py-2 rounded-card text-sm truncate transition-colors ${
                  ws._id === activeWorkspaceId
                    ? 'bg-accent text-canvas'
                    : 'text-line hover:bg-graphite-soft'
                }`}
              >
                {ws.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openWorkspaceSettings(ws._id);
                }}
                aria-label={`Settings for ${ws.name}`}
                className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-card border transition-all duration-200 ${
                  ws._id === activeWorkspaceId
                    ? 'border-accent-soft bg-accent-soft text-graphite hover:bg-accent hover:text-canvas'
                    : 'border-line-dark bg-graphite-soft text-line hover:border-accent-soft hover:bg-accent hover:text-canvas'
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M19.4 15a7.6 7.6 0 0 0 .1-.9 7.6 7.6 0 0 0-.1-.9l2.1-1.6-2-3.5-2.5 1a7.7 7.7 0 0 0-1.5-.9l-.4-2.7H10.8l-.4 2.7a7.7 7.7 0 0 0-1.5.9l-2.5-1-2 3.5 2.1 1.6a7.6 7.6 0 0 0 0 1.8l-2.1 1.6 2 3.5 2.5-1a7.7 7.7 0 0 0 1.5.9l.4 2.7h4.4l.4-2.7a7.7 7.7 0 0 0 1.5-.9l2.5 1 2-3.5-2.1-1.6Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </button>
            </div>
          ))}

          {creating ? (
            <form onSubmit={handleCreate} className="px-2 pt-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => !name && setCreating(false)}
                placeholder="Workspace name"
                className="w-full rounded-card bg-graphite-soft border border-line-dark px-2 py-1.5 text-sm text-canvas placeholder:text-line-dark"
              />
            </form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left px-3 py-2 rounded-card text-sm text-line-dark hover:bg-graphite-soft hover:text-line"
            >
              + New workspace
            </button>
          )}
        </nav>

        <div className="border-t border-line-dark pt-4 mt-4 space-y-3">
          <Link
            to="/how-it-works"
            className="flex items-center gap-2 rounded-card border border-line-dark bg-graphite-soft px-3 py-2 text-sm text-line transition-all duration-200 hover:border-accent-soft hover:bg-accent hover:text-canvas"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
              ?
            </span>
            How Booknight works
          </Link>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 text-sm text-line truncate">{user?.displayName || user?.email}</p>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-card border border-line-dark bg-graphite-soft px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-line transition-all duration-200 hover:bg-accent hover:text-canvas hover:border-accent"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}