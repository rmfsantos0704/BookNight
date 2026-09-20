import { useState, useEffect, useRef } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUIStore } from '../../store/useUIStore';
import { api } from '../../lib/api';

const DEBOUNCE_MS = 300;

export default function GlobalSearch() {
  const workspaces = useBoardStore((s) => s.workspaces);
  const setActiveWorkspace = useBoardStore((s) => s.setActiveWorkspace);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [linkResults, setLinkResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const trimmed = query.trim();
  const workspaceMatches = trimmed
    ? workspaces.filter((w) => w.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 5)
    : [];

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!trimmed) {
      setLinkResults([]);
      setSearchError('');
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const data = await api.searchAllWorkspaces(trimmed);
        setLinkResults(data.bookmarks);
      } catch (err) {
        setSearchError(err.message);
        setLinkResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed]);

  // Close the results dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const closeAfterSelect = () => {
    setQuery('');
    setIsFocused(false);
    if (mobileSidebarOpen) toggleSidebar(); // close the mobile drawer too
  };

  const handleSelectWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    closeAfterSelect();
  };

  const handleSelectLink = (bookmark) => {
    setActiveWorkspace(bookmark.workspaceId);
    closeAfterSelect();
  };

  const workspaceNameFor = (workspaceId) =>
    workspaces.find((w) => w._id === workspaceId)?.name || 'Unknown workspace';

  const showDropdown = isFocused && trimmed.length > 0;
  const hasAnyResults = workspaceMatches.length > 0 || linkResults.length > 0;

  return (
    <div ref={containerRef} className="relative mb-4">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-line-dark"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search workspaces or links…"
          className="w-full rounded-card bg-graphite-soft border border-line-dark pl-8 pr-3 py-2 text-sm text-canvas placeholder:text-line-dark outline-none focus-visible:border-accent"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-card border border-line-dark bg-graphite-soft shadow-lg">
          {workspaceMatches.length > 0 && (
            <div className="p-2">
              <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-line-dark">Workspaces</p>
              {workspaceMatches.map((ws) => (
                <button
                  key={ws._id}
                  onClick={() => handleSelectWorkspace(ws._id)}
                  className="block w-full rounded-card px-2 py-1.5 text-left text-sm text-line hover:bg-graphite hover:text-canvas"
                >
                  {ws.name}
                </button>
              ))}
            </div>
          )}

          {(searching || searchError || linkResults.length > 0) && (
            <div className="p-2 border-t border-line-dark/50">
              <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-line-dark">Links</p>
              {searching && <p className="px-2 py-1.5 text-sm text-line-dark">Searching…</p>}
              {!searching && searchError && (
                <p className="px-2 py-1.5 text-sm text-red-400">{searchError}</p>
              )}
              {!searching &&
                !searchError &&
                linkResults.map((bookmark) => (
                  <button
                    key={bookmark._id}
                    onClick={() => handleSelectLink(bookmark)}
                    className="block w-full rounded-card px-2 py-1.5 text-left hover:bg-graphite"
                  >
                    <p className="text-sm text-line truncate">{bookmark.title || bookmark.url}</p>
                    <p className="text-xs text-line-dark truncate">
                      {workspaceNameFor(bookmark.workspaceId)}
                    </p>
                  </button>
                ))}
            </div>
          )}

          {!hasAnyResults && !searching && !searchError && (
            <p className="px-4 py-3 text-sm text-line-dark">No matches for "{trimmed}".</p>
          )}
        </div>
      )}
    </div>
  );
}