export default function BrandLogo({ className = '', imageClassName = '', textClassName = 'text-canvas' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <img
        src="/Logo.png"
        alt="Booknight logo"
        className={`h-14 w-14 rounded-full object-cover border border-line-dark bg-graphite-soft ${imageClassName}`.trim()}
      />
      <span className={`font-display text-3xl ${textClassName}`.trim()}>Booknight</span>
    </div>
  );
}
