/**
 * LogGrid — renders one day's duty status timeline as an SVG.
 *
 * The grid is the regulatory FMCSA log format:
 *   - 4 rows (Off Duty, Sleeper Berth, Driving, On Duty Not Driving)
 *   - 24 hour columns subdivided into 4 quarter-hours each (96 cells)
 *
 * Wraps in a horizontally-scrollable container with min-w-[800px]
 * for readable rendering on small phones.
 */

const ROWS = ['off_duty', 'sleeper', 'driving', 'on_duty']
const ROW_LABELS = {
  off_duty: 'Off Duty',
  sleeper: 'Sleeper Berth',
  driving: 'Driving',
  on_duty: 'On Duty\n(Not Driving)',
}
const ROW_COLORS = {
  off_duty: 'var(--color-status-off)',
  sleeper:  'var(--color-status-sleeper)',
  driving:  'var(--color-status-driving)',
  on_duty:  'var(--color-status-onduty)',
}

// SVG geometry
const LEFT_LABEL_W = 110     // left column width for "Off Duty" etc.
const RIGHT_LABEL_W = 60     // right column width for hour totals
const HOUR_LABEL_H = 22
const ROW_H = 36
const GRID_H = ROW_H * 4
const GRID_W = 720           // 24 hours × 30 px/hr
const PX_PER_HOUR = GRID_W / 24
const SVG_W = LEFT_LABEL_W + GRID_W + RIGHT_LABEL_W
const SVG_H = HOUR_LABEL_H + GRID_H + 4

function minutesIntoDayLocal(iso, tz) {
  // Returns minutes from midnight in the home tz [0..1440]
  const d = new Date(iso)
  // Use Intl to format in the target tz, then parse hour/minute
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts = fmt.formatToParts(d)
  let h = 0, m = 0
  for (const p of parts) {
    if (p.type === 'hour') h = parseInt(p.value, 10)
    if (p.type === 'minute') m = parseInt(p.value, 10)
  }
  if (h === 24) h = 0
  return h * 60 + m
}

function minutesAtEndLocal(startIso, endIso, tz) {
  // If end is on a later calendar day in tz, treat as 1440 (end of day)
  const startDay = new Date(startIso).toLocaleDateString('en-US', { timeZone: tz })
  const endDay = new Date(endIso).toLocaleDateString('en-US', { timeZone: tz })
  if (startDay !== endDay) return 1440
  return minutesIntoDayLocal(endIso, tz)
}

function xForMinutes(min) {
  return LEFT_LABEL_W + (min / 60) * PX_PER_HOUR
}

function yForRow(rowKey) {
  const idx = ROWS.indexOf(rowKey)
  return HOUR_LABEL_H + idx * ROW_H + ROW_H / 2
}

export default function LogGrid({ entries, tz, totals }) {
  // Sort and clip entries to today's window
  const segments = (entries || [])
    .map((e) => {
      const startMin = minutesIntoDayLocal(e.start_time, tz)
      const endMin = minutesAtEndLocal(e.start_time, e.end_time, tz)
      return { ...e, startMin, endMin }
    })
    // If start is on another day, clip to 0; if end is on another day, clip to 1440
    .map((e) => ({
      ...e,
      startMin: Math.max(0, e.startMin),
      endMin: Math.min(1440, e.endMin),
    }))
    .filter((e) => e.endMin > e.startMin)
    .sort((a, b) => a.startMin - b.startMin)

  // Build the polyline: horizontal line on each segment's row, vertical line at transitions
  const linePoints = []
  segments.forEach((seg, i) => {
    const y = yForRow(seg.status)
    const x1 = xForMinutes(seg.startMin)
    const x2 = xForMinutes(seg.endMin)
    if (i === 0) linePoints.push(`M ${x1} ${y}`)
    linePoints.push(`L ${x2} ${y}`)
    const next = segments[i + 1]
    if (next) {
      const yNext = yForRow(next.status)
      const xStart = xForMinutes(next.startMin)
      // Vertical transition only if the next segment starts where this one ends
      if (Math.abs(xStart - x2) < 0.5) {
        linePoints.push(`L ${x2} ${yNext}`)
      } else {
        // Gap between segments: jump
        linePoints.push(`M ${xStart} ${yNext}`)
      }
    }
  })

  return (
    <div className="overflow-x-auto scrollbar-thin -mx-4 sm:mx-0">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W}
        height={SVG_H}
        xmlns="http://www.w3.org/2000/svg"
        className="block min-w-[760px] sm:min-w-0 w-full max-w-full px-4 sm:px-0"
        role="img"
        aria-label="Driver duty status timeline"
      >
        <GridBackground />
        {/* Status line */}
        {linePoints.length > 0 && (
          <path
            d={linePoints.join(' ')}
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="2"
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
        )}
        {/* Right side totals */}
        {totals && <Totals totals={totals} />}
      </svg>
    </div>
  )
}

