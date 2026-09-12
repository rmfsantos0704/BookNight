import { useEffect, useRef } from 'react';
import { useBoardStore } from '../../store/useBoardStore';

const DEBOUNCE_MS = 300;

export default function SearchBar() {
  const searchQuery = useBoardStore((s) => s.searchQuery);
  const setSearchQuery = useBoardStore((s) => s.setSearchQuery);
  const runSearch = useBoardStore((s) => s.runSearch);
  const clearSearch = useBoardStore((s) => s.clearSearch);
  const searching = useBoardStore((s) => s.searching);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <div className="relative mb-4 w-full max-w-xl">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search this workspace…"
        className="w-full rounded-card border border-line bg-white/40 px-4 py-2.5 text-ink placeholder:text-ink/40 outline-none focus-visible:border-accent"
      />
      {searching && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink/40">
          Searching…
        </span>
      )}
    </div>
  );
}