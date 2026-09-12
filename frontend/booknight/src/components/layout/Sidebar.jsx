import { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace, createWorkspace } = useBoardStore();
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
      <div className="font-display text-xl text-canvas mb-8">Booknight</div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        <p className="text-xs uppercase tracking-wide text-line-dark mb-2 px-2">Workspaces</p>
        {workspaces.map((ws) => (
          <button
            key={ws._id}
            onClick={() => setActiveWorkspace(ws._id)}
            className={`w-full text-left px-3 py-2 rounded-card text-sm transition-colors ${
              ws._id === activeWorkspaceId
                ? 'bg-accent text-canvas'
                : 'text-line hover:bg-graphite-soft'
            }`}
          >
            {ws.name}
          </button>
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
        <p className="text-sm text-line truncate">{user?.displayName || user?.email}</p>
        <button onClick={logout} className="text-xs text-line-dark hover:text-line mt-1">
          Sign out
        </button>
      </div>
    </aside>
  );
}
