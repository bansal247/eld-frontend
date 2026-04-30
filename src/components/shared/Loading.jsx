export default function Loading({ label = 'Loading' }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="inline-flex gap-1 mb-4">
          <span className="w-2 h-2 bg-[color:var(--color-ink)] animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-[color:var(--color-amber)] animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-[color:var(--color-ink)] animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
          {label}
        </div>
      </div>
    </div>
  )
}
