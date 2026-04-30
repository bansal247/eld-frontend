import L from 'leaflet'

// Color and label per stop type. Matches the design system in index.css.
const STOP_DEFS = {
  start:        { color: '#0c0a09', label: 'A',  ring: '#0c0a09' },
  pickup:       { color: '#d97706', label: 'P',  ring: '#0c0a09' },
  dropoff:      { color: '#047857', label: 'D',  ring: '#0c0a09' },
  fuel:         { color: '#0ea5e9', label: 'F',  ring: '#0c0a09' },
  rest_30min:   { color: '#a8a29e', label: '½',  ring: '#0c0a09' },
  sleeper_10hr: { color: '#4f46e5', label: 'Z',  ring: '#0c0a09' },
  reset_34hr:   { color: '#7c3aed', label: '34', ring: '#0c0a09' },
}

const DEFAULT = { color: '#a8a29e', label: '?', ring: '#0c0a09' }

export function iconForStop(stopType) {
  const def = STOP_DEFS[stopType] || DEFAULT
  // Square marker, rotated 45deg for a diamond appearance — matches the
  // header logo motif. Uses divIcon so we can style with HTML/CSS.
  const html = `
    <div style="
      width: 28px; height: 28px;
      background: ${def.color};
      border: 2px solid ${def.ring};
      box-shadow: 2px 2px 0 ${def.ring};
      transform: rotate(45deg);
      display: flex; align-items: center; justify-content: center;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-weight: 700; font-size: 11px; color: white;
    ">
      <span style="transform: rotate(-45deg); line-height: 1;">${def.label}</span>
    </div>
  `
  return L.divIcon({
    html,
    className: 'eld-stop-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  })
}

export const STOP_TYPE_LABEL = {
  start: 'Trip Start',
  pickup: 'Pickup',
  dropoff: 'Dropoff',
  fuel: 'Fuel Stop',
  rest_30min: '30-Min Break',
  sleeper_10hr: '10-Hr Sleeper Reset',
  reset_34hr: '34-Hr Restart',
}
