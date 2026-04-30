import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { planTrip } from '../../api/client.js'
import AddressField from './AddressField.jsx'
import ErrorBanner from '../shared/ErrorBanner.jsx'

function defaultStartDatetime() {
  // Default to tomorrow at 06:00 local time
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(6, 0, 0, 0)
  // Format for datetime-local input: YYYY-MM-DDTHH:MM
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TripForm() {
  const navigate = useNavigate()

  const [current, setCurrent] = useState(null)
  const [pickup, setPickup] = useState(null)
  const [dropoff, setDropoff] = useState(null)
  const [cycleHours, setCycleHours] = useState('0')
  const [startDt, setStartDt] = useState(defaultStartDatetime())

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = useMemo(() => {
    if (!current || !pickup || !dropoff) return false
    const ch = parseFloat(cycleHours)
    if (isNaN(ch) || ch < 0 || ch > 70) return false
    if (!startDt) return false
    return true
  }, [current, pickup, dropoff, cycleHours, startDt])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      // The user picked a wall-clock time intended for the driver's home
      // terminal time zone (which the backend derives from the current
      // location's longitude). Send it as a naive local string and let the
      // backend localize, rather than relying on the user's browser tz.
      // datetime-local already gives us "YYYY-MM-DDTHH:MM" — exactly right.
      const payload = {
        current,
        pickup,
        dropoff,
        cycle_hours_used: parseFloat(cycleHours),
        start_datetime_local: startDt,
      }
      const trip = await planTrip(payload)
      navigate(`/trips/${trip.id}`, { state: { trip } })
    } catch (err) {
      console.error(err)
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        (err?.response?.status === 400 ? 'Please check your inputs and try again.' : null) ||
        err?.message ||
        'Could not plan trip.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 w-full">
      {/* Headline */}
      <div className="mb-8 sm:mb-12">
        <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[color:var(--color-muted)] mb-3">
          New Trip · Form 395.8
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[0.95] tracking-tight">
          Plan a route
          <br />
          <span className="text-[color:var(--color-amber)]">stay compliant.</span>
        </h1>
        <p className="font-mono text-sm text-[color:var(--color-muted)] mt-4 max-w-xl leading-relaxed">
          Enter the three locations and your remaining cycle hours.
          We'll generate the route, insert required rest stops,
          and draw daily logs that satisfy 49&nbsp;CFR&nbsp;Part&nbsp;395.
        </p>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Locations card */}
        <section className="bg-white border border-[color:var(--color-ink)] shadow-[6px_6px_0_var(--color-ink)] p-5 sm:p-7">
          <SectionLabel num="01" title="Locations" />
          <div className="space-y-5 mt-5">
            <AddressField
              label="Current location"
              hint="Where the driver is right now"
              value={current}
              onChange={setCurrent}
              required
              badgeColor="#0c0a09"
              badgeLabel="A"
            />
            <AddressField
              label="Pickup location"
              hint="Where the load is picked up"
              value={pickup}
              onChange={setPickup}
              required
              badgeColor="#d97706"
              badgeLabel="P"
            />
            <AddressField
              label="Dropoff location"
              hint="Final destination"
              value={dropoff}
              onChange={setDropoff}
              required
              badgeColor="#047857"
              badgeLabel="D"
            />
          </div>
        </section>

        {/* Schedule card */}
        <section className="bg-white border border-[color:var(--color-ink)] shadow-[6px_6px_0_var(--color-ink)] p-5 sm:p-7">
          <SectionLabel num="02" title="Schedule & cycle status" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] mb-1.5 block">
                Trip start datetime
              </label>
              <input
                type="datetime-local"
                className="input-base"
                value={startDt}
                onChange={(e) => setStartDt(e.target.value)}
                required
              />
              <div className="font-mono text-[10px] text-[color:var(--color-muted)] mt-1.5 leading-snug">
                Use your local time. Time zone is inferred from the current location.
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)] mb-1.5 block">
                Current cycle hours used
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="70"
                  className="input-base pr-16"
                  value={cycleHours}
                  onChange={(e) => setCycleHours(e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[color:var(--color-muted)]">
                  / 70 hr
                </span>
              </div>
              <div className="font-mono text-[10px] text-[color:var(--color-muted)] mt-1.5 leading-snug">
                On-duty hours from the rolling 8-day window. Enter 0 if the driver
                just completed a 34-hour restart.
              </div>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
          <p className="font-mono text-[11px] text-[color:var(--color-muted)] leading-relaxed max-w-md">
            By submitting you confirm the driver is starting from a fully
            rested state (10+ hrs off duty). See README for full assumptions.
          </p>
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="font-mono text-sm font-semibold uppercase tracking-widest
                       bg-[color:var(--color-ink)] text-white px-7 py-3.5
                       border-2 border-[color:var(--color-ink)]
                       shadow-[4px_4px_0_var(--color-amber)]
                       hover:translate-x-[2px] hover:translate-y-[2px]
                       hover:shadow-[2px_2px_0_var(--color-amber)]
                       active:translate-x-[4px] active:translate-y-[4px]
                       active:shadow-[0_0_0_var(--color-amber)]
                       disabled:bg-[color:var(--color-muted)]
                       disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0
                       disabled:cursor-not-allowed
                       transition-all duration-100"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Planning...
              </span>
            ) : (
              <>Plan trip&nbsp;&rarr;</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function SectionLabel({ num, title }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-[color:var(--color-rule)] pb-3">
      <span className="font-mono text-xs text-[color:var(--color-amber)] font-semibold">
        {num}
      </span>
      <h2 className="font-display text-base font-semibold tracking-tight">
        {title}
      </h2>
    </div>
  )
}
