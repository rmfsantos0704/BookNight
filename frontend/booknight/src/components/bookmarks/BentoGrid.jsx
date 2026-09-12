import { useEffect, useState } from 'react';
import BookmarkCard from './BookmarkCard';

const PAGE_SIZE = 9;

export default function BentoGrid({ bookmarks, loading }) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [bookmarks]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-white/30 animate-pulse h-56" />
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line py-16 text-center">
        <p className="font-display text-lg text-ink mb-1">No links saved here yet</p>
        <p className="text-sm text-ink/60">Paste a link above to add your first bookmark.</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(bookmarks.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageBookmarks = bookmarks.slice(start, start + PAGE_SIZE);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {pageBookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark._id} bookmark={bookmark} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink/50">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          {hasPreviousPage && (
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              className="rounded-card border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-accent hover:text-canvas"
            >
              Previous
            </button>
          )}
          {hasNextPage && (
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              className="rounded-card bg-accent px-4 py-2 text-sm font-medium text-canvas transition hover:bg-graphite"
            >
              Next Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
