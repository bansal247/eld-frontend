import LogGrid from './LogGrid.jsx'

function fmtMins(totalMins) {
  if (totalMins == null) return '—'
  const h = Math.floor(totalMins / 60)
  const m = Math.round(totalMins % 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function fmtDate(dateStr) {
  // dateStr is "YYYY-MM-DD" from the backend
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtTime(iso, tz) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return new Date(iso).toLocaleTimeString()
  }
}

const STATUS_LABELS = {
  off_duty: 'Off Duty',
  sleeper: 'Sleeper',
  driving: 'Driving',
  on_duty: 'On Duty',
}

export default function LogSheet({ log, trip, dayIndex }) {
  const totals = {
    off_duty: log.total_off_duty_mins,
    sleeper: log.total_sleeper_mins,
    driving: log.total_driving_mins,
    on_duty: log.total_on_duty_mins,
  }
  const sumTotal =
    (log.total_off_duty_mins || 0) +
    (log.total_sleeper_mins  || 0) +
    (log.total_driving_mins  || 0) +
    (log.total_on_duty_mins  || 0)

  // Show only meaningful remarks (skip pure off-duty padding)
  const remarks = (log.entries || []).filter((e) => {
    const lbl = (e.remark || '').toLowerCase()
    return e.status !== 'off_duty' || (lbl && !lbl.includes('off duty') && !lbl.includes('end of'))
  })

  return (
    <article className="bg-white border border-[color:var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] overflow-hidden">
      {/* Header strip */}
      <header className="border-b border-[color:var(--color-ink)] bg-[color:var(--color-paper)] px-4 sm:px-5 py-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Day {dayIndex + 1} · Driver's Daily Log
          </div>
          <div className="font-display text-lg sm:text-xl font-bold mt-0.5">
            {fmtDate(log.date)}
          </div>
        </div>
        <div className="font-mono text-[11px] flex flex-wrap gap-x-5 gap-y-1 text-[color:var(--color-muted)]">
          <span>
            <span className="text-[color:var(--color-muted)]">MILES:</span>{' '}
            <span className="text-[color:var(--color-ink)] font-semibold">
              {Math.round(log.total_miles_driving).toLocaleString()}
            </span>
          </span>
          <span>
            <span className="text-[color:var(--color-muted)]">TOTAL:</span>{' '}
            <span className={`font-semibold ${
              Math.abs(sumTotal - 1440) < 3
                ? 'text-emerald-700'
                : 'text-red-700'
            }`}>
              {fmtMins(sumTotal)} / 24h
            </span>
          </span>
          <span>
            <span className="text-[color:var(--color-muted)]">TZ:</span>{' '}
            <span className="text-[color:var(--color-ink)]">{trip.home_tz}</span>
          </span>
        </div>
      </header>

      {/* Grid */}
      <div className="px-2 sm:px-5 py-4">
        <LogGrid entries={log.entries} tz={trip.home_tz} totals={totals} />
      </div>

      {/* Remarks list */}
      <div className="border-t border-[color:var(--color-rule)] px-4 sm:px-5 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)] mb-2">
          Remarks
        </div>
        {remarks.length === 0 ? (
          <div className="font-mono text-xs text-[color:var(--color-muted)] italic">
            No status changes recorded for this day.
          </div>
        ) : (
          <ol className="space-y-1.5 text-xs font-mono">
            {remarks.map((r, i) => (
              <li key={i} className="grid grid-cols-[58px_72px_1fr] gap-2 items-start leading-snug">
                <span className="text-[color:var(--color-muted)] tabular-nums">
                  {fmtTime(r.start_time, trip.home_tz)}
                </span>
                <StatusBadge status={r.status} />
                <span className="text-[color:var(--color-ink)] line-clamp-2">
                  {r.remark || '—'}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  )
}

function StatusBadge({ status }) {
  const colorClass = {
    off_duty: 'bg-stone-200 text-stone-700',
    sleeper:  'bg-indigo-100 text-indigo-800',
    driving:  'bg-amber-100 text-amber-900',
    on_duty:  'bg-emerald-100 text-emerald-800',
  }[status] || 'bg-stone-200 text-stone-700'
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${colorClass}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
