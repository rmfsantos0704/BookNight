import BookmarkCard from './BookmarkCard';

export default function BentoGrid({ bookmarks, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-4 auto-rows-[10rem] gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-card border border-line bg-white/30 animate-pulse" />
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

  return (
    <div className="grid grid-cols-4 auto-rows-[10rem] gap-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark._id} bookmark={bookmark} />
      ))}
    </div>
  );
}