function GridBackground() {
  // Hour labels (top)
  const hourLabels = []
  for (let h = 0; h <= 24; h++) {
    const x = xForMinutes(h * 60)
    let label
    if (h === 0 || h === 24) label = 'M'
    else if (h === 12) label = 'N'
    else label = String(h % 12 === 0 ? 12 : h <= 12 ? h : h - 12)
    hourLabels.push(
      <text
        key={`hl-${h}`}
        x={x}
        y={HOUR_LABEL_H - 6}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fill="var(--color-muted)"
      >
        {label}
      </text>,
    )
  }

  // Hour separators (vertical lines, every 1 hour)
  const hourLines = []
  for (let h = 0; h <= 24; h++) {
    const x = xForMinutes(h * 60)
    hourLines.push(
      <line
        key={`hour-${h}`}
        x1={x}
        x2={x}
        y1={HOUR_LABEL_H}
        y2={HOUR_LABEL_H + GRID_H}
        stroke="var(--color-ink)"
        strokeWidth={h % 6 === 0 ? 1.2 : 0.6}
        opacity={h % 6 === 0 ? 1 : 0.6}
      />,
    )
  }

  // Quarter-hour ticks (small)
  const tickLines = []
  for (let q = 0; q < 96; q++) {
    if (q % 4 === 0) continue
    const x = xForMinutes(q * 15)
    // Only at top of each row
    for (let r = 0; r < 4; r++) {
      const yTop = HOUR_LABEL_H + r * ROW_H
      tickLines.push(
        <line
          key={`tick-${q}-${r}`}
          x1={x}
          x2={x}
          y1={yTop}
          y2={yTop + 4}
          stroke="var(--color-rule)"
          strokeWidth={0.5}
        />,
      )
    }
  }

  // Row separators and labels
  const rowLines = []
  const rowLabels = []
  ROWS.forEach((row, idx) => {
    const yTop = HOUR_LABEL_H + idx * ROW_H
    rowLines.push(
      <line
        key={`row-${idx}`}
        x1={LEFT_LABEL_W}
        x2={LEFT_LABEL_W + GRID_W}
        y1={yTop}
        y2={yTop}
        stroke="var(--color-ink)"
        strokeWidth={0.8}
      />,
    )
    // Row label text on left
    const lines = ROW_LABELS[row].split('\n')
    lines.forEach((line, j) => {
      rowLabels.push(
        <text
          key={`rl-${idx}-${j}`}
          x={LEFT_LABEL_W - 8}
          y={yTop + ROW_H / 2 + (j - (lines.length - 1) / 2) * 11}
          textAnchor="end"
          fontSize="10"
          fontFamily="var(--font-sans)"
          fill="var(--color-ink)"
          dominantBaseline="middle"
        >
          {line}
        </text>,
      )
    })
    // Color pip at right edge of label
    rowLabels.push(
      <rect
        key={`pip-${idx}`}
        x={LEFT_LABEL_W - 5}
        y={yTop + ROW_H / 2 - 4}
        width={3}
        height={8}
        fill={ROW_COLORS[row]}
      />,
    )
  })
  // Bottom border
  rowLines.push(
    <line
      key="row-bottom"
      x1={LEFT_LABEL_W}
      x2={LEFT_LABEL_W + GRID_W}
      y1={HOUR_LABEL_H + GRID_H}
      y2={HOUR_LABEL_H + GRID_H}
      stroke="var(--color-ink)"
      strokeWidth={0.8}
    />,
  )

  return (
    <g>
      {hourLabels}
      {tickLines}
      {hourLines}
      {rowLines}
      {rowLabels}
      {/* "Total Hours" header on right */}
      <text
        x={LEFT_LABEL_W + GRID_W + RIGHT_LABEL_W / 2}
        y={HOUR_LABEL_H - 6}
        textAnchor="middle"
        fontSize="8"
        fontFamily="var(--font-mono)"
        fill="var(--color-muted)"
        style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
      >
        TOTAL
      </text>
    </g>
  )
}

function fmtMins(totalMins) {
  const mins = Math.round(totalMins || 0)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function Totals({ totals }) {
  return ROWS.map((row, idx) => {
    const yCenter = HOUR_LABEL_H + idx * ROW_H + ROW_H / 2
    return (
      <text
        key={`total-${row}`}
        x={LEFT_LABEL_W + GRID_W + RIGHT_LABEL_W / 2}
        y={yCenter}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fontWeight="600"
        fill="var(--color-ink)"
        dominantBaseline="middle"
      >
        {fmtMins(totals[row])}
      </text>
    )
  })
}
