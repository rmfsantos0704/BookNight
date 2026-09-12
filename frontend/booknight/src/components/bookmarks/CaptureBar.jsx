import { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';

export default function CaptureBar() {
  const addBookmark = useBoardStore((s) => s.addBookmark);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await addBookmark(url.trim());
      setUrl('');
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
          onChange={(e) => setUrl(e.target.value)}
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
    </form>
  );
}
