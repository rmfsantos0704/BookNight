import { motion, AnimatePresence } from 'motion/react';
import { useBoardStore } from '../../store/useBoardStore';
import { useUIStore } from '../../store/useUIStore';

// Cards with a scraped image get a bigger tile - the bento rhythm comes
// from real content, not arbitrary placement.
function spanClasses(bookmark) {
  if (bookmark.imageUrl) return 'col-span-2 row-span-2';
  return 'col-span-1 row-span-1';
}

function faviconOrDot(bookmark) {
  if (bookmark.faviconUrl) {
    return <img src={bookmark.faviconUrl} alt="" className="w-4 h-4 rounded-sm" />;
  }
  return <span className="w-2 h-2 rounded-full bg-accent inline-block" />;
}

export default function BookmarkCard({ bookmark }) {
  const removeBookmark = useBoardStore((s) => s.removeBookmark);
  const openEditModal = useUIStore((s) => s.openEditModal);
  const isPending = bookmark.status === 'pending';
  const isFailed = bookmark.status === 'failed';

  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname.replace('www.', '');
  } catch {
    hostname = bookmark.url;
  }

  return (
    <div className={`${spanClasses(bookmark)} rounded-card border border-line bg-white/60 overflow-hidden flex flex-col`}>
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div
            key="pending"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 p-4 flex flex-col gap-2 animate-pulse"
          >
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
            className="flex-1 flex flex-col"
          >
            {bookmark.imageUrl && (
              <div className="h-32 bg-line overflow-hidden">
                <img
                  src={bookmark.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col gap-1.5">
              <p className="font-display text-base text-ink leading-snug line-clamp-2">
                {isFailed ? 'Could not load this link' : bookmark.title || hostname}
              </p>
              {!isFailed && bookmark.description && (
                <p className="text-sm text-ink/60 line-clamp-2">{bookmark.description}</p>
              )}
              {!isFailed && bookmark.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {bookmark.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-accent-soft text-accent rounded-full px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-2 flex items-center justify-between">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-ink/60 hover:text-accent"
                >
                  {faviconOrDot(bookmark)}
                  {hostname}
                </a>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEditModal(bookmark._id)}
                    className="text-xs text-ink/40 hover:text-accent"
                    aria-label="Edit bookmark"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeBookmark(bookmark._id)}
                    className="text-xs text-ink/40 hover:text-red-600"
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
    </div>
  );
}