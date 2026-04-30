import { useEffect, useRef, useState } from 'react'
import { geocode } from '../../api/client.js'
import { useDebounce } from '../../hooks/useDebounce.js'

/**
 * Debounced address autocomplete using the backend's /api/geocode/ proxy.
 *
 * Calls onChange with either:
 *   - { lat, lng, address } when a suggestion is picked, or
 *   - null when the user clears the field
 */
export default function AddressField({
  label,
  hint,
  value,            // current selected value: { lat, lng, address } | null
  onChange,         // (next) => void
  required = false,
  badgeColor = 'var(--color-amber)',
  badgeLabel = '',  // single character or short symbol shown next to the field
}) {
  const [query, setQuery] = useState(value?.address || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)

  const debouncedQuery = useDebounce(query, 350)

  // Keep input in sync if parent clears the value
  useEffect(() => {
    if (value === null) setQuery('')
    else if (value?.address && value.address !== query) setQuery(value.address)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Trigger search when debounced query changes
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!debouncedQuery || debouncedQuery.length < 3) {
        setSuggestions([])
        return
      }
      // If the current text equals the picked value's address, don't re-search
      if (value && value.address === debouncedQuery) {
        setSuggestions([])
        return
      }
      setLoading(true)
      try {
        const results = await geocode(debouncedQuery)
        if (!cancelled) {
          setSuggestions(results)
          setActiveIndex(-1)
        }
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, value])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePick = (s) => {
    onChange({ lat: s.lat, lng: s.lng, address: s.display_name })
    setQuery(s.display_name)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleKey = (e) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handlePick(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] flex items-center gap-2 mb-1.5">
        <span
          className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white"
          style={{ backgroundColor: badgeColor }}
          aria-hidden="true"
        >
          {badgeLabel}
        </span>
        {label}
        {required && <span className="text-[color:var(--color-amber)]">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          className="input-base"
          placeholder={hint || 'Start typing an address...'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
            // If user is editing, the selected value is no longer valid
            if (value && e.target.value !== value.address) {
              onChange(null)
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKey}
          autoComplete="off"
          required={required}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="inline-block w-3 h-3 border-2 border-[color:var(--color-ink)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {value && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="font-mono text-[10px] text-emerald-700">✓ pinned</span>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[color:var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lng}-${i}`}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left px-3 py-2 text-sm font-mono leading-tight border-b last:border-b-0 border-[color:var(--color-rule)] ${
                  i === activeIndex
                    ? 'bg-[color:var(--color-amber-soft)]'
                    : 'hover:bg-[color:var(--color-amber-soft)]'
                }`}
              >
                <div className="text-[color:var(--color-ink)] line-clamp-2">{s.display_name}</div>
                <div className="text-[10px] text-[color:var(--color-muted)] mt-0.5">
                  {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && !loading && debouncedQuery.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[color:var(--color-rule)] px-3 py-2 text-sm font-mono text-[color:var(--color-muted)]">
          No matches. Try a different spelling or include the state.
        </div>
      )}
    </div>
  )
}
