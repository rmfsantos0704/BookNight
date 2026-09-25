import { useUIStore } from '../../store/useUIStore';
import { useBoardStore } from '../../store/useBoardStore';

export default function BookmarkDetailModal() {
  const viewingBookmarkId = useUIStore((s) => s.viewingBookmarkId);
  const closeViewModal = useUIStore((s) => s.closeViewModal);
  const openEditModal = useUIStore((s) => s.openEditModal);
  const bookmarks = useBoardStore((s) => s.bookmarks);
  const searchResults = useBoardStore((s) => s.searchResults);

  const bookmark =
    bookmarks.find((b) => b._id === viewingBookmarkId) ||
    searchResults.find((b) => b._id === viewingBookmarkId);

  if (!viewingBookmarkId || !bookmark) return null;

  let hostname = '';
  try {
    hostname = new URL(bookmark.url).hostname.replace('www.', '');
  } catch {
    hostname = bookmark.url;
  }

  const handleEditInstead = () => {
    closeViewModal();
    openEditModal(bookmark._id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={closeViewModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-bookmark-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card bg-canvas border border-line"
      >
        {bookmark.imageUrl && (
          <div className="h-48 w-full overflow-hidden border-b border-line bg-line">
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

        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50 mb-2">{hostname}</p>

          <h2 id="view-bookmark-title" className="font-display text-xl text-ink mb-3 leading-snug">
            {bookmark.title || hostname}
          </h2>

          {bookmark.description && (
            <p className="text-sm leading-relaxed text-ink/70 mb-4 whitespace-pre-wrap">
              {bookmark.description}
            </p>
          )}

          {bookmark.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-ink/40 break-all mb-6">{bookmark.url}</p>

          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-card bg-accent text-canvas text-sm font-medium px-4 py-2"
            >
              Open link ↗
            </a>
            <div className="flex items-center gap-4">
              <button onClick={handleEditInstead} className="text-sm text-ink/60 hover:text-accent">
                Edit
              </button>
              <button onClick={closeViewModal} className="text-sm text-ink/60 hover:text-ink">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}