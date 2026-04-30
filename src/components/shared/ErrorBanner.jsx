export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="mb-4 border-2 border-[color:var(--color-ink)] bg-[#fef2f2] shadow-[4px_4px_0_var(--color-ink)] flex items-start gap-3 p-3 sm:p-4"
    >
      <span className="font-mono text-xs font-bold bg-[color:var(--color-ink)] text-white px-1.5 py-0.5 mt-0.5">
        ERR
      </span>
      <p className="font-mono text-sm flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="font-mono text-xs hover:underline"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  )
}
