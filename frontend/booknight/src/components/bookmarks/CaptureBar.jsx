import { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';

export default function CaptureBar() {
  const addBookmark = useBoardStore((s) => s.addBookmark);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Holds the existing bookmark when the backend flags this URL as a
  // duplicate, so we can show a "you already saved this - save anyway?"
  // prompt instead of a dead-end error.
  const [duplicateOf, setDuplicateOf] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setDuplicateOf(null);
    setSubmitting(true);
    try {
      await addBookmark(url.trim());
      setUrl('');
    } catch (err) {
      if (err.duplicate) {
        setDuplicateOf(err.existingBookmark);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAnyway = async () => {
    setSubmitting(true);
    setError('');
    try {
      await addBookmark(url.trim(), [], true);
      setUrl('');
      setDuplicateOf(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex items-center gap-3 rounded-card border border-line bg-white/40 px-4 py-3">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setDuplicateOf(null);
          }}
          placeholder="Paste a link to save it here"
          className="flex-1 bg-transparent text-ink placeholder:text-ink/40 outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-card bg-accent text-canvas text-sm font-medium px-4 py-1.5 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {duplicateOf && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-card border border-accent-soft bg-accent-soft/40 px-4 py-2.5">
          <p className="text-sm text-ink">
            Already saved as <span className="font-medium">{duplicateOf.title || duplicateOf.url}</span>.
          </p>
          <button
            type="button"
            onClick={handleSaveAnyway}
            disabled={submitting}
            className="shrink-0 text-sm font-medium text-accent hover:underline disabled:opacity-60"
          >
            Save anyway
          </button>
        </div>
      )}
    </form>
  );
}