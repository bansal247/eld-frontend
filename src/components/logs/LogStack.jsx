import { useEffect, useRef, useState } from 'react'
import LogSheet from './LogSheet.jsx'

export default function LogStack({ trip }) {
  const dailyLogs = trip?.daily_logs || []
  const [activeIdx, setActiveIdx] = useState(0)
  const sheetRefs = useRef([])
  const tabsRef = useRef(null)
  const tabBtnRefs = useRef([])

  useEffect(() => {
    sheetRefs.current = sheetRefs.current.slice(0, dailyLogs.length)
    tabBtnRefs.current = tabBtnRefs.current.slice(0, dailyLogs.length)
  }, [dailyLogs.length])

  // IntersectionObserver: highlight the day whose sheet is most visible.
  useEffect(() => {
    if (dailyLogs.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        let best = null
        for (const e of entries) {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) {
            best = e
          }
        }
        if (best) {
          const idx = sheetRefs.current.findIndex((el) => el === best.target)
          if (idx >= 0) setActiveIdx(idx)
        }
      },
      {
        // Trigger zone shifted past the sticky tab bar (~52px tall) and the
        // bottom 40% so the "active" tab matches what's under the user's eye.
        rootMargin: '-60px 0px -40% 0px',
        threshold: [0, 0.3, 0.6, 1],
      },
    )
    sheetRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [dailyLogs.length])

  // Keep the active tab visible inside the horizontal tab bar
  useEffect(() => {
    const btn = tabBtnRefs.current[activeIdx]
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [activeIdx])

  const scrollTo = (i) => {
    setActiveIdx(i)
    const el = sheetRefs.current[i]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (dailyLogs.length === 0) {
    return (
      <div className="font-mono text-sm text-[color:var(--color-muted)] p-4">
        No daily logs were generated for this trip.
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Day picker tabs (horizontal scroll on mobile) */}
      <div className="sticky top-0 z-10 bg-[color:var(--color-paper)] -mx-4 sm:mx-0 px-4 sm:px-0 py-2 border-b border-[color:var(--color-rule)]">
        <div ref={tabsRef} className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {dailyLogs.map((log, i) => {
            const isActive = i === activeIdx
            return (
              <button
                key={log.date}
                ref={(el) => (tabBtnRefs.current[i] = el)}
                onClick={() => scrollTo(i)}
                className={`shrink-0 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider border transition-colors ${
                  isActive
                    ? 'bg-[color:var(--color-ink)] text-white border-[color:var(--color-ink)]'
                    : 'bg-white border-[color:var(--color-rule)] hover:border-[color:var(--color-ink)]'
                }`}
              >
                Day {i + 1}
                <span className="block text-[9px] tracking-[0.15em] mt-0.5 opacity-80">
                  {log.date.slice(5)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {dailyLogs.map((log, i) => (
        <div
          key={log.date}
          ref={(el) => (sheetRefs.current[i] = el)}
          /* scroll-margin-top so scrollIntoView clears the sticky tab bar */
          style={{ scrollMarginTop: '64px' }}
        >
          <LogSheet log={log} trip={trip} dayIndex={i} />
        </div>
      ))}
    </div>
  )
}
