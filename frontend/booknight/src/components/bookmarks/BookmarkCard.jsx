import { motion, AnimatePresence } from 'motion/react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUIStore } from '../../store/useUIStore';

function faviconOrDot(bookmark) {
  if (bookmark.faviconUrl) {
    return <img src={bookmark.faviconUrl} alt="" className="h-4 w-4 rounded-sm object-cover" />;
  }
  return <span className="h-2 w-2 rounded-full bg-accent inline-block" />;
}

export default function BookmarkCard({ bookmark }) {
  const removeBookmark = useBoardStore((s) => s.removeBookmark);
  const openEditModal = useUIStore((s) => s.openEditModal);
  const openViewModal = useUIStore((s) => s.openViewModal);
  const isPending = bookmark.status === 'pending' || bookmark.status === 'processing';
  const isFailed = bookmark.status === 'failed';

  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname.replace('www.', '');
  } catch {
    hostname = bookmark.url;
  }

  return (
    <article className="flex min-h-[280px] flex-col overflow-hidden rounded-card border border-line bg-white/80 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div
            key="pending"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[280px] flex-col gap-2 p-4 animate-pulse"
          >
            <div className="h-36 w-full rounded-card bg-line" />
            <div className="h-3 w-2/3 bg-line rounded" />
            <div className="h-2 w-1/2 bg-line rounded" />
            <div className="flex-1" />
            <div className="h-2 w-1/3 bg-line rounded" />
          </motion.div>
        ) : (
          <motion.div
            key="loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col"
          >
            {bookmark.imageUrl && (
              <div className="h-36 overflow-hidden border-b border-line bg-line">
                <img
                  src={bookmark.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                {faviconOrDot(bookmark)}
                <span className="text-[11px] font-medium uppercase tracking-wide text-ink/50">
                  {hostname}
                </span>
              </div>

              {/* Clicking the title opens the full-detail view (untruncated
                  title/description) rather than navigating away - "Open
                  link" below is the actual navigation action. */}
              <button
                onClick={() => openViewModal(bookmark._id)}
                disabled={isFailed}
                className="text-left font-display text-base leading-snug text-ink transition hover:text-accent disabled:cursor-default disabled:hover:text-ink"
              >
                {isFailed ? 'Could not load this link' : bookmark.title || hostname}
              </button>

              {!isFailed && bookmark.description && (
                <p className="text-sm leading-5 text-ink/60 line-clamp-3">{bookmark.description}</p>
              )}

              {!isFailed && bookmark.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bookmark.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-ink/60 transition hover:text-accent"
                >
                  Open link
                </a>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(bookmark._id)}
                    className="text-xs text-ink/50 hover:text-accent"
                    aria-label="Edit bookmark"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeBookmark(bookmark._id)}
                    className="text-xs text-ink/50 hover:text-red-600"
                    aria-label="Remove bookmark"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}