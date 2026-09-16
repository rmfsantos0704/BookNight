import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useBoardStore } from '../../store/useBoardStore';

export default function EditBookmarkModal() {
  const editingBookmarkId = useUIStore((s) => s.editingBookmarkId);
  const closeEditModal = useUIStore((s) => s.closeEditModal);
  const editBookmark = useBoardStore((s) => s.editBookmark);
  const bookmarks = useBoardStore((s) => s.bookmarks);
  const searchResults = useBoardStore((s) => s.searchResults);

  const bookmark =
    bookmarks.find((b) => b._id === editingBookmarkId) ||
    searchResults.find((b) => b._id === editingBookmarkId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset the form whenever a different bookmark is opened for editing.
  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || '');
      setDescription(bookmark.description || '');
      setTagsInput((bookmark.tags || []).join(', '));
      setError('');
    }
  }, [bookmark?._id]);

  if (!editingBookmarkId || !bookmark) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await editBookmark(bookmark._id, { title: title.trim(), description: description.trim(), tags });
      closeEditModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={closeEditModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-bookmark-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-card bg-canvas border border-line p-6"
      >
        <h2 id="edit-bookmark-title" className="font-display text-xl text-ink mb-1">
          Edit bookmark
        </h2>
        <p className="text-sm text-ink/50 mb-5 truncate">{bookmark.url}</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm text-ink/70 mb-1">Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-card border border-line bg-white/60 px-3 py-2 text-ink outline-none focus-visible:border-accent"
              placeholder="Bookmark title"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm text-ink/70 mb-1">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-card border border-line bg-white/60 px-3 py-2 text-ink outline-none focus-visible:border-accent resize-none"
              placeholder="A short note about this link"
            />
          </div>

          <div>
            <label htmlFor="edit-tags" className="block text-sm text-ink/70 mb-1">Tags</label>
            <input
              id="edit-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-card border border-line bg-white/60 px-3 py-2 text-ink outline-none focus-visible:border-accent"
              placeholder="comma, separated, tags"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={closeEditModal}
              className="text-sm text-ink/60 hover:text-ink px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-card bg-accent text-canvas text-sm font-medium px-4 py-1.5 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}