# ELD Trip Planner — Frontend

React single-page app for planning truck trips and viewing the generated
route map and ELD-compliant daily log sheets.

Mobile-responsive, built with Vite, Tailwind CSS v4, and react-leaflet v5.

## Tech stack

- **Vite 6** + **React 19**
- **Tailwind CSS v4** via the official `@tailwindcss/vite` plugin
  (zero-config — design tokens declared in `index.css` via `@theme`)
- **react-leaflet 5** + **Leaflet 1.9** for the route map
- **react-router-dom 7** for routing
- **axios** for HTTP
- **IBM Plex Sans** + **IBM Plex Mono** (Google Fonts) — chosen for an
  industrial / technical aesthetic appropriate for trucking dispatch UIs

## Setup

```bash
cd frontend
npm install
cp .env.example .env       # leave VITE_API_BASE_URL blank for dev
npm run dev
```

The app runs on http://localhost:5173. Vite proxies `/api/*` to
http://localhost:8000 (the Django backend) so the frontend can use
relative URLs and CORS isn't an issue in development.

## Routes

- `/` — Trip planning form
- `/trips/:id` — Map + daily logs for a planned trip

## Mobile responsiveness

The app is designed mobile-first. Layout adapts at the `lg:` breakpoint
(1024 px):

- **Form page**: single column on mobile, with form sections stacked
  vertically. The two schedule fields (start time, cycle hours) form a
  2-column grid above the `sm:` breakpoint.
- **Trip result page**: map and logs stack vertically on mobile (map at
  ~55vh, logs scrollable below). Side-by-side at `lg:` — map on the left
  half (full height), logs scrollable on the right.
- **Log grid SVG**: scrolls horizontally on screens under ~760 px wide
  (24 hours × 30 px = 720 px grid + labels). Fills available width on
  larger screens via `viewBox` + `preserveAspectRatio`.
- **Address autocomplete**: dropdown spans the full input width and is
  capped at 16 rem max-height with internal scrolling.
- **Day picker**: horizontal scroll bar of day tabs above the log stack,
  sticky at the top of the logs column.

## Components

- **`TripForm`** — controlled form, three address fields + cycle hours +
  start datetime. Submit triggers `POST /api/trips/plan/` and navigates
  to `/trips/:id`.
- **`AddressField`** — debounced autocomplete via `/api/geocode/`. Uses
  `useDebounce` (350 ms) to avoid hammering Nominatim. Keyboard navigation
  with arrow keys + Enter to select.
- **`RouteMap`** — Leaflet map with route polyline (leg 1 dashed black,
  leg 2 solid amber) and custom diamond stop markers per stop type.
  Auto-fits bounds on load.
- **`LogStack`** — scrollable list of `LogSheet`s with a sticky day-picker
  tab bar at the top.
- **`LogSheet`** — one day's complete log: header (date, miles, totals
  check), grid (SVG), and remarks list.
- **`LogGrid`** — the 4×96 cell SVG grid drawing the duty status timeline.
  Renders the regulatory FMCSA log format with row labels, hour labels,
  quarter-hour ticks, and per-status total in the right gutter.
- **`TripSummary`** — high-level stats card (distance, drive time, total
  trip duration, post-trip cycle hours) + stop counts.

## Design tokens

Defined in `src/index.css` via Tailwind v4's `@theme` directive — these
are auto-mapped to utility classes:

```css
@theme {
  --color-ink: #0c0a09;          /* near-black */
  --color-paper: #fafaf9;        /* warm off-white */
  --color-amber: #d97706;        /* DOT-yellow primary */
  --color-status-driving: #d97706;
  --color-status-sleeper: #4f46e5;
  --color-status-onduty: #047857;
  --color-status-off: #a8a29e;
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

The visual language is **industrial / dispatch-board**: hard-edged borders,
2 px black strokes with offset shadows (`shadow-[6px_6px_0_var(--color-ink)]`),
mono numerals everywhere, amber accents for driving state, indigo for sleeper.

## Assumptions reflected in the UI

- The form treats each trip as a standalone shift starting from a rested
  state. There is no UI for mid-shift planning.
- `cycle_hours_used` is a manual numeric input (0–70), per assignment.
- The home time zone is inferred server-side from the current location and
  used to render all log timestamps.
- Address fields use Nominatim via the backend's geocoding proxy. Some
  rural addresses may not autocomplete cleanly — typing a city + state
  usually produces a usable match.

## Out of scope

- User authentication and per-driver history
- Saving favorite addresses
- Editing or re-planning an existing trip (each submission creates a new
  trip; users can navigate back to old trips by URL)
- Offline support
- Printing / PDF export of log sheets

## Project structure

```
frontend/
├── package.json
├── vite.config.js              Vite config + Tailwind v4 plugin + /api proxy
├── index.html                  Entry HTML, font preconnect
└── src/
    ├── main.jsx                React entry
    ├── App.jsx                 Routes + header/footer chrome
    ├── index.css               Tailwind v4 import + design tokens (@theme)
    ├── api/
    │   └── client.js           axios instance + endpoint functions
    ├── pages/
    │   ├── PlanTripPage.jsx
    │   └── TripResultPage.jsx
    ├── components/
    │   ├── form/               TripForm, AddressField
    │   ├── map/                RouteMap, stopIcons (Leaflet divIcons)
    │   ├── logs/               LogStack, LogSheet, LogGrid (SVG)
    │   └── shared/             TripSummary, Loading, ErrorBanner
    └── hooks/
        └── useDebounce.js
```

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Set `VITE_API_BASE_URL` to the production backend
URL at build time. Deployable to Vercel, Netlify, or any static host.

## Browser support

Vite 6 targets modern browsers (Baseline Widely Available) for the
production build. The dev server uses native ESM and won't work in IE.
