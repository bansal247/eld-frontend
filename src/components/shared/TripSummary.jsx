/** Format helpers */
function fmtMins(totalMins) {
  if (totalMins == null) return '—'
  const h = Math.floor(totalMins / 60)
  const m = Math.round(totalMins % 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
function fmtMiles(m) {
  if (m == null) return '—'
  return `${Math.round(m).toLocaleString()} mi`
}
function fmtDateTime(iso, tz) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return new Date(iso).toLocaleString()
  }
}

export default function TripSummary({ trip }) {
  const stops = trip.stops || []
  const sleepers = stops.filter((s) => s.stop_type === 'sleeper_10hr').length
  const fuels = stops.filter((s) => s.stop_type === 'fuel').length
  const restarts = stops.filter((s) => s.stop_type === 'reset_34hr').length
  const breaks = stops.filter((s) => s.stop_type === 'rest_30min').length
  const cycleAfterMins = Math.round(
    parseFloat(trip.cycle_hours_used || 0) * 60 +
    (trip.daily_logs || []).reduce(
      (acc, d) => acc + (d.total_driving_mins || 0) + (d.total_on_duty_mins || 0),
      0,
    ),
  )

  return (
    <div className="bg-white border border-[color:var(--color-ink)] shadow-[4px_4px_0_var(--color-ink)] p-4 sm:p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)] mb-3">
        Trip Summary
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Distance" value={fmtMiles(trip.total_distance_mi)} />
        <Stat label="Drive time" value={fmtMins(trip.total_drive_mins)} />
        <Stat label="Total trip" value={fmtMins(trip.total_trip_mins)} />
        <Stat
          label="Cycle after"
          value={`${fmtMins(cycleAfterMins)} / 70h`}
          accent={cycleAfterMins > 65 * 60 ? 'amber' : 'default'}
        />
      </div>

      <div className="border-t border-[color:var(--color-rule)] mt-4 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-[color:var(--color-muted)]">
        <span>{trip.daily_logs?.length || 0} daily logs</span>
        <span>{sleepers} sleeper reset{sleepers !== 1 && 's'}</span>
        <span>{fuels} fuel stop{fuels !== 1 && 's'}</span>
        <span>{breaks} 30-min break{breaks !== 1 && 's'}</span>
        {restarts > 0 && (
          <span className="col-span-2 sm:col-span-4 text-[color:var(--color-amber)]">
            {restarts} × 34-hour restart required
          </span>
        )}
      </div>

      <div className="border-t border-[color:var(--color-rule)] mt-3 pt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px] font-mono text-[color:var(--color-muted)]">
        <span>Start: <span className="text-[color:var(--color-ink)]">{fmtDateTime(trip.start_datetime, trip.home_tz)}</span></span>
        <span>End: <span className="text-[color:var(--color-ink)]">{fmtDateTime(trip.end_datetime, trip.home_tz)}</span></span>
        <span>Time zone: <span className="text-[color:var(--color-ink)]">{trip.home_tz}</span></span>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  const accentClass =
    accent === 'amber' ? 'text-[color:var(--color-amber)]' : 'text-[color:var(--color-ink)]'
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className={`font-display text-xl sm:text-2xl font-bold mt-0.5 tabular-nums ${accentClass}`}>
        {value}
      </div>
    </div>
  )
}
