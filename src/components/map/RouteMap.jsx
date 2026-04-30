import { useEffect, useMemo, useRef } from 'react'
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { iconForStop, STOP_TYPE_LABEL } from './stopIcons.js'

// Convert ORS-style [[lng,lat],...] to Leaflet [[lat,lng],...]
function toLatLngs(geom) {
  if (!Array.isArray(geom)) return []
  return geom
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .map(([lng, lat]) => [lat, lng])
}

function fmtTime(iso, tz) {
  if (!iso) return ''
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

// Auto-fit map to all route points + stops on first render
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points || points.length === 0) return
    try {
      const bounds = L.latLngBounds(points)
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 })
      }
    } catch {
      /* ignore */
    }
  }, [map, points])
  return null
}

export default function RouteMap({ trip }) {
  const mapRef = useRef(null)

  const leg1 = useMemo(() => toLatLngs(trip?.route_geometry?.leg1), [trip])
  const leg2 = useMemo(() => toLatLngs(trip?.route_geometry?.leg2), [trip])

  const allPoints = useMemo(() => {
    const stopPoints = (trip?.stops || []).map((s) => [s.lat, s.lng])
    return [...leg1, ...leg2, ...stopPoints]
  }, [leg1, leg2, trip])

  if (!trip) return null

  return (
    <div className="absolute inset-0">
    <MapContainer
      ref={mapRef}
      center={[39.5, -98.5]}
      zoom={4}
      scrollWheelZoom={true}
      className="h-full w-full"
      preferCanvas={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route lines: leg1 (current → pickup) and leg2 (pickup → dropoff) */}
      {leg1.length > 1 && (
        <Polyline
          positions={leg1}
          pathOptions={{
            color: '#0c0a09',
            weight: 3,
            opacity: 0.85,
            dashArray: '6 4',
          }}
        />
      )}
      {leg2.length > 1 && (
        <Polyline
          positions={leg2}
          pathOptions={{
            color: '#d97706',
            weight: 4,
            opacity: 0.95,
          }}
        />
      )}

      {/* Stop markers */}
      {(trip.stops || []).map((stop) => (
        <Marker
          key={stop.sequence}
          position={[stop.lat, stop.lng]}
          icon={iconForStop(stop.stop_type)}
          zIndexOffset={
            stop.stop_type === 'start' || stop.stop_type === 'dropoff' ? 1000 : 0
          }
        >
          <Popup>
            <div className="font-mono">
              <div className="text-[9px] uppercase tracking-[0.2em] text-stone-500">
                Stop #{stop.sequence + 1} · {STOP_TYPE_LABEL[stop.stop_type] || stop.stop_type}
              </div>
              <div className="font-semibold text-sm mt-1 leading-snug">{stop.label}</div>
              <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                <span className="text-stone-500">Arrive</span>
                <span>{fmtTime(stop.arrival, trip.home_tz)}</span>
                <span className="text-stone-500">Depart</span>
                <span>{fmtTime(stop.departure, trip.home_tz)}</span>
                {stop.miles_at_stop > 0 && (
                  <>
                    <span className="text-stone-500">Mile</span>
                    <span>{Math.round(stop.miles_at_stop).toLocaleString()}</span>
                  </>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      <FitBounds points={allPoints} />
    </MapContainer>
    </div>
  )
}
