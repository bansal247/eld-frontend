import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getTrip } from '../api/client.js'
import RouteMap from '../components/map/RouteMap.jsx'
import LogStack from '../components/logs/LogStack.jsx'
import TripSummary from '../components/shared/TripSummary.jsx'
import Loading from '../components/shared/Loading.jsx'
import ErrorBanner from '../components/shared/ErrorBanner.jsx'

/**
 * Layout:
 *   Mobile (< lg):   Stack vertical → summary → map (50vh) → logs
 *   Desktop (>= lg): Two columns — left half map, right half scrollable logs
 *
 * The page is loaded with state from the form submission OR fetched fresh
 * by id when navigated to directly.
 */
export default function TripResultPage() {
  const { id } = useParams()
  const location = useLocation()
  const initialTrip = location.state?.trip
  const [trip, setTrip] = useState(initialTrip || null)
  const [loading, setLoading] = useState(!initialTrip)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (initialTrip && String(initialTrip.id) === id) return
    setLoading(true)
    setError(null)
    getTrip(id)
      .then((data) => setTrip(data))
      .catch((err) => {
        console.error(err)
        setError(
          err?.response?.status === 404
            ? `Trip ${id} not found.`
            : err?.message || 'Could not load trip.',
        )
      })
      .finally(() => setLoading(false))
  }, [id, initialTrip])

  if (loading) return <Loading label="Loading trip" />
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
        <ErrorBanner message={error} />
        <Link
          to="/"
          className="inline-block font-mono text-sm underline underline-offset-4 decoration-[color:var(--color-amber)] decoration-2"
        >
          ← Back to planner
        </Link>
      </div>
    )
  }
  if (!trip) return null

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Map pane */}
      <section className="lg:w-1/2 border-b border-[color:var(--color-ink)] lg:border-b-0 lg:border-r">
        <div className="px-4 sm:px-5 py-2 bg-white border-b border-[color:var(--color-rule)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Route Map
          </div>
        </div>
        <div className="relative h-[55vh] lg:h-[60vh] bg-stone-200">
          <RouteMap trip={trip} />
        </div>
        <MapInfo trip={trip} />
      </section>

      {/* Logs pane */}
      <section className="lg:w-1/2 bg-[color:var(--color-paper)]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Trip #{trip.id}
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight">
                {trip.current_address.split(',')[0]} →{' '}
                <span className="text-[color:var(--color-amber)]">
                  {trip.dropoff_address.split(',')[0]}
                </span>
              </h2>
            </div>
            <Link
              to="/"
              className="font-mono text-[11px] uppercase tracking-wider border border-[color:var(--color-ink)] px-3 py-1.5 hover:bg-[color:var(--color-ink)] hover:text-white transition-colors"
            >
              + New Trip
            </Link>
          </div>

          <TripSummary trip={trip} />
          <LogStack trip={trip} />
        </div>
      </section>
    </div>
  )
}

const MARKER_LEGEND = [
  { label: 'A',  color: '#0c0a09', text: 'Start' },
  { label: 'P',  color: '#d97706', text: 'Pickup' },
  { label: 'D',  color: '#047857', text: 'Dropoff' },
  { label: 'F',  color: '#0ea5e9', text: 'Fuel' },
  { label: '½',  color: '#a8a29e', text: '30-min break' },
  { label: 'Z',  color: '#4f46e5', text: '10-hr reset' },
  { label: '34', color: '#7c3aed', text: '34-hr restart' },
]

function DiamondSwatch({ label, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        background: color,
        border: '1.5px solid #0c0a09',
        boxShadow: '1px 1px 0 #0c0a09',
        transform: 'rotate(45deg)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          transform: 'rotate(-45deg)',
          color: 'white',
          fontSize: 7,
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </span>
  )
}

function MapInfo({ trip }) {
  const geo = trip?.route_geometry || {}
  const leg1Mi = geo.leg1_mi
  const leg2Mi = geo.leg2_mi
  return (
    <div className="bg-white border-t border-[color:var(--color-rule)] px-4 sm:px-5 py-2.5 space-y-2.5">
      {/* Route lines + avg speed */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
            <span
              className="inline-block w-5 h-[3px]"
              style={{ backgroundColor: 'transparent', borderTop: '2px dashed #0c0a09' }}
            />
            <span className="uppercase tracking-wider text-[color:var(--color-muted)]">Leg 1</span>
            {leg1Mi != null && (
              <span className="text-[color:var(--color-ink)] font-semibold tabular-nums">
                {Math.round(leg1Mi).toLocaleString()} mi
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
            <span className="inline-block w-5 h-[3px]" style={{ backgroundColor: '#d97706' }} />
            <span className="uppercase tracking-wider text-[color:var(--color-muted)]">Leg 2</span>
            {leg2Mi != null && (
              <span className="text-[color:var(--color-ink)] font-semibold tabular-nums">
                {Math.round(leg2Mi).toLocaleString()} mi
              </span>
            )}
          </span>
        </div>
        <span className="font-mono text-[10px] text-[color:var(--color-muted)]">
          Avg speed:{' '}
          <span className="text-[color:var(--color-ink)] font-semibold">60 mph</span>{' '}
          (assumed)
        </span>
      </div>

      {/* Stop marker legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {MARKER_LEGEND.map(({ label, color, text }) => (
          <span key={label} className="inline-flex items-center gap-1.5 font-mono text-[10px]">
            <DiamondSwatch label={label} color={color} />
            <span className="uppercase tracking-wider text-[color:var(--color-muted)]">{text}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
