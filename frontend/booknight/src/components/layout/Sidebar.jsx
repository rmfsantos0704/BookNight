import { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, createWorkspace } = useBoardStore();
  const openWorkspaceSettings = useUIStore((s) => s.openWorkspaceSettings);
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

  return (
    <aside className="w-60 shrink-0 bg-graphite h-screen sticky top-0 flex flex-col px-4 py-6">
      <div className="mb-8">
        <span className="font-display text-2xl text-canvas">Booknight</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className="text-xs uppercase tracking-wide text-line-dark mb-2 px-2">Workspaces</p>
        {workspaces.map((ws) => (
          <div key={ws._id} className="group flex items-center gap-2">
            <button
              onClick={() => setActiveWorkspace(ws._id)}
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

      <div className="border-t border-line-dark pt-4 mt-4">
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
  );
}